"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { COOKIE, MAX_AGE_SECONDS, checkCredentials, createSessionToken } from "@/lib/auth";
import { assertAuth } from "@/lib/session";
import { connectDb } from "@/lib/db";
import { Device } from "@/lib/models";
import { parseInputDate, safePath } from "@/lib/format";
import { DEVICE_TYPES, PURPOSES, SEND_TO } from "@/lib/constants";

/* ------------------------------ auth ------------------------------ */

export async function login(_prev, formData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  let ok = false;
  try {
    ok = await checkCredentials(email, password);
  } catch (err) {
    return { error: err.message };
  }
  if (!ok) {
    await new Promise((r) => setTimeout(r, 700)); // slow down guessing
    return { error: "Wrong email or password" };
  }

  const jar = await cookies();
  jar.set(COOKIE, await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  redirect("/");
}

export async function logout() {
  const jar = await cookies();
  jar.delete(COOKIE);
  redirect("/login");
}

/* ----------------------------- devices ---------------------------- */

const TEXT_FIELDS = ["device_id", "device_model", "from", "issue_by", "workshop", "problem", "district"];
const FORM_FIELDS = [
  ...TEXT_FIELDS,
  "device_type", "send_to", "install_purpose", "device_price", "technican_charge",
  "insert_date", "sending_date", "install_date",
];

const safeNext = (n) => safePath(n, "/");

/** Go back to the list and show a "saved" toast there (?ok=...). */
function backWith(next, message) {
  const [path, hash] = next.split("#");
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}ok=${encodeURIComponent(message)}${hash ? `#${hash}` : ""}`);
}

function toNumber(raw, label) {
  if (raw === "") return { value: undefined };
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return { error: `${label} must be a positive number` };
  return { value: n };
}

async function postSale(deviceId, amount) {
  const url = process.env.TRANSACTION_URL;
  if (!url) return; // accounting integration is optional
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TRANSACTION_API_TOKEN ?? ""}`,
    },
    body: JSON.stringify({
      project: process.env.PROJECT_ID,
      from: process.env.RETAIL_DEVICES_SALES_ID,
      to: process.env.DEVICE_SALE_DEPOSIT_ID,
      date: new Date(),
      invoice_no: "Retail Device Sale",
      purpose: deviceId,
      amount,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Account Manager answered ${res.status}`);
}

/** Create (no id) or update (id) a device. Used by the add/edit form. */
export async function saveDevice(_prev, formData) {
  await assertAuth();

  const get = (k) => String(formData.get(k) ?? "").trim();
  const values = Object.fromEntries(FORM_FIELDS.map((k) => [k, get(k)]));
  values.is_complete = formData.get("is_complete") === "on";
  const id = get("id");
  const next = safeNext(get("next"));
  const fail = (error) => ({ error, values, rev: Date.now() });

  if (!values.device_id) return fail("Device ID is required");
  if (values.device_type && !DEVICE_TYPES.includes(values.device_type)) return fail("Invalid device type");
  if (values.install_purpose && !PURPOSES.includes(values.install_purpose)) return fail("Invalid install purpose");
  if (!SEND_TO.includes(values.send_to || "Store")) return fail("Invalid location");
  if (id && !mongoose.isValidObjectId(id)) return fail("Invalid device");

  const price = toNumber(values.device_price, "Price");
  const charge = toNumber(values.technican_charge, "Technician charge");
  if (price.error || charge.error) return fail(price.error || charge.error);

  const date = (k) => (values[k] ? parseInputDate(values[k]) : undefined);
  for (const k of ["insert_date", "sending_date", "install_date"]) {
    if (values[k] && !date(k)) return fail("Invalid date");
  }

  const set = { send_to: values.send_to || "Store", is_complete: values.is_complete };
  const unset = {};
  const put = (k, v) => (v === undefined || v === "" ? (unset[k] = "") : (set[k] = v));

  for (const k of TEXT_FIELDS) put(k, values[k]);
  put("device_type", values.device_type);
  put("install_purpose", values.install_purpose);
  put("device_price", price.value);
  put("technican_charge", charge.value);
  put("sending_date", date("sending_date"));
  if (date("insert_date")) set.insert_date = date("insert_date");
  else if (!id) set.insert_date = new Date();
  if (values.is_complete) set.install_date = date("install_date") ?? new Date();
  else unset.install_date = "";

  try {
    await connectDb();
    let wasComplete = false;
    if (id) {
      const prev = await Device.findById(id).select("is_complete").lean();
      if (!prev) return fail("Device not found");
      wasComplete = !!prev.is_complete;
      await Device.updateOne(
        { _id: id },
        { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
        { runValidators: true }
      );
    } else {
      await Device.create(set);
    }

    // Only on the not-sold -> sold transition (the old app posted on every edit).
    if (values.is_complete && !wasComplete) {
      try {
        await postSale(values.device_id, price.value ?? 0);
      } catch (err) {
        return fail(
          `Saved, but the accounting entry was NOT recorded (${err.message}). ` +
            `Saving again will not retry it, so add it manually.`
        );
      }
    }
  } catch (err) {
    if (err?.code === 11000) return fail(`Device ${values.device_id} already exists`);
    console.error("saveDevice failed:", err);
    return fail("Could not save the device. Please try again.");
  }

  backWith(next, id ? `${values.device_id} saved` : `${values.device_id} added`);
}

/* ------------------------ workflow forms ------------------------ */
// Each form does one job: send a device somewhere, sell it, or return it.

function formReader(formData) {
  return (k) => String(formData.get(k) ?? "").trim();
}

async function loadForWorkflow(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectDb();
  return Device.findById(id).select("device_id is_complete send_to").lean();
}

/** Store / Retail / Rangs: move a device and record who, where and when. */
export async function sendDevice(_prev, formData) {
  await assertAuth();
  const get = formReader(formData);
  const id = get("id");
  const next = safeNext(get("next"));
  const to = get("send_to");
  const values = { send_to: to, issue_by: get("issue_by"), district: get("district"), workshop: get("workshop"), sending_date: get("sending_date") };
  const fail = (error) => ({ error, values, rev: Date.now() });

  if (!["Store", "Retail", "Rangs"].includes(to)) return fail("Choose where to send the device");
  const sending = values.sending_date ? parseInputDate(values.sending_date) : new Date();
  if (!sending) return fail("Invalid sending date");
  if (to === "Retail" && !values.issue_by) return fail("Enter who the device is issued to");
  if (to === "Retail" && !values.district) return fail("Enter the district");
  if (to === "Rangs" && !values.workshop) return fail("Enter the workshop name");

  try {
    const dev = await loadForWorkflow(id);
    if (!dev) return fail("Device not found");
    const set = { send_to: to, is_complete: false };
    const unset = { install_date: "" };
    // Keep only the details that belong to the new location.
    if (to === "Retail") { set.issue_by = values.issue_by; set.district = values.district; set.sending_date = sending; unset.workshop = ""; unset.problem = ""; }
    else if (to === "Rangs") { set.workshop = values.workshop; set.sending_date = sending; unset.issue_by = ""; unset.district = ""; unset.problem = ""; }
    else { set.sending_date = sending; unset.issue_by = ""; unset.district = ""; unset.workshop = ""; unset.problem = ""; }
    await Device.updateOne({ _id: id }, { $set: set, $unset: unset }, { runValidators: true });
    revalidatePath("/", "layout");
    backWith(next, `${dev.device_id} sent to ${to}`);
  } catch (err) {
    if (err?.digest?.startsWith?.("NEXT_REDIRECT")) throw err;
    console.error("sendDevice failed:", err);
    return fail("Could not send the device. Please try again.");
  }
}

/** Retail: record the sale ("Complete" switch). Posts the accounting entry only once. */
export async function sellDevice(_prev, formData) {
  await assertAuth();
  const get = formReader(formData);
  const id = get("id");
  const next = safeNext(get("next"));
  const complete = formData.get("is_complete") === "on";
  const values = {
    is_complete: complete,
    install_purpose: get("install_purpose"),
    device_price: get("device_price"),
    technican_charge: get("technican_charge"),
    install_date: get("install_date"),
  };
  const fail = (error) => ({ error, values, rev: Date.now() });

  if (complete) {
    if (!PURPOSES.includes(values.install_purpose)) return fail("Choose the install purpose");
  }
  const price = toNumber(values.device_price, "Price");
  const charge = toNumber(values.technican_charge, "Technician charge");
  if (price.error || charge.error) return fail(price.error || charge.error);
  if (complete && price.value === undefined) return fail("Enter the device price");
  const installed = values.install_date ? parseInputDate(values.install_date) : new Date();
  if (!installed) return fail("Invalid install date");

  try {
    const dev = await loadForWorkflow(id);
    if (!dev) return fail("Device not found");
    const wasComplete = !!dev.is_complete;
    if (complete) {
      const set = { is_complete: true, install_purpose: values.install_purpose, device_price: price.value, install_date: installed };
      const unset = {};
      if (charge.value === undefined) unset.technican_charge = ""; else set.technican_charge = charge.value;
      await Device.updateOne({ _id: id }, { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) }, { runValidators: true });
      if (!wasComplete) {
        try {
          await postSale(dev.device_id, price.value ?? 0);
        } catch (err) {
          return fail(`Saved as sold, but the accounting entry was NOT recorded (${err.message}). Saving again will not retry it, so add it manually.`);
        }
      }
    } else {
      await Device.updateOne(
        { _id: id },
        { $set: { is_complete: false }, $unset: { install_date: "", install_purpose: "", device_price: "", technican_charge: "" } }
      );
    }
    revalidatePath("/", "layout");
    backWith(next, complete ? `${dev.device_id} marked as sold` : `${dev.device_id} is still unsold`);
  } catch (err) {
    if (err?.digest?.startsWith?.("NEXT_REDIRECT")) throw err;
    console.error("sellDevice failed:", err);
    return fail("Could not save the sale. Please try again.");
  }
}

/** Retail: bring a device back with a problem (to Returns, or straight to Store). */
export async function returnDevice(_prev, formData) {
  await assertAuth();
  const get = formReader(formData);
  const id = get("id");
  const next = safeNext(get("next"));
  const to = get("send_to") || "Return";
  const values = { problem: get("problem"), send_to: to };
  const fail = (error) => ({ error, values, rev: Date.now() });

  if (!["Return", "Store"].includes(to)) return fail("Choose where the device goes");
  if (!values.problem) return fail("Describe the problem");

  try {
    const dev = await loadForWorkflow(id);
    if (!dev) return fail("Device not found");
    await Device.updateOne(
      { _id: id },
      {
        $set: { send_to: to, problem: values.problem, is_complete: false, sending_date: new Date() },
        $unset: { install_date: "" },
      },
      { runValidators: true }
    );
    revalidatePath("/", "layout");
    backWith(next, `${dev.device_id} returned to ${to === "Return" ? "Returns" : "Store"}`);
  } catch (err) {
    if (err?.digest?.startsWith?.("NEXT_REDIRECT")) throw err;
    console.error("returnDevice failed:", err);
    return fail("Could not return the device. Please try again.");
  }
}

export async function deleteDevice(formData) {
  await assertAuth();
  const id = String(formData.get("id") ?? "");
  if (!mongoose.isValidObjectId(id)) return;
  await connectDb();
  await Device.findByIdAndDelete(id);
  revalidatePath("/", "layout");
}

/** Bulk add from a CSV (parsed in the browser). Existing device IDs are skipped. */
export async function importDevices(rows) {
  await assertAuth();
  if (!Array.isArray(rows) || rows.length === 0) return { error: "No rows to import" };
  if (rows.length > 2000) return { error: "Import at most 2000 rows at a time" };

  const normType = (v) => {
    const s = String(v ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
    return s === "voice" ? "Voice" : s === "non_voice" ? "Non_Voice" : undefined;
  };

  const seen = new Set();
  const docs = [];
  for (const r of rows) {
    const device_id = String(r?.device_id ?? "").trim();
    if (!device_id || seen.has(device_id)) continue;
    seen.add(device_id);
    const doc = { device_id, send_to: "Store", insert_date: new Date() };
    const model = String(r.device_model ?? "").trim();
    const from = String(r.from ?? "").trim();
    const type = normType(r.device_type);
    if (model) doc.device_model = model;
    if (from) doc.from = from;
    if (type) doc.device_type = type;
    docs.push(doc);
  }
  if (docs.length === 0) return { error: "No valid device_id found in the file" };

  await connectDb();
  let inserted = 0;
  try {
    inserted = (await Device.insertMany(docs, { ordered: false })).length;
  } catch (err) {
    // Duplicates raise a bulk error but the other rows are still inserted.
    if (err?.writeErrors || err?.code === 11000) {
      inserted = err.insertedCount ?? err.result?.insertedCount ?? docs.length - (err.writeErrors?.length ?? 0);
    } else {
      console.error("importDevices failed:", err);
      return { error: "Import failed. Please try again." };
    }
  }
  revalidatePath("/", "layout");
  return { inserted, skipped: rows.length - inserted };
}

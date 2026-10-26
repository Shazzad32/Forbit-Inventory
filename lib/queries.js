import { connectDb } from "./db";
import { Device } from "./models";
import { monthRange, parseInputDate } from "./format";
import { PURPOSES } from "./constants";

export const PAGE_SIZE = 50;

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const SEARCH_FIELDS = ["device_id", "device_model", "issue_by", "district", "from", "workshop"];

function withSearch(match, q) {
  const text = String(q ?? "").trim();
  if (!text) return match;
  const rx = new RegExp(escapeRegex(text), "i");
  return { $and: [match, { $or: SEARCH_FIELDS.map((k) => ({ [k]: rx })) }] };
}

const plain = (d) => ({ ...d, _id: String(d._id) });

/** One page of devices + total count. Only the needed page leaves the database. */
export async function listDevices({ match, q, page = 1, sort, pageSize = PAGE_SIZE }) {
  await connectDb();
  const filter = withSearch(match, q);
  const [rows, total] = await Promise.all([
    Device.find(filter)
      .select("-__v")
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Device.countDocuments(filter),
  ]);
  return { rows: rows.map(plain), total, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Every row for a filter (used by CSV export). */
export async function allDevices({ match, q, sort }) {
  await connectDb();
  const rows = await Device.find(withSearch(match, q)).select("-__v").sort(sort).lean();
  return rows.map(plain);
}

export async function getDevice(id) {
  await connectDb();
  const d = await Device.findById(id).select("-__v").lean();
  return d ? plain(d) : null;
}

export async function technicianNames() {
  await connectDb();
  const names = await Device.distinct("issue_by", { issue_by: { $nin: [null, ""] } });
  return names.sort((a, b) => a.localeCompare(b));
}

export async function workshopNames() {
  await connectDb();
  const names = await Device.distinct("workshop", { workshop: { $nin: [null, ""] } });
  return names.sort((a, b) => a.localeCompare(b));
}

/** { total, voice, nonVoice } for a filter, via one aggregate. */
export async function countsByType(match) {
  await connectDb();
  const groups = await Device.aggregate([
    { $match: match },
    { $group: { _id: "$device_type", n: { $sum: 1 } } },
  ]);
  const get = (t) => groups.find((g) => g._id === t)?.n ?? 0;
  const total = groups.reduce((a, g) => a + g.n, 0);
  return { total, voice: get("Voice"), nonVoice: get("Non_Voice") };
}

export const SOLD_BASE = { send_to: "Retail", is_complete: true };

export function soldMatch({ from, to, purpose }) {
  const match = { ...SOLD_BASE };
  const start = parseInputDate(from);
  const end = parseInputDate(to);
  if (start || end) {
    match.install_date = {};
    if (start) match.install_date.$gte = start;
    if (end) match.install_date.$lt = new Date(end.getTime() + 24 * 3600 * 1000);
  }
  if (PURPOSES.includes(purpose)) match.install_purpose = purpose;
  return match;
}

export async function soldTotals(match) {
  await connectDb();
  const [r] = await Device.aggregate([
    { $match: match },
    { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: { $ifNull: ["$device_price", 0] } } } },
  ]);
  return { count: r?.count ?? 0, amount: r?.amount ?? 0 };
}

export const UNSOLD_RETAIL = { send_to: "Retail", is_complete: { $ne: true } };

/** Device IDs of every unsold retail device (small: one short string each). */
export async function unsoldRetailIds() {
  await connectDb();
  return Device.distinct("device_id", UNSOLD_RETAIL);
}

/** Devices per technician for a filter (default: unsold retail). */
export async function technicianSummary(match = UNSOLD_RETAIL) {
  await connectDb();
  const rows = await Device.aggregate([
    { $match: match },
    { $group: { _id: { $ifNull: ["$issue_by", ""] }, n: { $sum: 1 } } },
    { $sort: { n: -1, _id: 1 } },
  ]);
  return rows.map((r) => ({ name: r._id || "(no technician)", n: r.n }));
}

/** Everything the dashboard shows, in three small aggregates (no full-collection load). */
export async function dashboardStats(ym) {
  await connectDb();
  const month = monthRange(ym);

  const [groups, [soldAll], byPurpose] = await Promise.all([
    Device.aggregate([
      {
        $group: {
          _id: { s: "$send_to", t: "$device_type", c: { $ifNull: ["$is_complete", false] } },
          n: { $sum: 1 },
        },
      },
    ]),
    Device.aggregate([
      { $match: SOLD_BASE },
      { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: { $ifNull: ["$device_price", 0] } } } },
    ]),
    Device.aggregate([
      { $match: { ...SOLD_BASE, install_date: { $gte: month.start, $lt: month.end } } },
      {
        $group: {
          _id: "$install_purpose",
          n: { $sum: 1 },
          amount: { $sum: { $ifNull: ["$device_price", 0] } },
        },
      },
    ]),
  ]);

  const count = (pred) => groups.filter((g) => pred(g._id)).reduce((a, g) => a + g.n, 0);
  const section = (s, extra = () => true) => ({
    total: count((k) => k.s === s && extra(k)),
    voice: count((k) => k.s === s && extra(k) && k.t === "Voice"),
    nonVoice: count((k) => k.s === s && extra(k) && k.t === "Non_Voice"),
  });

  const purposes = Object.fromEntries(PURPOSES.map((p) => [p, 0]));
  let monthCount = 0;
  let monthAmount = 0;
  for (const r of byPurpose) {
    monthCount += r.n;
    monthAmount += r.amount;
    if (r._id in purposes) purposes[r._id] = r.n;
  }

  return {
    totalDevices: groups.reduce((a, g) => a + g.n, 0),
    store: section("Store"),
    retail: section("Retail", (k) => !k.c), // unsold only
    rangs: section("Rangs"),
    returned: section("Return"),
    sold: { count: soldAll?.count ?? 0, amount: soldAll?.amount ?? 0 },
    month: { ...month, count: monthCount, amount: monthAmount, purposes },
  };
}

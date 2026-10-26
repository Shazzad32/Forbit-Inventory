"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveDevice } from "@/app/actions";
import { DEVICE_TYPES, DISTRICTS, PURPOSES, SEND_TO } from "@/lib/constants";
import Icon from "./Icon";

function Field({ id, label, wide, children }) {
  return (
    <div className={wide ? "wide" : undefined}>
      <label className="lab" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  );
}

/**
 * `device` holds string values (dates as yyyy-mm-dd). After a failed save the
 * server sends the typed values back so nothing is lost.
 */
export default function DeviceForm({ device = {}, technicians = [], next = "/" }) {
  const [state, action, pending] = useActionState(saveDevice, {});
  const v = { ...device, ...(state.values ?? {}) };
  const isEdit = Boolean(device.id);

  return (
    <form key={state.rev ?? 0} action={action} className="panel form">
      <input type="hidden" name="id" value={device.id ?? ""} />
      <input type="hidden" name="next" value={next} />

      {state.error && (
        <p role="alert" className="alert">
          <Icon name="alert" />
          <span>{state.error}</span>
        </p>
      )}

      <section className="fsec">
        <h2>Device</h2>
        <div className="fgrid">
          <Field id="d-id" label="Device ID *">
            <input id="d-id" name="device_id" required defaultValue={v.device_id ?? ""} className="field mono" inputMode="numeric" autoComplete="off" />
          </Field>
          <Field id="d-model" label="Model">
            <input id="d-model" name="device_model" defaultValue={v.device_model ?? ""} className="field" />
          </Field>
          <Field id="d-type" label="Type">
            <select id="d-type" name="device_type" defaultValue={v.device_type ?? ""} className="field">
              <option value="">Not set</option>
              {DEVICE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === "Non_Voice" ? "Non-voice" : t}
                </option>
              ))}
            </select>
          </Field>
          <Field id="d-from" label="From (supplier)">
            <input id="d-from" name="from" defaultValue={v.from ?? ""} className="field" />
          </Field>
        </div>
      </section>

      <section className="fsec">
        <h2>Location and people</h2>
        <div className="fgrid">
          <Field id="d-loc" label="Location">
            <select id="d-loc" name="send_to" defaultValue={v.send_to || "Store"} className="field">
              {SEND_TO.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field id="d-tech" label="Technician / issued to">
            <input id="d-tech" name="issue_by" list="technicians" defaultValue={v.issue_by ?? ""} className="field" autoComplete="off" />
          </Field>
          <Field id="d-district" label="District">
            <input id="d-district" name="district" list="districts" defaultValue={v.district ?? ""} className="field" autoComplete="off" />
          </Field>
          <Field id="d-workshop" label="Workshop (Rangs)">
            <input id="d-workshop" name="workshop" defaultValue={v.workshop ?? ""} className="field" />
          </Field>
          <Field id="d-problem" label="Problem (for returns)" wide>
            <input id="d-problem" name="problem" defaultValue={v.problem ?? ""} className="field" />
          </Field>
        </div>
      </section>

      <section className="fsec">
        <h2>Sale and dates</h2>
        <div className="fgrid">
          <Field id="d-purpose" label="Install purpose">
            <select id="d-purpose" name="install_purpose" defaultValue={v.install_purpose ?? ""} className="field">
              <option value="">Not set</option>
              {PURPOSES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field id="d-price" label="Price (৳)">
            <input id="d-price" name="device_price" type="number" inputMode="decimal" min="0" step="any" defaultValue={v.device_price ?? ""} className="field" />
          </Field>
          <Field id="d-charge" label="Technician charge (৳)">
            <input id="d-charge" name="technican_charge" type="number" inputMode="decimal" min="0" step="any" defaultValue={v.technican_charge ?? ""} className="field" />
          </Field>
          <Field id="d-insert" label="Insert date">
            <input id="d-insert" name="insert_date" type="date" defaultValue={v.insert_date ?? ""} className="field" />
          </Field>
          <Field id="d-sending" label="Sending date">
            <input id="d-sending" name="sending_date" type="date" defaultValue={v.sending_date ?? ""} className="field" />
          </Field>
          <Field id="d-install" label="Install date (when sold)">
            <input id="d-install" name="install_date" type="date" defaultValue={v.install_date ?? ""} className="field" />
          </Field>
          <div className="wide">
            <label className="check">
              <input type="checkbox" name="is_complete" defaultChecked={Boolean(v.is_complete)} />
              <span>
                Sold / installation complete
                <small>Counts as a sale and moves the device to Sold devices.</small>
              </span>
            </label>
          </div>
        </div>
      </section>

      <datalist id="technicians">
        {technicians.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
      <datalist id="districts">
        {DISTRICTS.map((d) => (
          <option key={d} value={d} />
        ))}
      </datalist>

      <div className="form-actions">
        <button type="submit" disabled={pending} className="btn">
          {pending ? "Saving…" : isEdit ? "Save changes" : "Add device"}
        </button>
        <Link href={next} className="btn btn-ghost">
          Cancel
        </Link>
      </div>
    </form>
  );
}

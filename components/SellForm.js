"use client";

import { useActionState, useState } from "react";
import { sellDevice } from "@/app/actions";
import { PURPOSES } from "@/lib/constants";
import { DeviceFields, Field, FormError, FormFooter } from "./FormParts";

export default function SellForm({ device, next, today, editHref }) {
  const [state, action, pending] = useActionState(sellDevice, {});
  const v = { ...device, ...(state.values ?? {}) };
  const [complete, setComplete] = useState(Boolean(v.is_complete));

  return (
    <form key={state.rev ?? 0} action={action} className="panel form">
      <input type="hidden" name="id" value={device.id} />
      <input type="hidden" name="next" value={next} />
      <FormError error={state.error} />

      <section className="fsec">
        <DeviceFields device={device} />
      </section>

      <section className="fsec">
        <label className={`switch${complete ? " on" : ""}`}>
          <input type="checkbox" name="is_complete" checked={complete} onChange={(e) => setComplete(e.target.checked)} role="switch" />
          <span className="track" aria-hidden="true" />
          <span className="switch-text">
            Complete
            <small>Turn on when the device is installed and sold.</small>
          </span>
        </label>

        {complete && (
          <div className="reveal">
            <fieldset className="field-set">
              <legend className="lab">Install purpose</legend>
              <div className="segments">
                {PURPOSES.map((p) => (
                  <label key={p} className="segment">
                    <input type="radio" name="install_purpose" value={p} defaultChecked={v.install_purpose === p} required />
                    <span>{p}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="fgrid">
              <Field id="x-price" label="Device price (৳)">
                <input id="x-price" name="device_price" type="number" inputMode="decimal" min="0" step="any" required defaultValue={v.device_price ?? ""} className="field" />
              </Field>
              <Field id="x-charge" label="Technician charge (৳)">
                <input id="x-charge" name="technican_charge" type="number" inputMode="decimal" min="0" step="any" defaultValue={v.technican_charge ?? ""} className="field" />
              </Field>
              <Field id="x-date" label="Install date">
                <input id="x-date" name="install_date" type="date" defaultValue={v.install_date || today} className="field" />
              </Field>
            </div>
          </div>
        )}
      </section>

      <FormFooter pending={pending} label={complete ? "Mark as sold" : "Save"} busy="Saving…" next={next} editHref={editHref} />
    </form>
  );
}

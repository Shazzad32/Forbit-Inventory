"use client";

import { useActionState, useState } from "react";
import { sendDevice } from "@/app/actions";
import { DISTRICTS, LOCATIONS } from "@/lib/constants";
import Icon from "./Icon";
import { DeviceFields, Field, FormError, FormFooter } from "./FormParts";

const OPTIONS = ["Store", "Retail", "Rangs"];

export default function SendForm({ device, technicians, workshops, next, initialTo, today, editHref }) {
  const [state, action, pending] = useActionState(sendDevice, {});
  const v = state.values ?? {};
  const [to, setTo] = useState(v.send_to || initialTo);

  return (
    <form key={state.rev ?? 0} action={action} className="panel form">
      <input type="hidden" name="id" value={device.id} />
      <input type="hidden" name="next" value={next} />
      <FormError error={state.error} />

      <section className="fsec">
        <DeviceFields device={device} />
      </section>

      <section className="fsec">
        <h2>Send to</h2>
        <div className="choices" role="radiogroup" aria-label="Send to">
          {OPTIONS.map((o) => (
            <label key={o} className="choice" style={{ "--loc": LOCATIONS[o].color }}>
              <input type="radio" name="send_to" value={o} checked={to === o} onChange={() => setTo(o)} />
              <span className="choice-body">
                <Icon name={LOCATIONS[o].icon} />
                <b>{o}</b>
                <small>{LOCATIONS[o].note}</small>
              </span>
            </label>
          ))}
        </div>

        <div className="fgrid reveal" key={to}>
          {to === "Rangs" && (
            <Field id="s-workshop" label="Workshop">
              <input id="s-workshop" name="workshop" list="workshops" required defaultValue={v.workshop ?? device.workshop} className="field" autoComplete="off" />
            </Field>
          )}
          {to === "Retail" && (
            <>
              <Field id="s-issue" label="Issue to (technician)">
                <input id="s-issue" name="issue_by" list="technicians" required defaultValue={v.issue_by ?? device.issue_by} className="field" autoComplete="off" />
              </Field>
              <Field id="s-district" label="District">
                <input id="s-district" name="district" list="districts" required defaultValue={v.district ?? device.district} className="field" autoComplete="off" />
              </Field>
            </>
          )}
          <Field id="s-date" label="Sending date">
            <input id="s-date" name="sending_date" type="date" defaultValue={v.sending_date ?? today} className="field" />
          </Field>
        </div>
      </section>

      <datalist id="technicians">{technicians.map((t) => <option key={t} value={t} />)}</datalist>
      <datalist id="workshops">{workshops.map((t) => <option key={t} value={t} />)}</datalist>
      <datalist id="districts">{DISTRICTS.map((t) => <option key={t} value={t} />)}</datalist>

      <FormFooter pending={pending} label={`Send to ${to}`} busy="Sending…" next={next} editHref={editHref} />
    </form>
  );
}

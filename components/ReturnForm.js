"use client";

import { useActionState } from "react";
import { returnDevice } from "@/app/actions";
import { LOCATIONS } from "@/lib/constants";
import Icon from "./Icon";
import { DeviceFields, Field, FormError, FormFooter } from "./FormParts";

const OPTIONS = [
  { to: "Return", label: "Returns", note: "Keep it in the returns list" },
  { to: "Store", label: "Store", note: "Back in stock" },
];

export default function ReturnForm({ device, next, editHref }) {
  const [state, action, pending] = useActionState(returnDevice, {});
  const v = state.values ?? {};

  return (
    <form key={state.rev ?? 0} action={action} className="panel form">
      <input type="hidden" name="id" value={device.id} />
      <input type="hidden" name="next" value={next} />
      <FormError error={state.error} />

      <section className="fsec">
        <DeviceFields device={device} />
      </section>

      <section className="fsec">
        <Field id="r-problem" label="Problem" wide>
          <textarea id="r-problem" name="problem" required rows={3} defaultValue={v.problem ?? device.problem} className="field" placeholder="What is wrong with the device?" />
        </Field>

        <h2 className="after">Send to</h2>
        <div className="choices two" role="radiogroup" aria-label="Send to">
          {OPTIONS.map((o) => (
            <label key={o.to} className="choice" style={{ "--loc": LOCATIONS[o.to].color }}>
              <input type="radio" name="send_to" value={o.to} defaultChecked={(v.send_to || "Return") === o.to} />
              <span className="choice-body">
                <Icon name={LOCATIONS[o.to].icon} />
                <b>{o.label}</b>
                <small>{o.note}</small>
              </span>
            </label>
          ))}
        </div>
      </section>

      <FormFooter pending={pending} label="Return device" busy="Saving…" next={next} editHref={editHref} />
    </form>
  );
}

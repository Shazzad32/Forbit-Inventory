import Link from "next/link";
import Icon from "./Icon";
import { LOCATIONS } from "@/lib/constants";

export function Field({ id, label, hint, wide, children }) {
  return (
    <div className={wide ? "wide" : undefined}>
      <label className="lab" htmlFor={id}>
        {label}
      </label>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

/** Read-only device ID and type, as in the old forms. Disabled inputs are not submitted; the id travels in a hidden field. */
export function DeviceFields({ device }) {
  return (
    <div className="fgrid">
      <Field id="f-devid" label="Device ID">
        <input id="f-devid" value={device.device_id} readOnly className="field mono locked" />
      </Field>
      <Field id="f-devtype" label="Device type">
        <input id="f-devtype" value={device.device_type === "Non_Voice" ? "Non-voice" : device.device_type || "Not set"} readOnly className="field locked" />
      </Field>
    </div>
  );
}

export function Where({ at }) {
  const loc = LOCATIONS[at] ?? LOCATIONS.Store;
  return (
    <span className="where" style={{ "--loc": loc.color }}>
      <Icon name={loc.icon} />
      {at}
    </span>
  );
}

export function FormError({ error }) {
  if (!error) return null;
  return (
    <p role="alert" className="alert">
      <Icon name="alert" />
      <span>{error}</span>
    </p>
  );
}

export function FormFooter({ pending, label, busy, next, editHref }) {
  return (
    <div className="form-actions">
      <button type="submit" disabled={pending} className="btn">
        {pending ? busy : label}
      </button>
      <Link href={next} className="btn btn-ghost">
        Cancel
      </Link>
      {editHref && (
        <Link href={editHref} className="textlink">
          Edit all details
        </Link>
      )}
    </div>
  );
}

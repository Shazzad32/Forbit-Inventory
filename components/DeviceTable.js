import Link from "next/link";
import { deleteDevice } from "@/app/actions";
import { fmtDate, money } from "@/lib/format";
import ConfirmButton from "./ConfirmButton";
import Icon from "./Icon";

const TYPE_LABEL = { Voice: "Voice", Non_Voice: "Non-voice" };

function Cell({ row, col }) {
  const v = row[col.key];
  if (v == null || v === "") return <span className="muted">—</span>;
  if (col.type === "date") return fmtDate(v);
  if (col.type === "money") return <span className="num">৳ {money(v)}</span>;
  if (col.key === "device_type") {
    return <span className={`pill ${v === "Voice" ? "pill-voice" : "pill-nonvoice"}`}>{TYPE_LABEL[v] ?? v}</span>;
  }
  if (col.key === "install_purpose") return <span className={`pill pill-${String(v).toLowerCase()}`}>{v}</span>;
  return v;
}

/**
 * One table for every list page. On wide screens it is a normal table; on phones every row
 * becomes a card (labels come from the `data-label` attribute), so it never scrolls sideways.
 * The first column is the device ID and acts as the card title.
 * `quick` = row shortcuts like "To Retail" (each opens its own form); `editForm` = which form the edit button opens; `back` = where to return after editing.
 * Pass `actions={false}` for a read-only table.
 */
export default function DeviceTable({ columns, rows, quick = [], editForm, back = "/", actions = true, emptyHint }) {
  const next = encodeURIComponent(back);

  if (rows.length === 0) {
    return (
      <div className="panel empty">
        <Icon name="store" />
        <b>No devices found</b>
        <span>{emptyHint ?? "Try a different search, or add a new device."}</span>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className={`table-wrap${columns.length >= 7 ? " wide" : ""}`}>
        <table className="tbl">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col">
                  {c.label}
                </th>
              ))}
              {actions && (
                <th scope="col" className="actions">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id}>
                {columns.map((c, i) => (
                  <td
                    key={c.key}
                    data-label={c.label}
                    className={i === 0 ? "primary" : c.key === "problem" ? "cell-text" : c.type ? "nw" : undefined}
                  >
                    <Cell row={r} col={c} />
                  </td>
                ))}
                {actions && (
                  <td className="actions">
                    <span className="row-actions">
                      {quick.map((q) => (
                        <Link key={q.to} className="go" href={`/devices/${r._id}/${q.form ?? "send"}?to=${q.to}&next=${next}`}>
                          {q.label} <Icon name="arrow" />
                        </Link>
                      ))}
                      <Link
                        className="icon-btn"
                        href={`/devices/${r._id}${editForm ? `/${editForm}` : ""}?next=${next}`}
                        aria-label={`Edit device ${r.device_id}`}
                        title="Edit"
                      >
                        <Icon name="edit" />
                        <span className="txt">Edit</span>
                      </Link>
                      <form action={deleteDevice}>
                        <input type="hidden" name="id" value={r._id} />
                        <ConfirmButton
                          message={`Delete device ${r.device_id}? This cannot be undone.`}
                          className="icon-btn danger"
                          label={`Delete device ${r.device_id}`}
                        >
                          <Icon name="trash" />
                          <span className="txt">Delete</span>
                        </ConfirmButton>
                      </form>
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

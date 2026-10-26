// Dates are stored in UTC. We show / read them in a fixed UTC offset
// (Bangladesh has no DST, so a fixed offset is enough).
const OFFSET_MS = (Number(process.env.TZ_OFFSET_HOURS ?? 6) || 0) * 3600 * 1000;

const pad = (n) => String(n).padStart(2, "0");

function shifted(d) {
  const t = new Date(d).getTime();
  return Number.isNaN(t) ? null : new Date(t + OFFSET_MS);
}

/** 21-10-2026 */
export function fmtDate(d) {
  if (!d) return "";
  const s = shifted(d);
  if (!s) return "";
  return `${pad(s.getUTCDate())}-${pad(s.getUTCMonth() + 1)}-${s.getUTCFullYear()}`;
}

/** 2026-10-21 (value for <input type="date">) */
export function toInputDate(d) {
  if (!d) return "";
  const s = shifted(d);
  if (!s) return "";
  return `${s.getUTCFullYear()}-${pad(s.getUTCMonth() + 1)}-${pad(s.getUTCDate())}`;
}

/** "2026-10-21" -> Date at local midnight (as UTC instant). Invalid -> null. */
export function parseInputDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s ?? "").trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = Date.UTC(y, mo - 1, d);
  const check = new Date(t);
  if (check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null;
  return new Date(t - OFFSET_MS);
}

export const todayInput = () => toInputDate(new Date());

/** "2026-10" -> [startInstant, endInstant) in local time. Invalid -> current month. */
export function monthRange(ym) {
  let y, m;
  const match = /^(\d{4})-(\d{2})$/.exec(ym ?? "");
  if (match && Number(match[2]) >= 1 && Number(match[2]) <= 12) {
    y = Number(match[1]);
    m = Number(match[2]);
  } else {
    const now = shifted(new Date());
    y = now.getUTCFullYear();
    m = now.getUTCMonth() + 1;
  }
  const start = new Date(Date.UTC(y, m - 1, 1) - OFFSET_MS);
  const end = new Date(Date.UTC(y, m, 1) - OFFSET_MS);
  const key = `${y}-${pad(m)}`;
  const prev = m === 1 ? `${y - 1}-12` : `${y}-${pad(m - 1)}`;
  const next = m === 12 ? `${y + 1}-01` : `${y}-${pad(m + 1)}`;
  const label = new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return { start, end, key, prev, next, label };
}

export const money = (n) => Number(n || 0).toLocaleString("en-US");

/** First value of a search param (Next gives string | string[] | undefined). */
export function one(v) {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

/** Make a CSV cell safe (quotes + spreadsheet formula injection). */
export function csvCell(v) {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Only same-site paths ("/store?page=2") are allowed as a "go back here" target. */
export function safePath(v, fallback = "/") {
  const s = one(v);
  return /^\/(?!\/)/.test(s) ? s : fallback;
}

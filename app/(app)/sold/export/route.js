import { allDevices, soldMatch } from "@/lib/queries";
import { SOLD_COLUMNS } from "@/lib/constants";
import { csvCell, fmtDate, toInputDate } from "@/lib/format";
import { isAuthed } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!(await isAuthed())) return new Response("Unauthorized", { status: 401 });

  const p = new URL(request.url).searchParams;
  const rows = await allDevices({
    match: soldMatch({ from: p.get("from"), to: p.get("to"), purpose: p.get("purpose") }),
    q: p.get("q") ?? "",
    sort: { install_date: -1, _id: -1 },
  });

  const header = SOLD_COLUMNS.map((c) => csvCell(c.label)).join(",");
  const lines = rows.map((r) =>
    SOLD_COLUMNS.map((c) => csvCell(c.type === "date" ? fmtDate(r[c.key]) : r[c.key])).join(",")
  );
  // BOM so Excel opens it as UTF-8.
  const body = "﻿" + [header, ...lines].join("\r\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sold-devices-${toInputDate(new Date())}.csv"`,
    },
  });
}

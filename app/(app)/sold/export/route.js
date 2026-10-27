// import { allDevices, soldMatch } from "@/lib/queries";
// import { SOLD_COLUMNS } from "@/lib/constants";
// import { csvCell, fmtDate, toInputDate } from "@/lib/format";
// import { isAuthed } from "@/lib/session";

// export const dynamic = "force-dynamic";

// export async function GET(request) {
//   if (!(await isAuthed())) return new Response("Unauthorized", { status: 401 });

//   const p = new URL(request.url).searchParams;
//   const rows = await allDevices({
//     match: soldMatch({ from: p.get("from"), to: p.get("to"), purpose: p.get("purpose") }),
//     q: p.get("q") ?? "",
//     sort: { install_date: -1, _id: -1 },
//   });

//   const header = SOLD_COLUMNS.map((c) => csvCell(c.label)).join(",");
//   const lines = rows.map((r) =>
//     SOLD_COLUMNS.map((c) => csvCell(c.type === "date" ? fmtDate(r[c.key]) : r[c.key])).join(",")
//   );
//   // BOM so Excel opens it as UTF-8.
//   const body = "﻿" + [header, ...lines].join("\r\n");

//   return new Response(body, {
//     headers: {
//       "Content-Type": "text/csv; charset=utf-8",
//       "Content-Disposition": `attachment; filename="sold-devices-${toInputDate(new Date())}.csv"`,
//     },
//   });
// }

import ExcelJS from "exceljs";
import { allDevices, soldMatch } from "@/lib/queries";
import { SOLD_COLUMNS } from "@/lib/constants";
import { fmtDate, toInputDate } from "@/lib/format";
import { isAuthed } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!(await isAuthed())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const p = new URL(request.url).searchParams;
  const from = p.get("from");
  const to = p.get("to");
  const purpose = p.get("purpose");

  const rows = await allDevices({
    match: soldMatch({ from, to, purpose }),
    q: p.get("q") ?? "",
    sort: { install_date: -1, _id: -1 },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("SoldDevices");

  // Match the shared Excel file's column widths.
  sheet.columns = [
    { key: "sl", width: 5 },
    ...SOLD_COLUMNS.map((c) => ({
      key: c.key,
      width: c.key === "device_id" ? 30 : 20,
    })),
  ];

  // Title
  sheet.mergeCells(1, 2, 1, SOLD_COLUMNS.length + 1);
  sheet.getCell("B1").value = "Device Bill";
  sheet.getCell("B1").alignment = { horizontal: "center" };

  // Date range
  sheet.mergeCells(2, 2, 2, SOLD_COLUMNS.length + 1);
  sheet.getCell("B2").value = `Date On: ${from || "All"} to ${to || "All"}`;

  // Table header
  const headers = ["SL", ...SOLD_COLUMNS.map((c) => c.label)];
  sheet.addRow([]);
  sheet.addRow(headers);

  const headerRow = sheet.getRow(4);
  headerRow.font = { bold: true };
  headerRow.alignment = {
    vertical: "middle",
    horizontal: "center",
  };

  // Table data
  rows.forEach((r, index) => {
    const values = [
      index + 1,
      ...SOLD_COLUMNS.map((c) => {
        const value = r[c.key];

        if (value == null) return "";

        if (c.type === "date") {
          return fmtDate(value);
        }

        return value;
      }),
    ];

    sheet.addRow(values);
  });

  // Borders and alignment
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber < 4) return;

    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: rowNumber === 4 ? "center" : "left",
      };
    });
  });

  sheet.views = [{ state: "frozen", ySplit: 4 }];

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="sold-devices-${toInputDate(
        new Date()
      )}.xlsx"`,
    },
  });
}

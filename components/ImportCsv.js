"use client";

import { useRef, useState, useTransition } from "react";
import { importDevices } from "@/app/actions";
import Icon from "./Icon";

// Small CSV reader (quoted cells, "" escapes, CRLF). No spreadsheet library needed:
// in Excel use File → Save As → CSV.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((x) => x.trim() !== ""));
}

const ALIASES = {
  device_id: ["device_id", "deviceid", "imei", "id"],
  device_model: ["device_model", "model"],
  device_type: ["device_type", "type"],
  from: ["from", "supplier"],
};

export default function ImportCsv() {
  const input = useRef(null);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const table = parseCsv(await file.text());
    if (table.length < 2) return setMsg("The file needs a header row and at least one device.");

    const head = table[0].map((h) => h.trim().toLowerCase().replace(/[\s-]+/g, "_"));
    const col = Object.fromEntries(
      Object.entries(ALIASES).map(([key, names]) => [key, head.findIndex((h) => names.includes(h))])
    );
    if (col.device_id < 0) return setMsg("No device_id column found in the header row.");

    const rows = table.slice(1).map((r) =>
      Object.fromEntries(Object.entries(col).map(([k, i]) => [k, i >= 0 ? r[i] ?? "" : ""]))
    );
    setMsg("Importing…");
    start(async () => {
      const res = await importDevices(rows);
      setMsg(res.error ? res.error : `Imported ${res.inserted} device(s), skipped ${res.skipped} (duplicate or empty).`);
    });
  }

  return (
    <>
      <input ref={input} type="file" accept=".csv,text/csv" onChange={onFile} className="sr-only" tabIndex={-1} aria-hidden="true" />
      <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => input.current?.click()}>
        <Icon name="upload" /> Import CSV
      </button>
      {msg && (
        <p className="flash" role="status">
          {msg}
        </p>
      )}
    </>
  );
}

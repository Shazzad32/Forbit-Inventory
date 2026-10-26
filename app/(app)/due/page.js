import Link from "next/link";
import { listDevices, technicianSummary } from "@/lib/queries";
import { one } from "@/lib/format";
import PageHeader from "@/components/PageHeader";
import SearchBox from "@/components/SearchBox";
import DeviceTable from "@/components/DeviceTable";
import Pagination from "@/components/Pagination";

export const dynamic = "force-dynamic";
export const metadata = { title: "Technician report" };

const COLUMNS = [
  { key: "device_id", label: "Device ID" },
  { key: "issue_by", label: "Technician" },
  { key: "district", label: "District" },
  { key: "sending_date", label: "Sending date", type: "date" },
];

const MATCH = { send_to: "Retail", is_complete: { $ne: true } };

// Unsold devices that are still with technicians, grouped by who has them.
export default async function TechReport({ searchParams }) {
  const sp = await searchParams;
  const q = one(sp.q).slice(0, 60);
  const page = Math.max(1, parseInt(one(sp.page), 10) || 1);

  const [list, summary] = await Promise.all([
    listDevices({ match: MATCH, q, page, sort: { issue_by: 1, sending_date: 1, _id: 1 }, pageSize: 100 }),
    technicianSummary(),
  ]);
  const total = summary.reduce((a, t) => a + t.n, 0);

  return (
    <div className="page">
      <PageHeader
        title="Technician report"
        sub="Unsold devices still with technicians"
        stats={[
          { label: "Devices out", value: total },
          { label: "Technicians", value: summary.length },
        ]}
      >
        <Link href="/retail" className="btn btn-ghost">
          Back to retail
        </Link>
      </PageHeader>

      {summary.length > 0 && (
        <div className="chips" aria-label="Filter by technician">
          {summary.map((t) => (
            <Link
              key={t.name}
              className="chip"
              href={t.name === "(no technician)" ? "/due" : `/due?q=${encodeURIComponent(t.name)}`}
            >
              {t.name} <b>{t.n}</b>
            </Link>
          ))}
        </div>
      )}

      <div className="toolbar">
        <SearchBox q={q} clearHref="/due" />
      </div>

      <DeviceTable editForm="sell"
        columns={COLUMNS}
        rows={list.rows}
        back={`/due${q ? `?q=${encodeURIComponent(q)}` : ""}`}
        actions={false}
        emptyHint="No devices are currently out with technicians."
      />
      <Pagination basePath="/due" params={{ q }} page={page} pages={list.pages} total={list.total} />
    </div>
  );
}

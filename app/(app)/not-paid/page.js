import Link from "next/link";
import { getAssignedIds } from "@/lib/assign";
import { UNSOLD_RETAIL, listDevices, technicianSummary } from "@/lib/queries";
import { one } from "@/lib/format";
import PageHeader from "@/components/PageHeader";
import SearchBox from "@/components/SearchBox";
import DeviceTable from "@/components/DeviceTable";
import Pagination from "@/components/Pagination";
import Icon from "@/components/Icon";

export const dynamic = "force-dynamic";
export const metadata = { title: "Due list" };

const COLUMNS = [
  { key: "device_id", label: "Device ID" },
  { key: "issue_by", label: "Technician" },
  { key: "district", label: "District" },
  { key: "sending_date", label: "Sending date", type: "date" },
];

// Unsold retail devices that are already connected on a tracking server: the device works, the money is due.
export default async function DueList({ searchParams }) {
  const sp = await searchParams;
  const q = one(sp.q).slice(0, 60);
  const page = Math.max(1, parseInt(one(sp.page), 10) || 1);

  const assigned = await getAssignedIds();

  if (!assigned.configured) {
    return (
      <div className="page">
        <PageHeader title="Due list" sub="Connected to the server, payment still due" />
        <div className="panel empty">
          <Icon name="alert" />
          <b>Server lists are not set up</b>
          <span>
            Add RETAIL_ASSIGN_ID, TIKTIKI_ASSIGN_ID and AUTH_TOKEN to the environment variables, then restart.
          </span>
        </div>
      </div>
    );
  }

  const match = { ...UNSOLD_RETAIL, device_id: { $in: [...assigned.ids] } };
  const nothingToQuery = assigned.ids.size === 0;
  const [list, summary] = nothingToQuery
    ? [{ rows: [], total: 0, pages: 1 }, []]
    : await Promise.all([
        listDevices({ match, q, page, sort: { issue_by: 1, sending_date: 1, _id: 1 }, pageSize: 100 }),
        technicianSummary(match),
      ]);
  const total = summary.reduce((a, t) => a + t.n, 0);
  const allFailed = assigned.failed.length > 0 && nothingToQuery;

  return (
    <div className="page">
      <PageHeader
        title="Due list"
        sub="Connected to the server, payment still due"
        stats={[
          { label: "Devices due", value: total },
          { label: "Technicians", value: summary.length },
        ]}
      >
        <Link href="/retail" className="btn btn-ghost">
          Back to retail
        </Link>
      </PageHeader>

      {assigned.failed.length > 0 && (
        <p className="alert" role="alert" style={{ margin: 0 }}>
          <Icon name="alert" />
          <span>
            {assigned.failed.map((f) => `${f.name} list ${f.error}`).join("; ")}.{" "}
            {allFailed
              ? "No due devices can be shown right now. Refresh to try again."
              : "This list may be missing some devices. Refresh to try again."}
          </span>
        </p>
      )}

      {summary.length > 0 && (
        <div className="chips" aria-label="Filter by technician">
          {summary.map((t) => (
            <Link
              key={t.name}
              className="chip"
              href={t.name === "(no technician)" ? "/not-paid" : `/not-paid?q=${encodeURIComponent(t.name)}`}
            >
              {t.name} <b>{t.n}</b>
            </Link>
          ))}
        </div>
      )}

      <div className="toolbar">
        <SearchBox q={q} clearHref="/not-paid" />
      </div>

      <DeviceTable editForm="sell"
        columns={COLUMNS}
        rows={list.rows}
        back={`/not-paid${q ? `?q=${encodeURIComponent(q)}` : ""}`}
        emptyHint={allFailed ? "The server lists could not be loaded." : q ? `Nothing matches “${q}”.` : "No connected device is waiting for payment."}
      />
      <Pagination basePath="/not-paid" params={{ q }} page={page} pages={list.pages} total={list.total} />
    </div>
  );
}

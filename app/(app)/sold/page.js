import Link from "next/link";
import { SOLD_COLUMNS, PURPOSES } from "@/lib/constants";
import { listDevices, soldMatch, soldTotals } from "@/lib/queries";
import { money, one } from "@/lib/format";
import PageHeader from "@/components/PageHeader";
import SearchBox from "@/components/SearchBox";
import DeviceTable from "@/components/DeviceTable";
import Pagination from "@/components/Pagination";
import Icon from "@/components/Icon";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sold devices" };

export default async function SoldPage({ searchParams }) {
  const sp = await searchParams;
  const q = one(sp.q).slice(0, 60);
  const from = one(sp.from);
  const to = one(sp.to);
  const purpose = PURPOSES.includes(one(sp.purpose)) ? one(sp.purpose) : "";
  const page = Math.max(1, parseInt(one(sp.page), 10) || 1);

  const match = soldMatch({ from, to, purpose });
  const [list, totals] = await Promise.all([
    listDevices({ match, q, page, sort: { install_date: -1, _id: -1 } }),
    soldTotals(match),
  ]);

  const active = Object.fromEntries(Object.entries({ q, from, to, purpose }).filter(([, v]) => v));
  const exportQs = new URLSearchParams(active).toString();
  const backQs = new URLSearchParams({ ...active, ...(page > 1 && { page }) }).toString();
  const back = `/sold${backQs ? `?${backQs}` : ""}`;
  const filtered = Boolean(from || to || purpose);
  // "Clear" on the search box drops only the text query and keeps the date / purpose filters
  const withoutQ = new URLSearchParams(Object.entries({ from, to, purpose }).filter(([, v]) => v)).toString();
  const clearSearchHref = `/sold${withoutQ ? `?${withoutQ}` : ""}`;

  return (
    <div className="page">
      <PageHeader
        title="Sold devices"
        sub={filtered ? "Filtered by date or purpose" : "Every device installed for a customer"}
        stats={[
          { label: "Devices", value: totals.count },
          { label: "Amount", value: `৳ ${money(totals.amount)}` },
        ]}
      >
        <Link href={`/sold/export${exportQs ? `?${exportQs}` : ""}`} className="btn" prefetch={false}>
          <Icon name="download" /> Download CSV
        </Link>
        <Link href="/retail" className="btn btn-ghost">
          Back to retail
        </Link>
      </PageHeader>

      <form method="get" className="panel filters" aria-label="Filter sold devices">
        {q && <input type="hidden" name="q" value={q} />}
        <div>
          <label className="lab" htmlFor="f-from">
            From
          </label>
          <input id="f-from" type="date" name="from" defaultValue={from} className="field" />
        </div>
        <div>
          <label className="lab" htmlFor="f-to">
            To
          </label>
          <input id="f-to" type="date" name="to" defaultValue={to} className="field" />
        </div>
        <div>
          <label className="lab" htmlFor="f-purpose">
            Purpose
          </label>
          <select id="f-purpose" name="purpose" defaultValue={purpose} className="field">
            <option value="">All purposes</option>
            {PURPOSES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="btns">
          <button className="btn">Apply filter</button>
          {filtered && (
            <Link href="/sold" className="btn btn-ghost">
              Clear
            </Link>
          )}
        </div>
      </form>

      <div className="toolbar">
        <SearchBox q={q} hidden={{ from, to, purpose }} clearHref={clearSearchHref} />
      </div>

      <DeviceTable editForm="sell" columns={SOLD_COLUMNS} rows={list.rows} back={back} emptyHint="No sales match these filters." />
      <Pagination basePath="/sold" params={active} page={page} pages={list.pages} total={list.total} />
    </div>
  );
}

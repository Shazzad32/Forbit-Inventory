import { notFound } from "next/navigation";
import Link from "next/link";
import { SECTIONS } from "@/lib/constants";
import { listDevices, countsByType } from "@/lib/queries";
import { one } from "@/lib/format";
import PageHeader from "@/components/PageHeader";
import SearchBox from "@/components/SearchBox";
import DeviceTable from "@/components/DeviceTable";
import Pagination from "@/components/Pagination";
import ImportCsv from "@/components/ImportCsv";
import Icon from "@/components/Icon";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { section } = await params;
  return { title: Object.hasOwn(SECTIONS, section) ? SECTIONS[section].title : "Not found" };
}

// /store, /retail, /rangs and /return all render through this one page.
export default async function SectionPage({ params, searchParams }) {
  const { section } = await params;
  if (!Object.hasOwn(SECTIONS, section)) notFound();
  const cfg = SECTIONS[section];

  const sp = await searchParams;
  const q = one(sp.q).slice(0, 60);
  const page = Math.max(1, parseInt(one(sp.page), 10) || 1);

  const [list, counts] = await Promise.all([
    listDevices({ match: cfg.match, q, page, sort: cfg.sort }),
    countsByType(cfg.match),
  ]);

  const back = `/${section}${page > 1 || q ? `?${new URLSearchParams({ ...(q && { q }), ...(page > 1 && { page }) })}` : ""}`;
  const stats = [{ label: "Total", value: counts.total }];
  if (section !== "return") stats.push({ label: "Non-voice", value: counts.nonVoice }, { label: "Voice", value: counts.voice });

  return (
    <div className="page">
      <PageHeader title={cfg.title} sub={cfg.subtitle} stats={stats}>
        <Link href={`/devices/new?send_to=${cfg.sendTo}&next=${encodeURIComponent(`/${section}`)}`} className="btn">
          <Icon name="plus" /> Add device
        </Link>
        {section === "store" && <ImportCsv />}
        {section === "retail" && (
          <>
            <Link href="/sold" className="btn btn-ghost">
              <Icon name="sold" /> Sold
            </Link>
            <Link href="/not-paid" className="btn btn-ghost">
              <Icon name="coin" /> Due list
            </Link>
            <Link href="/due" className="btn btn-ghost">
              <Icon name="due" /> Technician report
            </Link>
          </>
        )}
      </PageHeader>

      <div className="toolbar">
        <SearchBox q={q} clearHref={`/${section}`} />
      </div>

      <DeviceTable
        columns={cfg.columns}
        rows={list.rows}
        quick={cfg.quick}
        editForm={cfg.editForm}
        back={back}
        emptyHint={q ? `Nothing matches “${q}”.` : "Nothing here yet. Add a device to get started."}
      />
      <Pagination basePath={`/${section}`} params={{ q }} page={page} pages={list.pages} total={list.total} />
    </div>
  );
}

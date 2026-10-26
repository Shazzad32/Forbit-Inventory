import Link from "next/link";
import { dashboardStats, unsoldRetailIds } from "@/lib/queries";
import { getAssignedIds } from "@/lib/assign";
import { money, one } from "@/lib/format";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);

function SplitBar({ voice, nonVoice }) {
  return (
    <>
      <div className="split" role="img" aria-label={`${voice} voice, ${nonVoice} non-voice`}>
        <span className="v" style={{ flexGrow: voice }} />
        <span className="n" style={{ flexGrow: nonVoice }} />
      </div>
      <p className="split-legend">
        <span>
          <i style={{ background: "var(--c-store)" }} />
          Voice <b>{voice}</b>
        </span>
        <span>
          <i style={{ background: "var(--c-rangs)" }} />
          Non-voice <b>{nonVoice}</b>
        </span>
      </p>
    </>
  );
}

function Metric({ href, icon, label, data, extra }) {
  return (
    <Link href={href} className="panel metric">
      <span className="metric-top">
        {label}
        <Icon name={icon} />
      </span>
      <span className="big">{data.total}</span>
      <div>
        <SplitBar voice={data.voice} nonVoice={data.nonVoice} />
      </div>
      {extra}
    </Link>
  );
}

export default async function Dashboard({ searchParams }) {
  const sp = await searchParams;
  // The server lists are optional and slow-ish: wait at most 4s, and never break the dashboard if they fail.
  const [s, assigned] = await Promise.all([dashboardStats(one(sp.m)), getAssignedIds(4000).catch(() => null)]);
  const m = s.month;

  let due = null;
  if (assigned?.configured && assigned.failed.length === 0) {
    const unsold = await unsoldRetailIds();
    due = unsold.filter((id) => assigned.ids.has(id)).length;
  }

  const places = [
    { label: "Store", href: "/store", color: "var(--c-store)", n: s.store.total },
    { label: "In retail", href: "/retail", color: "var(--c-retail)", n: s.retail.total },
    { label: "Rangs", href: "/rangs", color: "var(--c-rangs)", n: s.rangs.total },
    { label: "Returned", href: "/return", color: "var(--c-return)", n: s.returned.total },
    { label: "Sold", href: "/sold", color: "var(--c-sold)", n: s.sold.count },
  ];
  const topPurpose = Math.max(1, ...Object.values(m.purposes));

  return (
    <div className="page">
      <PageHeader title="Dashboard" sub="Where every device is right now">
        <Link href="/devices/new" className="btn">
          <Icon name="plus" /> Add device
        </Link>
      </PageHeader>

      <section className="panel panel-pad" aria-labelledby="dist-h">
        <div className="panel-head">
          <h2 className="h2" id="dist-h">
            All devices
          </h2>
          <span className="stat">
            <span className="sr-only">Total devices</span>
            <b className="num" style={{ font: "700 1.5rem/1 var(--f-display)" }}>
              {s.totalDevices}
            </b>
          </span>
        </div>
        <div className="dist-bar" role="img" aria-label="Share of devices by location">
          {places.map((p) => (
            <span key={p.label} style={{ flexGrow: p.n, background: p.color }} title={`${p.label}: ${p.n}`} />
          ))}
        </div>
        <ul className="legend">
          {places.map((p) => (
            <li key={p.label}>
              <Link href={p.href}>
                <span className="dot" style={{ background: p.color }} />
                <span>{p.label}</span>
                <span className="v">
                  {p.n} <span className="muted">· {pct(p.n, s.totalDevices)}%</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="metrics" aria-label="Locations">
        <Metric href="/store" icon="store" label="In store" data={s.store} />
        <Metric
          href="/retail"
          icon="retail"
          label="Retail, unsold"
          data={s.retail}
          extra={
            due != null && (
              <p className="split-legend" style={{ marginTop: 0 }}>
                <span>
                  In hand <b>{s.retail.total - due}</b>
                </span>
                <span>
                  Due <b style={{ color: "var(--danger)" }}>{due}</b>
                </span>
              </p>
            )
          }
        />
        <Metric href="/rangs" icon="rangs" label="At Rangs" data={s.rangs} />
        <Metric href="/return" icon="return" label="Returned" data={s.returned} />
      </section>

      <section className="sales" aria-label="Sales">
        <div className="panel panel-pad">
          <h2 className="h2">All-time sales</h2>
          <dl className="kpis">
            <div className="kpi">
              <dt>Devices sold</dt>
              <dd>{s.sold.count}</dd>
            </div>
            <div className="kpi">
              <dt>Amount</dt>
              <dd>৳ {money(s.sold.amount)}</dd>
            </div>
          </dl>
          <p style={{ marginTop: "1.1rem" }}>
            <Link href="/sold" className="btn btn-ghost btn-sm">
              View sold devices <Icon name="arrow" />
            </Link>
          </p>
        </div>

        <div className="panel panel-pad">
          <div className="month-nav">
            <Link href={`/?m=${m.prev}`} className="icon-btn" aria-label="Previous month">
              <Icon name="left" />
            </Link>
            <b>{m.label}</b>
            <Link href={`/?m=${m.next}`} className="icon-btn" aria-label="Next month">
              <Icon name="right" />
            </Link>
          </div>
          <dl className="kpis">
            <div className="kpi">
              <dt>Sold this month</dt>
              <dd>{m.count}</dd>
            </div>
            <div className="kpi">
              <dt>Amount</dt>
              <dd>৳ {money(m.amount)}</dd>
            </div>
          </dl>
          <ul className="bars" aria-label="Sales by install purpose">
            {Object.entries(m.purposes).map(([name, n]) => (
              <li className="bar-row" key={name}>
                <span>{name}</span>
                <span className="track">
                  <span className={`fill fill-${name.toLowerCase()}`} style={{ width: `${(n / topPurpose) * 100}%` }} />
                </span>
                <span className="val">{n}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

/** Title block: heading, one-line subtitle, count chips, and action buttons (children). */
export default function PageHeader({ title, sub, stats = [], children }) {
  return (
    <header className="page-head">
      <div className="page-title">
        <h1>{title}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {children && <div className="head-actions">{children}</div>}
      {stats.length > 0 && (
        <dl className="stats">
          {stats.map((s) => (
            <div className="stat" key={s.label}>
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </header>
  );
}

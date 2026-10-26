// Shown instantly while a page waits for the database.
export default function Loading() {
  return (
    <div className="page" aria-busy="true" aria-label="Loading">
      <div className="skeleton" style={{ height: "2.2rem", width: "min(16rem, 70%)" }} />
      <div className="skeleton" style={{ height: "2.2rem", width: "min(26rem, 100%)", borderRadius: 999 }} />
      <div className="panel" style={{ padding: "0.5rem 0" }}>
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="skeleton sk-row" />
        ))}
      </div>
    </div>
  );
}

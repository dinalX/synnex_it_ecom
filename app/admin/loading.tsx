export default function AdminLoading() {
  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="skeleton-brand" />
        <nav aria-label="Admin navigation">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="skeleton-nav-item" />
          ))}
        </nav>
      </aside>
      <section className="admin-content-page">
        <div className="admin-topbar">
          <div>
            <div className="skeleton-line short" />
            <div className="skeleton-line medium" />
          </div>
        </div>
        <div className="admin-panel">
          <div className="panel-heading">
            <div className="skeleton-line medium" />
          </div>
          <div className="management-table">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton-row" />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

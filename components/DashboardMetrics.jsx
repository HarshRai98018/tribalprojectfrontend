// ---------------------------------------------------------------------------
// DashboardMetrics — Role-based metric summary cards
// ---------------------------------------------------------------------------
const DashboardMetrics = ({ cards, user, loading }) => {
  if (loading) {
    return (
      <section className="panel">
        <div className="panel-head">
          <div className="skeleton" style={{ width: "160px", height: "24px" }}></div>
        </div>
        <div className="metrics-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="metric-card">
              <div className="skeleton" style={{ width: "60%", height: "16px", marginBottom: "8px" }}></div>
              <div className="skeleton" style={{ width: "40%", height: "32px" }}></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!cards || cards.length === 0) return null;

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Role Dashboard</h2>
        <span className="badge">{user.role}</span>
      </div>
      <div className="metrics-grid">
        {cards.map((card) => (
          <article key={card.key} className="metric-card">
            <h3>{card.title}</h3>
            <strong>
              {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
            </strong>
          </article>
        ))}
      </div>
    </section>
  );
};

window.TC = window.TC || {};
window.TC.DashboardMetrics = DashboardMetrics;

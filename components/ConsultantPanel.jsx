// ---------------------------------------------------------------------------
// ConsultantPanel — Authenticity review queue for cultural consultants
// ---------------------------------------------------------------------------
const ConsultantPanel = ({ products, updateAuth, AUTH_STATUSES }) => {
  const pending = products.filter((p) => p.authenticityStatus !== "approved");

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Authenticity Review Queue</h2>
        <p>Preserve cultural representation</p>
      </div>

      {pending.length === 0 && (
        <p className="empty">All products have been reviewed. Great work!</p>
      )}

      {pending.map((product) => (
        <article className="queue-card" key={product.id}>
          <div>
            <strong>{product.name}</strong>
            <p>
              {product.region} | {product.artisanName}
            </p>
            {product.culturalNote && (
              <small style={{ color: "#0f5949" }}>{product.culturalNote}</small>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
            <span className={`status ${product.authenticityStatus}`}>
              {product.authenticityStatus}
            </span>
            <select
              value={product.authenticityStatus}
              onChange={(e) => updateAuth(product.id, e.target.value)}
            >
              {AUTH_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </article>
      ))}
    </section>
  );
};

window.TC = window.TC || {};
window.TC.ConsultantPanel = ConsultantPanel;

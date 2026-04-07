// ---------------------------------------------------------------------------
// AdminPanel — Order management, issue resolution, payment monitoring
// ---------------------------------------------------------------------------
const AdminPanel = ({
  products,
  orders,
  updateOrderStatus,
  ORDER_STATUSES,
  issues,
  issueForm,
  setIssueForm,
  submitIssue,
  resolveIssue,
  payments,
  updatePaymentStatus,
  activityLogs,
  money,
  downloadInvoice,
  role
}) => {
  return (
    <>
      {/* Order Control Center */}
      <section className="split">
        <div className="panel">
          <div className="panel-head">
            <h2>Order Control Center</h2>
            <p>Monitor transaction lifecycle</p>
          </div>
          {orders.length === 0 && <p className="empty">No orders yet.</p>}
          {orders.map((order) => (
            <article className="order-row" key={order.id}>
              <div>
                <strong>{order.id}</strong>
                <small>
                  {order.customerName} | {money(order.amount)}
                </small>
              </div>
              <select
                value={order.status}
                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </article>
          ))}
        </div>

        {role === "admin" && (
          <div className="panel">
            <div className="panel-head">
              <h2>Issue Resolution</h2>
              <p>Support and platform trust</p>
            </div>
            <form className="issue-form" onSubmit={submitIssue}>
              <select
                value={issueForm.type}
                onChange={(e) => setIssueForm({ ...issueForm, type: e.target.value })}
              >
                <option value="delivery">delivery</option>
                <option value="quality">quality</option>
                <option value="payment">payment</option>
                <option value="listing">listing</option>
              </select>
              <input
                required
                placeholder="Describe issue..."
                value={issueForm.message}
                onChange={(e) => setIssueForm({ ...issueForm, message: e.target.value })}
              />
              <button className="primary" type="submit">
                Create
              </button>
            </form>
            {issues.length === 0 && <p className="empty">No issues reported.</p>}
            {issues.map((issue) => (
              <article className="issue-card" key={issue.id}>
                <div>
                  <strong>{issue.type}</strong>
                  <p>{issue.message}</p>
                </div>
                <div className="issue-actions">
                  <span className={`status-pill ${issue.status}`}>{issue.status}</span>
                  {issue.status !== "resolved" && (
                    <button className="secondary" onClick={() => resolveIssue(issue.id)}>
                      Resolve
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Payment Monitoring (admin only) */}
      {role === "admin" && (
        <section className="panel">
          <div className="panel-head">
            <h2>Payment Monitoring</h2>
            <p>Track transaction status</p>
          </div>
          {payments.length === 0 && <p className="empty">No payments yet.</p>}
          {payments.map((payment) => (
            <article className="order-row" key={payment.id}>
              <div>
                <strong>{payment.id}</strong>
                <small>
                  {payment.customerName} | {money(payment.amount)} | {payment.method.toUpperCase()}
                </small>
                <button className="secondary mini-btn" onClick={() => downloadInvoice(payment)}>
                  Invoice
                </button>
              </div>
              <select
                value={payment.status}
                onChange={(e) => updatePaymentStatus(payment.id, e.target.value)}
              >
                {["pending", "success", "failed", "refunded"].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </article>
          ))}
        </section>
      )}

      {role === "admin" && (
        <section className="split">
          <div className="panel">
            <div className="panel-head">
              <h2>Product Oversight</h2>
              <p>Review listings, stock, and publication status</p>
            </div>
            {products.length === 0 && <p className="empty">No products available.</p>}
            {products.slice(0, 8).map((product) => (
              <article className="issue-card" key={product.id}>
                <div>
                  <strong>{product.name}</strong>
                  <p>
                    {product.artisanName || "Unassigned artisan"} | Stock {product.stock}
                  </p>
                </div>
                <div className="issue-actions">
                  <span className={`status-pill ${product.authenticityStatus}`}>{product.authenticityStatus}</span>
                </div>
              </article>
            ))}
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2>Activity Logs</h2>
              <p>Recent platform events across orders, payments, issues, and listings</p>
            </div>
            {activityLogs.length === 0 && <p className="empty">No activity yet.</p>}
            {activityLogs.map((log, index) => (
              <article className="issue-card" key={`${log.type}-${log.title}-${index}`}>
                <div>
                  <strong>{log.title}</strong>
                  <p>{log.detail || "No additional detail"}</p>
                  {log.timestamp && <small>{log.timestamp}</small>}
                </div>
                <div className="issue-actions">
                  <span className={`status-pill ${log.status || log.type}`}>{log.status || log.type}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
};

window.TC = window.TC || {};
window.TC.AdminPanel = AdminPanel;

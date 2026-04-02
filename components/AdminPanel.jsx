// ---------------------------------------------------------------------------
// AdminPanel — Order management, issue resolution, payment monitoring
// ---------------------------------------------------------------------------
const AdminPanel = ({
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
    </>
  );
};

window.TC = window.TC || {};
window.TC.AdminPanel = AdminPanel;

// ---------------------------------------------------------------------------
// InvoicePage — Printable invoice view
// ---------------------------------------------------------------------------
const InvoicePage = ({ invoiceLoading, invoiceError, invoiceData, money }) => {
  return (
    <div className="invoice-page">
      <section className="invoice-card">
        <div className="invoice-top">
          <h1>TribalCraft Invoice</h1>
          <button className="secondary" onClick={() => window.print()}>
            Print / Save PDF
          </button>
        </div>

        {invoiceLoading && <div className="alert">Loading invoice...</div>}
        {invoiceError && <div className="alert error">{invoiceError}</div>}

        {invoiceData && (
          <>
            <div className="invoice-meta">
              <p>Invoice ID: {invoiceData.payment.id}</p>
              <p>Order ID: {invoiceData.order.id}</p>
              <p>Customer: {invoiceData.order.customerName}</p>
              <p>Date: {invoiceData.payment.createdAt}</p>
              <p>Method: {invoiceData.payment.method.toUpperCase()}</p>
              <p>Status: {invoiceData.payment.status}</p>
              <p>Ref: {invoiceData.payment.transactionRef}</p>
              <p>Shipping Address: {invoiceData.order.shippingAddress}</p>
            </div>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.items.map((item, idx) => (
                  <tr key={`${item.productId}-${idx}`}>
                    <td>{idx + 1}</td>
                    <td>{item.productName}</td>
                    <td>{item.qty}</td>
                    <td>{money(item.price)}</td>
                    <td>{money(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="invoice-total">Grand Total: {money(invoiceData.payment.amount)}</p>
          </>
        )}
      </section>
    </div>
  );
};

window.TC = window.TC || {};
window.TC.InvoicePage = InvoicePage;

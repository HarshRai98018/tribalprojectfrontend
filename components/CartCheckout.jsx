// ---------------------------------------------------------------------------
// CartCheckout — Shopping cart, payment method, checkout + payment history
// ---------------------------------------------------------------------------
const CartCheckout = ({
  cart,
  cartTotal,
  paymentForm,
  setPaymentForm,
  checkout,
  promotions,
  payments,
  user,
  money,
  downloadInvoice
}) => {
  return (
    <section className="split">
      <div className="panel">
        <div className="panel-head">
          <h2>Cart &amp; Checkout</h2>
          <p>{cart.length} item(s)</p>
        </div>

        {cart.length === 0 && <p className="empty">No items in cart.</p>}

        {cart.map((item) => (
          <div className="line-item" key={item.productId}>
            <span>{item.name}</span>
            <span>
              {item.qty} × {money(item.price)}
            </span>
          </div>
        ))}

        <div className="payment-box">
          <h3>Payment Method</h3>
          <div className="payment-methods">
            {["upi", "card", "netbanking", "cod"].map((method) => (
              <label
                key={method}
                className={paymentForm.method === method ? "method active" : "method"}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentForm.method === method}
                  onChange={() => setPaymentForm({ ...paymentForm, method })}
                />
                <span>{method.toUpperCase()}</span>
              </label>
            ))}
          </div>
          <input
            placeholder="UPI ID / Card last 4 / Bank name (optional for COD)"
            value={paymentForm.details}
            onChange={(e) => setPaymentForm({ ...paymentForm, details: e.target.value })}
          />
        </div>

        <div className="checkout-row">
          <strong>Total: {money(cartTotal)}</strong>
          <button
            id="checkout-btn"
            className="primary"
            disabled={cart.length === 0}
            onClick={checkout}
          >
            Place Order
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Promotions</h2>
          <p>Live campaigns</p>
        </div>
        {promotions
          .filter((promo) => promo.active)
          .map((promo) => (
            <article className="promo-card" key={promo.id}>
              <strong>{promo.title}</strong>
              <span>
                {promo.discountPercent}% OFF | {promo.category}
              </span>
            </article>
          ))}
        {promotions.filter((p) => p.active).length === 0 && (
          <p className="empty">No active promotions.</p>
        )}

        <div className="panel-head" style={{ marginTop: "18px" }}>
          <h2>Payment History</h2>
          <p>Your transactions</p>
        </div>
        {payments
          .filter((payment) => payment.customerId === user.id)
          .slice(0, 5)
          .map((payment) => (
            <article className="review-card" key={payment.id}>
              <strong>{payment.id}</strong>
              <small>
                {payment.method.toUpperCase()} | {payment.createdAt}
              </small>
              <p>
                {money(payment.amount)} | {payment.status} | {payment.transactionRef}
              </p>
              <button className="secondary mini-btn" onClick={() => downloadInvoice(payment)}>
                Download Invoice
              </button>
            </article>
          ))}
      </div>
    </section>
  );
};

window.TC = window.TC || {};
window.TC.CartCheckout = CartCheckout;

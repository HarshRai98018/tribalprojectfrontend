// ---------------------------------------------------------------------------
// CartCheckout - Shopping cart, address, payment method, checkout + history
// ---------------------------------------------------------------------------
const CartCheckout = ({
  cart,
  cartTotal,
  paymentForm,
  setPaymentForm,
  checkout,
  updateCartQty,
  removeFromCart,
  promotions,
  payments,
  user,
  money,
  downloadInvoice
}) => {
  const customerPayments = payments.filter((payment) => payment.customerId === user.id).slice(0, 5);

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
            <div>
              <strong>{item.name}</strong>
              <small>{money(item.price)} each</small>
            </div>
            <div className="cart-item-actions">
              <button className="secondary mini-btn" type="button" onClick={() => updateCartQty(item.productId, item.qty - 1)}>
                -
              </button>
              <span className="qty-pill">{item.qty}</span>
              <button className="secondary mini-btn" type="button" onClick={() => updateCartQty(item.productId, item.qty + 1)}>
                +
              </button>
              <strong>{money(item.qty * item.price)}</strong>
              <button className="secondary mini-btn" type="button" onClick={() => removeFromCart(item.productId)}>
                Remove
              </button>
            </div>
          </div>
        ))}

        <div className="payment-box">
          <h3>Delivery Address</h3>
          <textarea
            placeholder="Enter complete delivery address"
            value={paymentForm.address}
            onChange={(e) => setPaymentForm({ ...paymentForm, address: e.target.value })}
          />
          {user.savedAddress && (
            <button
              className="secondary mini-btn"
              type="button"
              onClick={() => setPaymentForm({ ...paymentForm, address: user.savedAddress })}
            >
              Use Saved Address
            </button>
          )}
          <p className="helper-text">This address is required and will be saved for future orders.</p>
        </div>

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
          <p className="helper-text">Demo payments supported: use demo@upi, 4242, or any bank name.</p>
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
        {customerPayments.map((payment) => (
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
        {customerPayments.length === 0 && (
          <p className="empty">Your recent payments will appear here after checkout.</p>
        )}
      </div>
    </section>
  );
};

window.TC = window.TC || {};
window.TC.CartCheckout = CartCheckout;

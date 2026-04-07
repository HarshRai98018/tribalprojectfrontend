// ---------------------------------------------------------------------------
// PaymentGatewayModal - Simulated payment gateway overlay modal
// ---------------------------------------------------------------------------
const PaymentGatewayModal = ({
  gatewayPayment,
  gatewayBusy,
  gatewayResult,
  processFakePayment,
  setGatewayOpen,
  setGatewayResult,
  setGatewayPayment,
  money
}) => {
  const closeGateway = () => {
    setGatewayOpen(false);
    setGatewayResult("");
    setGatewayPayment(null);
  };

  return (
    <div className="gateway-backdrop" onClick={(e) => e.target === e.currentTarget && closeGateway()}>
      <div className="gateway-modal">
        <h2>Payment Gateway</h2>
        <p>
          Ref: {gatewayPayment.transactionRef} | Amount: {money(gatewayPayment.amount)}
        </p>
        <p>Method: {gatewayPayment.method.toUpperCase()}</p>
        <div className="gateway-demo-note">
          <strong>Demo checkout</strong>
          <p>This sample payment always succeeds so customers can finish the flow and download a receipt.</p>
        </div>

        {gatewayPayment.method === "upi" && (
          <div className="upi-qr-card">
            <div className="qr-matrix"></div>
            <div>
              <strong>Scan UPI QR (Demo)</strong>
              <p>UPI ID: {gatewayPayment.details || "demo@upi"}</p>
            </div>
          </div>
        )}

        {gatewayPayment.method === "card" && (
          <div className="upi-qr-card">
            <div className="qr-matrix card-chip"></div>
            <div>
              <strong>Sample Card</strong>
              <p>Use card ending 4242 for this demo payment.</p>
            </div>
          </div>
        )}

        {gatewayPayment.method === "netbanking" && (
          <div className="upi-qr-card">
            <div className="qr-matrix bank-badge"></div>
            <div>
              <strong>Sample Net Banking</strong>
              <p>Any bank name entered in checkout works for this demo payment.</p>
            </div>
          </div>
        )}

        {gatewayResult === "processing" && (
          <p className="gateway processing">Processing payment...</p>
        )}
        {gatewayResult === "success" && (
          <p className="gateway success">Payment successful.</p>
        )}
        {gatewayResult === "failed" && (
          <p className="gateway failed">Payment failed. Please retry.</p>
        )}

        <div className="gateway-actions">
          <button
            id="gateway-pay-btn"
            className="primary"
            onClick={processFakePayment}
            disabled={gatewayBusy || gatewayResult === "success"}
          >
            {gatewayBusy ? "Processing..." : gatewayResult === "success" ? "Paid" : "Pay Now"}
          </button>
          <button className="secondary" onClick={closeGateway}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

window.TC = window.TC || {};
window.TC.PaymentGatewayModal = PaymentGatewayModal;

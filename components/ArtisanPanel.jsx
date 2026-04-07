// ---------------------------------------------------------------------------
// ArtisanPanel — Create product listing + view recent orders
// ---------------------------------------------------------------------------
const ArtisanPanel = ({
  newListing,
  setNewListing,
  listingImageFile,
  setListingImageFile,
  createListing,
  orders,
  money
}) => {
  return (
    <>
      {/* ── Full-width Create Listing Form ── */}
      <form className="panel artisan-form" onSubmit={createListing}>
        <div className="panel-head">
          <h2>📦 Create Product Listing</h2>
          <p>Upload your handcrafted artwork to the marketplace</p>
        </div>

        {/* Row 1: Name + Category */}
        <div className="artisan-row">
          <div className="artisan-field">
            <label>Product Name *</label>
            <input
              required
              placeholder="e.g. Warli Story Canvas"
              value={newListing.name}
              onChange={(e) => setNewListing({ ...newListing, name: e.target.value })}
            />
          </div>
          <div className="artisan-field">
            <label>Category *</label>
            <input
              required
              placeholder="e.g. Painting, Sculpture, Textiles"
              value={newListing.category}
              onChange={(e) => setNewListing({ ...newListing, category: e.target.value })}
            />
          </div>
        </div>

        {/* Row 2: Price + Stock + Region */}
        <div className="artisan-row artisan-row-3">
          <div className="artisan-field">
            <label>Price (₹) *</label>
            <input
              required
              type="number"
              placeholder="2499"
              value={newListing.price}
              onChange={(e) => setNewListing({ ...newListing, price: e.target.value })}
            />
          </div>
          <div className="artisan-field">
            <label>Stock Quantity *</label>
            <input
              required
              type="number"
              placeholder="10"
              value={newListing.stock}
              onChange={(e) => setNewListing({ ...newListing, stock: e.target.value })}
            />
          </div>
          <div className="artisan-field">
            <label>Region *</label>
            <input
              required
              placeholder="e.g. Maharashtra, Tamil Nadu"
              value={newListing.region}
              onChange={(e) => setNewListing({ ...newListing, region: e.target.value })}
            />
          </div>
        </div>

        {/* Row 3: Artisan Name (full width) */}
        <div className="artisan-field">
          <label>Artisan Name (optional)</label>
          <input
            placeholder="Defaults to your account name"
            value={newListing.artisanName}
            onChange={(e) => setNewListing({ ...newListing, artisanName: e.target.value })}
          />
        </div>

        {/* Row 4: Description + Cultural Note */}
        <div className="artisan-row">
          <div className="artisan-field">
            <label>Product Description *</label>
            <textarea
              required
              placeholder="Describe the craft, materials used, and creation process..."
              value={newListing.description}
              onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
            ></textarea>
          </div>
          <div className="artisan-field">
            <label>Cultural Note (heritage significance)</label>
            <textarea
              placeholder="Share the cultural story and heritage behind this craft..."
              value={newListing.culturalNote}
              onChange={(e) => setNewListing({ ...newListing, culturalNote: e.target.value })}
            ></textarea>
          </div>
        </div>

        {/* Row 5: Image Upload */}
        <div className="artisan-upload-zone">
          <label>🖼️ Product Image</label>
          {!listingImageFile ? (
            <div className="upload-dropzone">
              <div className="upload-icon">📁</div>
              <p>Click to select an image or drag & drop</p>
              <small>Supports JPG, PNG, WEBP — Max 5 MB</small>
              <input
                type="file"
                accept="image/*"
                className="file-input-overlay"
                onChange={(e) => setListingImageFile(e.target.files[0] || null)}
              />
            </div>
          ) : (
            <div className="upload-preview">
              <img
                src={URL.createObjectURL(listingImageFile)}
                alt="Preview"
              />
              <div className="upload-preview-info">
                <strong>✓ {listingImageFile.name}</strong>
                <small>{(listingImageFile.size / 1024).toFixed(0)} KB</small>
                <button
                  type="button"
                  className="secondary mini-btn"
                  onClick={() => setListingImageFile(null)}
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>

        <button className="primary artisan-submit" type="submit">
          🚀 Publish Listing
        </button>
      </form>

      {/* ── Recent Orders ── */}
      <div className="panel">
        <div className="panel-head">
          <h2>📋 Recent Orders</h2>
          <p>Track fulfillment</p>
        </div>
        {orders.length === 0 && <p className="empty">No orders yet.</p>}
        {orders.slice(0, 8).map((order) => (
          <article className="order-card" key={order.id}>
            <div>
              <strong>{order.id}</strong>
              <small>
                {order.customerName} | {order.createdAt}
              </small>
            </div>
            <div>
              <strong>{money(order.amount)}</strong>
              <small className="status-pill">{order.status}</small>
            </div>
          </article>
        ))}
      </div>
    </>
  );
};

window.TC = window.TC || {};
window.TC.ArtisanPanel = ArtisanPanel;

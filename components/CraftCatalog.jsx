// ---------------------------------------------------------------------------
// CraftCatalog — Product grid with search, filter, and role-based actions
// ---------------------------------------------------------------------------
const CraftCatalog = ({
  filteredProducts,
  query,
  setQuery,
  category,
  setCategory,
  categories,
  role,
  addToCart,
  updateAuth,
  deleteProduct,
  money,
  DEFAULT_PRODUCT_IMAGE,
  AUTH_STATUSES,
  loading
}) => {
  if (loading) {
    return (
      <section className="panel">
        <div className="panel-head">
          <div className="skeleton" style={{ width: "150px", height: "24px" }}></div>
          <div className="skeleton" style={{ width: "80px", height: "16px" }}></div>
        </div>
        <div className="product-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="product-card">
              <div className="skeleton" style={{ width: "100%", height: "200px", borderRadius: "14px" }}></div>
              <div className="skeleton" style={{ width: "60%", height: "20px", marginTop: "12px" }}></div>
              <div className="skeleton" style={{ width: "40%", height: "16px", marginTop: "8px" }}></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Craft Catalog</h2>
        <p>{filteredProducts.length} products</p>
      </div>

      <div className="filters">
        <input
          id="catalog-search"
          type="text"
          placeholder="Search by craft, artisan, region..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          id="catalog-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {filteredProducts.length === 0 && (
        <p className="empty">No products match your search.</p>
      )}

      <div className="product-grid">
        {filteredProducts.map((product) => (
          <article className="product-card" key={product.id}>
            <div className="product-media">
              <img
                src={product.imageUrl || DEFAULT_PRODUCT_IMAGE}
                alt={product.name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                }}
              />
            </div>

            <div className="product-top">
              <span className={`status ${product.authenticityStatus}`}>
                {product.authenticityStatus}
              </span>
              <span className="rating">★ {product.rating}</span>
            </div>

            <h3>{product.name}</h3>
            <p className="meta">
              {product.category} | {product.region}
            </p>
            <p className="desc">{product.description}</p>
            {product.culturalNote && (
              <p className="cultural-note">{product.culturalNote}</p>
            )}

            <div className="product-footer">
              <strong>{money(product.price)}</strong>
              <small>Stock: {product.stock}</small>
            </div>

            {role === "customer" && (
              <button
                className="primary"
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
              >
                {product.stock <= 0 ? "Out of Stock" : "Add To Cart"}
              </button>
            )}

            {(role === "consultant" || role === "admin") && (
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
            )}

            {(role === "artisan" || role === "admin") && (
              <button
                className="secondary mini-btn delete-btn"
                onClick={() => deleteProduct(product.id, product.name)}
              >
                🗑️ Delete
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

window.TC = window.TC || {};
window.TC.CraftCatalog = CraftCatalog;

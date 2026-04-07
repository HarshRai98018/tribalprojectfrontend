// ---------------------------------------------------------------------------
// ReviewsPanel — Submit reviews and view testimonials
// ---------------------------------------------------------------------------
const ReviewsPanel = ({ reviewForm, setReviewForm, submitReview, products, reviews }) => {
  return (
    <section className="split">
      <form className="panel" onSubmit={submitReview}>
        <div className="panel-head">
          <h2>Customer Reviews</h2>
          <p>Build trust through social proof</p>
        </div>
        <div className="form-grid">
          <select
            required
            value={reviewForm.productId}
            onChange={(e) => setReviewForm({ ...reviewForm, productId: e.target.value })}
          >
            <option value="">Select Product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          <select
            value={reviewForm.rating}
            onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
          >
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>
                {rating} Star{rating > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>
        <textarea
          required
          placeholder="Write your review..."
          value={reviewForm.comment}
          onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
        ></textarea>
        <button className="primary" type="submit">
          Submit Review
        </button>
      </form>

      <div className="panel">
        <div className="panel-head">
          <h2>Recent Testimonials</h2>
          <p>Voices from customers</p>
        </div>
        {reviews.length === 0 && <p className="empty">No reviews yet.</p>}
        {reviews.slice(0, 6).map((review) => (
          <article className="review-card" key={review.id}>
            <strong>{review.customerName}</strong>
            <small>
              {review.productId} | {review.createdAt}
            </small>
            <p>
              {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)} — {review.comment}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
};

window.TC = window.TC || {};
window.TC.ReviewsPanel = ReviewsPanel;

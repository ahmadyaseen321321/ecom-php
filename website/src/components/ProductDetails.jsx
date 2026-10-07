import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { fetchReviews, addReviewApi, getImageUrl } from '../services/api';
import {
  Star,
  ShoppingBag,
  Heart,
  ChevronRight,
  ArrowLeft,
  RotateCcw,
  Truck,
  ThumbsUp,
  Send,
  Loader2,
  Check,
  Store
} from 'lucide-react';
import './ProductDetails.css';

const DEFAULT_PRODUCT = {
  id: '1',
  name: 'Minimalist Silk Shirt',
  category: 'Apparel',
  price: 128.00,
  description: 'Crafted from 100% premium mulberry silk, this minimalist shirt offers an effortlessly elegant drape and a luxurious feel. Sustainable materials meet timeless design for the perfect wardrobe staple.',
  image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&auto=format&fit=crop&q=80',
  allImages: [
    'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&auto=format&fit=crop&q=80'
  ],
  rating: 4.8,
  reviewsCount: 124
};

/** Convert a created_at timestamp string to a human-readable relative time */
function relativeTime(dateStr) {
  if (!dateStr) return '';
  const created = new Date(dateStr);
  const diff = Date.now() - created.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  if (years > 0) return `${years}y ago`;
  if (months > 0) return `${months}mo ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
}

/** Get up-to-2-letter initials from a name */
function getInitials(name) {
  if (!name || !name.trim()) return 'U';
  return name.trim().split(/\s+/).filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase();
}

export default function ProductDetails() {
  const { selectedProduct, addToCart, wishlist, toggleWishlist, navigateTo, showToast } = useCart();
  const product = selectedProduct || DEFAULT_PRODUCT;

  console.log('[ProductDetails] render — selectedProduct:', selectedProduct, 'id:', selectedProduct?.id);

  const [selectedImage, setSelectedImage] = useState(product.image || product.allImages?.[0]);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState('S');

  // Reviews state
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Load reviews from API whenever the selected product changes
  const selectedProductId = selectedProduct ? selectedProduct.id : null;

  useEffect(() => {
    if (!selectedProductId) {
      setReviewsList([]);
      setReviewsLoading(false);
      return;
    }

    let cancelled = false;
    setReviewsList([]);
    setShowAllReviews(false);
    setReviewsLoading(true);

    fetchReviews(selectedProductId).then((list) => {
      if (cancelled) return;
      console.log('[Reviews] pid:', selectedProductId, 'count:', list.length, 'data:', list);
      setReviewsList(list);
    }).catch((err) => {
      console.error('[Reviews] error:', err);
      if (!cancelled) setReviewsList([]);
    }).finally(() => {
      if (!cancelled) setReviewsLoading(false);
    });

    return () => { cancelled = true; };
  }, [selectedProductId]);

  useEffect(() => {
    if (product) {
      setSelectedImage(product.image || product.allImages?.[0]);
      window.scrollTo(0, 0);
    }
  }, [product]);

  // Computed review stats from live data
  const reviewStats = useMemo(() => {
    if (!reviewsList.length) return { avg: 0, count: 0, breakdown: [] };
    const count = reviewsList.length;
    const avg = reviewsList.reduce((s, r) => s + parseFloat(r.rating || 0), 0) / count;
    const breakdown = [5, 4, 3, 2, 1].map((star) => {
      const n = reviewsList.filter((r) => Math.round(parseFloat(r.rating)) === star).length;
      return { star, pct: Math.round((n / count) * 100) };
    });
    return { avg: avg.toFixed(1), count, breakdown };
  }, [reviewsList]);

  // Show first 3 reviews, expand on "Read All"
  const visibleReviews = showAllReviews ? reviewsList : reviewsList.slice(0, 3);

  const colors = [
    { name: 'Olive Green', value: '#758A60' },
    { name: 'Dark Navy', value: '#1F2937' },
    { name: 'Light Blue', value: '#C5D6E8' }
  ];

  const sizes = ['XS', 'S', 'M', 'L'];

  return (
    <div className="product-details-page-wrapper">
      <div className="container">
        {/* Breadcrumb Navigation */}
        <div className="details-breadcrumb-bar">
          <button onClick={() => navigateTo('home')}>Home</button>
          <span className="sep">›</span>
          <button onClick={() => navigateTo('shop')}>{product.category || 'Apparel'}</button>
          <span className="sep">›</span>
          <span className="current">{product.name}</span>
        </div>

        {/* Main Product Showcase Grid */}
        <div className="product-showcase-grid">
          {/* Gallery Column */}
          <div className="gallery-column">
            <div className="vertical-thumbnails">
              {(product.allImages || [product.image]).map((img, idx) => (
                <div
                  key={idx}
                  className={`thumb-box ${selectedImage === img ? 'active' : ''}`}
                  onClick={() => setSelectedImage(img)}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} />
                </div>
              ))}
            </div>

            <div className="main-display-box">
              <img src={selectedImage || product.image} alt={product.name} />
            </div>
          </div>

          {/* Details & Purchase Column */}
          <div className="details-info-column">
            <h1 className="product-heading">{product.name}</h1>

            <div className="rating-summary-row">
              <div className="stars-flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} fill={i < 4 ? "#758A60" : i === 4 ? "#758A60" : "none"} color="#758A60" />
                ))}
              </div>
              <span className="reviews-text">(124 Customer Reviews)</span>
            </div>

            <div className="product-price-tag">
              ${Number(product.price).toFixed(2)}
            </div>

            <div className="description-block">
              <h3>DESCRIPTION</h3>
              <p>{product.description}</p>
            </div>

            {/* Color Selector */}
            <div className="selector-block">
              <label>SELECT COLOR</label>
              <div className="color-dots-flex">
                {colors.map((c, i) => (
                  <button
                    key={i}
                    className={`color-dot-btn ${selectedColor === i ? 'active' : ''}`}
                    style={{ backgroundColor: c.value }}
                    onClick={() => setSelectedColor(i)}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Size Selector */}
            <div className="selector-block">
              <div className="label-with-link">
                <label>SELECT SIZE</label>
                <button className="size-guide-btn" onClick={() => alert('Size guide: Fits true to size.')}>
                  Size Guide
                </button>
              </div>
              <div className="size-buttons-grid">
                {sizes.map((s) => (
                  <button
                    key={s}
                    className={`size-square-btn ${selectedSize === s ? 'active' : ''}`}
                    onClick={() => setSelectedSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="purchase-buttons-stack">
              <button
                className="buy-now-btn"
                onClick={() => {
                  const success = addToCart(product);
                  if (success) {
                    navigateTo('cart');
                  }
                }}
              >
                Buy now
              </button>

              <button
                className="add-to-cart-green-btn"
                onClick={() => addToCart(product)}
              >
                <ShoppingBag size={18} />
                <span>Add to Cart</span>
              </button>
            </div>

            {/* Features Row */}
            <div className="features-info-bar">
              <div className="feature-pill">
                <Truck size={18} className="feat-icon" />
                <span>Free Standard Shipping</span>
              </div>
              <div className="feature-pill">
                <RotateCcw size={18} className="feat-icon" />
                <span>30-Day Easy Returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <section className="customer-reviews-section">
          <h2 className="reviews-section-title">Customer Reviews</h2>

          {reviewsLoading ? (
            <div className="reviews-loading-state">
              <Loader2 size={28} className="reviews-spinner" />
              <span>Loading reviews…</span>
            </div>
          ) : reviewsList.length === 0 ? (
            <div className="reviews-empty-state">
              <Star size={40} color="#d1d5db" />
              <p>No reviews yet. Be the first to review this product!</p>
            </div>
          ) : (
            <>
              <div className="reviews-split-grid">
                {/* Rating Summary Card — computed from live data */}
                <div className="reviews-summary-card">
                  <div className="big-rating-number">{reviewStats.avg}</div>
                  <div className="stars-flex large">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        fill={i < Math.round(reviewStats.avg) ? '#758A60' : 'none'}
                        color="#758A60"
                      />
                    ))}
                  </div>
                  <span className="based-reviews-count">
                    Based on {reviewStats.count} review{reviewStats.count !== 1 ? 's' : ''}
                  </span>

                  <div className="breakdown-bars-list">
                    {reviewStats.breakdown.map((row) => (
                      <div key={row.star} className="breakdown-row">
                        <span className="star-num">{row.star}</span>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${row.pct}%` }}></div>
                        </div>
                        <span className="pct-num">{row.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reviews List — live from API */}
                <div className="reviews-cards-list">
                  {visibleReviews.map((r) => {
                    const initials = getInitials(r.user_name || r.userName || '');
                    const rating = parseFloat(r.rating || 0);
                    const timeAgo = relativeTime(r.created_at || r.createdAt);
                    const comment = r.comment || '';
                    const reply = r.reply;
                    const imageUrl = r.image_url ? getImageUrl(r.image_url) : null;

                    return (
                      <div key={r.id} className="review-item-card">
                        <div className="review-card-top">
                          <div className="review-author-meta">
                            <div className="avatar-circle">{initials}</div>
                            <div>
                              <h4 className="author-name">{r.user_name || r.userName || 'Anonymous'}</h4>
                              <span className="verified-badge">Verified Buyer • {timeAgo}</span>
                            </div>
                          </div>
                          <div className="stars-flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} fill={i < rating ? '#758A60' : 'none'} color="#758A60" />
                            ))}
                          </div>
                        </div>

                        <p className="review-comment-text">"{comment}"</p>

                        {imageUrl && (
                          <div className="review-photo-row">
                            <img
                              src={imageUrl}
                              alt="Review photo"
                              className="review-photo-thumb"
                              onClick={() => window.open(imageUrl, '_blank')}
                            />
                          </div>
                        )}

                        {reply && (
                          <div className="seller-reply-box">
                            <div className="seller-reply-header">
                              <Store size={14} className="store-icon" />
                              <span>Seller's Response</span>
                            </div>
                            <p className="seller-reply-text">{reply}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {reviewsList.length > 3 && (
                <div className="read-all-reviews-center">
                  <button
                    className="read-all-btn"
                    onClick={() => setShowAllReviews((prev) => !prev)}
                  >
                    {showAllReviews
                      ? 'Show Less'
                      : `Read All ${reviewsList.length} Reviews`}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

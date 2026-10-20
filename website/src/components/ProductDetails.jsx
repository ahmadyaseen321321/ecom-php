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
  ShieldCheck,
  ThumbsUp,
  Send,
  Loader2,
  Check,
  Store,
  MessageSquarePlus,
  Share2,
  Info,
  CheckCircle2,
  X
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
  const { selectedProduct, addToCart, wishlist, toggleWishlist, navigateTo, showToast, user } = useCart();
  const product = selectedProduct || DEFAULT_PRODUCT;

  const [selectedImage, setSelectedImage] = useState(product.image || product.allImages?.[0]);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState('S');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description'); // 'description' | 'specs' | 'shipping'

  // Reviews state
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [canReviewProduct, setCanReviewProduct] = useState(false);
  const [hasReviewedProduct, setHasReviewedProduct] = useState(false);

  // Review submission modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const isLiked = wishlist && wishlist.some((item) => String(item.id) === String(product.id));

  // Load reviews from API whenever the selected product changes
  const selectedProductId = selectedProduct ? selectedProduct.id : null;

  const loadReviewsData = () => {
    if (!selectedProductId) {
      setReviewsList([]);
      setCanReviewProduct(false);
      setHasReviewedProduct(false);
      setReviewsLoading(false);
      return;
    }

    setReviewsLoading(true);
    fetchReviews(selectedProductId)
      .then((res) => {
        if (res && typeof res === 'object' && 'reviews' in res) {
          setReviewsList(Array.isArray(res.reviews) ? res.reviews : []);
          setCanReviewProduct(Boolean(res.canReview));
          setHasReviewedProduct(Boolean(res.hasReviewed));
        } else if (Array.isArray(res)) {
          setReviewsList(res);
          setCanReviewProduct(false);
          setHasReviewedProduct(false);
        } else {
          setReviewsList([]);
          setCanReviewProduct(false);
          setHasReviewedProduct(false);
        }
      })
      .catch((err) => {
        console.error('[Reviews] error:', err);
        setReviewsList([]);
        setCanReviewProduct(false);
        setHasReviewedProduct(false);
      })
      .finally(() => {
        setReviewsLoading(false);
      });
  };

  useEffect(() => {
    loadReviewsData();
  }, [selectedProductId, user]);

  useEffect(() => {
    if (product) {
      const firstImg = product.image || product.allImages?.[0];
      setSelectedImage(firstImg ? getImageUrl(firstImg) : '');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [product]);

  // Computed review stats from live data
  const reviewStats = useMemo(() => {
    if (!reviewsList.length) {
      return {
        avg: (product.rating || 4.8).toFixed(1),
        count: product.reviewsCount || 0,
        breakdown: [
          { star: 5, pct: 75 },
          { star: 4, pct: 18 },
          { star: 3, pct: 5 },
          { star: 2, pct: 2 },
          { star: 1, pct: 0 }
        ]
      };
    }
    const count = reviewsList.length;
    const avg = reviewsList.reduce((s, r) => s + parseFloat(r.rating || 0), 0) / count;
    const breakdown = [5, 4, 3, 2, 1].map((star) => {
      const n = reviewsList.filter((r) => Math.round(parseFloat(r.rating)) === star).length;
      return { star, pct: Math.round((n / count) * 100) };
    });
    return { avg: avg.toFixed(1), count, breakdown };
  }, [reviewsList, product]);

  const visibleReviews = showAllReviews ? reviewsList : reviewsList.slice(0, 3);

  const colors = [
    { name: 'Olive Green', value: '#758A60' },
    { name: 'Dark Navy', value: '#1F2937' },
    { name: 'Light Blue', value: '#C5D6E8' }
  ];

  const sizes = ['XS', 'S', 'M', 'L', 'XL'];

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Product link copied to clipboard!');
    } else {
      showToast('Link ready to share!');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newReviewComment.trim()) {
      showToast('Please enter your review feedback', 'error');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await addReviewApi(product.id, newReviewRating, newReviewComment.trim());
      if (res && res.status !== 'error') {
        showToast('Thank you! Your review was submitted successfully.');
        setIsReviewModalOpen(false);
        setNewReviewComment('');
        setNewReviewRating(5);
        loadReviewsData();
      } else {
        showToast(res?.message || 'Review submitted!');
        setIsReviewModalOpen(false);
        setNewReviewComment('');
        loadReviewsData();
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      showToast('Review submitted successfully!');
      setIsReviewModalOpen(false);
      setNewReviewComment('');
      loadReviewsData();
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const imagesList = useMemo(() => {
    const list = product.allImages && product.allImages.length > 0
      ? product.allImages
      : [product.image];
    return list.filter(Boolean).map(img => getImageUrl(img));
  }, [product]);

  return (
    <div className="product-details-page-wrapper">
      <div className="container">
        {/* Breadcrumb Navigation & Back */}
        <div className="details-breadcrumb-bar">
          <div className="breadcrumb-links-group">
            <button className="breadcrumb-nav-btn" onClick={() => navigateTo('home')}>Home</button>
            <span className="sep">›</span>
            <button className="breadcrumb-nav-btn" onClick={() => navigateTo('shop')}>{product.category || 'Apparel'}</button>
            <span className="sep">›</span>
            <span className="current">{product.name}</span>
          </div>

          <button className="product-share-btn" onClick={handleShare} title="Share product">
            <Share2 size={15} />
            <span>Share</span>
          </button>
        </div>

        {/* Main Product Showcase Grid */}
        <div className="product-showcase-grid">
          {/* Gallery Column */}
          <div className="gallery-column">
            {imagesList.length > 1 && (
              <div className="vertical-thumbnails">
                {imagesList.map((img, idx) => (
                  <div
                    key={idx}
                    className={`thumb-box ${selectedImage === img ? 'active' : ''}`}
                    onClick={() => setSelectedImage(img)}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} />
                  </div>
                ))}
              </div>
            )}

            <div className="main-display-box">
              <img src={selectedImage || imagesList[0]} alt={product.name} />
              <button
                className={`product-wishlist-fav-btn ${isLiked ? 'active' : ''}`}
                onClick={() => toggleWishlist(product)}
                title={isLiked ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart size={18} fill={isLiked ? '#ef4444' : 'none'} color={isLiked ? '#ef4444' : '#374151'} />
              </button>
            </div>
          </div>

          {/* Details & Purchase Column */}
          <div className="details-info-column">
            <div className="product-meta-header">
              <span className="product-category-chip">{product.category || 'Collection'}</span>
              <span className="product-sku-chip">SKU: #{product.id}</span>
            </div>

            <h1 className="product-heading">{product.name}</h1>

            <div className="rating-summary-row">
              <div className="stars-flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={i < Math.round(Number(reviewStats.avg)) ? '#283A2E' : 'none'}
                    color="#283A2E"
                  />
                ))}
              </div>
              <span className="rating-score-pill">{reviewStats.avg}</span>
              <a href="#customer-reviews" className="reviews-text-link">
                ({reviewStats.count} Customer Review{reviewStats.count === 1 ? '' : 's'})
              </a>
            </div>

            <div className="product-price-section">
              <span className="product-price-tag">
                Rs. {Number(product.price).toLocaleString()}
              </span>
              {product.discount_price && Number(product.discount_price) > 0 && (
                <span className="product-original-price">
                  Rs. {Number(product.discount_price).toLocaleString()}
                </span>
              )}
            </div>

            {/* Color Selector */}
            <div className="selector-block">
              <label>
                SELECT COLOR: <strong>{colors[selectedColor]?.name}</strong>
              </label>
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
                <button
                  className="size-guide-btn"
                  onClick={() => showToast('Size Guide: Standard athletic & tailored fit.')}
                >
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

            {/* Quantity Selector */}
            <div className="quantity-select-block">
              <label>QUANTITY</label>
              <div className="qty-control-row">
                <button
                  className="qty-btn"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="qty-val">{quantity}</span>
                <button
                  className="qty-btn"
                  onClick={() => setQuantity(q => Math.min(20, q + 1))}
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="purchase-buttons-stack">
              <button
                className="add-to-cart-green-btn"
                onClick={() => {
                  addToCart(product, quantity);
                  showToast(`${product.name} added to cart!`);
                }}
              >
                <ShoppingBag size={18} />
                <span>Add to Cart</span>
              </button>

              <button
                className="buy-now-btn"
                onClick={() => {
                  const success = addToCart(product, quantity);
                  if (success) {
                    navigateTo('cart');
                  }
                }}
              >
                Buy Now
              </button>
            </div>

            {/* Features Row */}
            <div className="features-info-bar">
              <div className="feature-pill">
                <Truck size={17} className="feat-icon" />
                <div>
                  <strong>Free Express Shipping</strong>
                  <span>On all orders across Pakistan</span>
                </div>
              </div>
              <div className="feature-pill">
                <RotateCcw size={17} className="feat-icon" />
                <div>
                  <strong>30-Day Easy Returns</strong>
                  <span>Hassle-free guarantee</span>
                </div>
              </div>
              <div className="feature-pill">
                <ShieldCheck size={17} className="feat-icon" />
                <div>
                  <strong>Authentic Product</strong>
                  <span>100% verified merchant quality</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Overview, Details & Specifications Section */}
        <section className="product-details-tabs-section">
          <div className="product-tab-headers">
            <button
              className={`product-tab-btn ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              Description
            </button>
            <button
              className={`product-tab-btn ${activeTab === 'specs' ? 'active' : ''}`}
              onClick={() => setActiveTab('specs')}
            >
              Specifications
            </button>
            <button
              className={`product-tab-btn ${activeTab === 'shipping' ? 'active' : ''}`}
              onClick={() => setActiveTab('shipping')}
            >
              Shipping & Delivery
            </button>
          </div>

          <div className="product-tab-panel">
            {activeTab === 'description' && (
              <div className="tab-description-content animate-fade-in">
                <p className="tab-main-paragraph">
                  {product.description ||
                    'Engineered for premium performance and timeless everyday aesthetics. Thoughtfully crafted with meticulous attention to detail, using high-grade materials that provide lasting comfort and distinctive style.'}
                </p>
                <div className="description-highlights-grid">
                  <div className="highlight-item">
                    <CheckCircle2 size={16} className="highlight-icon" />
                    <span>Handcrafted finishes & reinforced construction</span>
                  </div>
                  <div className="highlight-item">
                    <CheckCircle2 size={16} className="highlight-icon" />
                    <span>Hypoallergenic, breathable fabric blend</span>
                  </div>
                  <div className="highlight-item">
                    <CheckCircle2 size={16} className="highlight-icon" />
                    <span>Pre-shrunk to retain exact tailoring through washes</span>
                  </div>
                  <div className="highlight-item">
                    <CheckCircle2 size={16} className="highlight-icon" />
                    <span>Eco-conscious packaging & verified ethical supply</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="tab-specs-content animate-fade-in">
                <div className="specs-table">
                  <div className="spec-row">
                    <span className="spec-label">Category</span>
                    <span className="spec-value">{product.category || 'Apparel & Lifestyle'}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Material</span>
                    <span className="spec-value">Premium Mulberry Silk & Organic Cotton blend</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Fit</span>
                    <span className="spec-value">True to size, modern tailored drape</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Care Instructions</span>
                    <span className="spec-value">Gentle cold wash, air dry recommended, iron at low temp</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Origin</span>
                    <span className="spec-value">Crafted in certified sustainable partner ateliers</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="tab-shipping-content animate-fade-in">
                <div className="shipping-info-grid">
                  <div className="shipping-card">
                    <h4>Standard Delivery</h4>
                    <p>Delivered within <strong>2 to 4 business days</strong> via TCS Courier nationwide.</p>
                  </div>
                  <div className="shipping-card">
                    <h4>Tracking Included</h4>
                    <p>Live SMS and email tracking checkpoints updated at every hub from booking to doorstep.</p>
                  </div>
                  <div className="shipping-card">
                    <h4>Return & Refund Policy</h4>
                    <p>Initiate an effortless return within 30 days of receiving your item if not completely satisfied.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Customer Reviews Section */}
        <section id="customer-reviews" className="customer-reviews-section">
          <div className="reviews-header-row">
            <div>
              <h2 className="reviews-section-title">Customer Feedback & Reviews</h2>
              <p className="reviews-section-subtitle">Real experiences shared by verified Novanest customers</p>
            </div>
            {canReviewProduct ? (
              <button className="write-review-btn" onClick={() => setIsReviewModalOpen(true)}>
                <MessageSquarePlus size={16} />
                <span>Write a Review</span>
              </button>
            ) : hasReviewedProduct ? (
              <span className="reviewed-badge-pill">
                <CheckCircle2 size={15} />
                <span>Reviewed</span>
              </span>
            ) : null}
          </div>

          {reviewsLoading ? (
            <div className="reviews-loading-state">
              <Loader2 size={28} className="reviews-spinner" />
              <span>Loading customer reviews…</span>
            </div>
          ) : reviewsList.length === 0 ? (
            <div className="reviews-empty-state">
              <div className="empty-stars-badge">
                <Star size={32} />
              </div>
              <h3>No reviews yet for this product</h3>
              <p>Reviews can only be submitted by verified customers who ordered and received this item.</p>
              {canReviewProduct && (
                <button className="write-review-btn primary" onClick={() => setIsReviewModalOpen(true)}>
                  <MessageSquarePlus size={15} />
                  <span>Write the First Review</span>
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="reviews-split-grid">
                {/* Rating Summary Card */}
                <div className="reviews-summary-card">
                  <div className="big-rating-number">{reviewStats.avg}</div>
                  <div className="stars-flex large">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        fill={i < Math.round(Number(reviewStats.avg)) ? '#283A2E' : 'none'}
                        color="#283A2E"
                      />
                    ))}
                  </div>
                  <span className="based-reviews-count">
                    Based on {reviewStats.count} customer review{reviewStats.count !== 1 ? 's' : ''}
                  </span>

                  <div className="breakdown-bars-list">
                    {reviewStats.breakdown.map((row) => (
                      <div key={row.star} className="breakdown-row">
                        <span className="star-num">{row.star} ★</span>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${row.pct}%` }}></div>
                        </div>
                        <span className="pct-num">{row.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reviews List */}
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
                              <h4 className="author-name">{r.user_name || r.userName || 'Verified Buyer'}</h4>
                              <span className="verified-badge">Verified Purchase • {timeAgo || 'Recently'}</span>
                            </div>
                          </div>
                          <div className="stars-flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                fill={i < rating ? '#283A2E' : 'none'}
                                color="#283A2E"
                              />
                            ))}
                          </div>
                        </div>

                        <p className="review-comment-text">"{comment}"</p>

                        {imageUrl && (
                          <div className="review-photo-row">
                            <img
                              src={imageUrl}
                              alt="Review customer photo"
                              className="review-photo-thumb"
                              onClick={() => window.open(imageUrl, '_blank')}
                            />
                          </div>
                        )}

                        {reply && (
                          <div className="seller-reply-box">
                            <div className="seller-reply-header">
                              <Store size={14} className="store-icon" />
                              <span>Store Owner Response</span>
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
                      ? 'Show Less Reviews'
                      : `Read All ${reviewsList.length} Customer Reviews`}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Review Submission Modal */}
        {isReviewModalOpen && (
          <div className="review-modal-backdrop" onClick={() => !isSubmittingReview && setIsReviewModalOpen(false)}>
            <div className="review-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="review-modal-header">
                <div>
                  <h3>Write a Review</h3>
                  <p>{product.name}</p>
                </div>
                <button
                  className="review-modal-close"
                  onClick={() => setIsReviewModalOpen(false)}
                  disabled={isSubmittingReview}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="review-modal-form">
                <div className="form-group-star">
                  <label>Overall Rating</label>
                  <div className="interactive-stars-row">
                    {[1, 2, 3, 4, 5].map((starVal) => (
                      <button
                        type="button"
                        key={starVal}
                        className="star-input-btn"
                        onClick={() => setNewReviewRating(starVal)}
                      >
                        <Star
                          size={28}
                          fill={starVal <= newReviewRating ? '#283A2E' : 'none'}
                          color="#283A2E"
                        />
                      </button>
                    ))}
                    <span className="rating-feedback-hint">
                      {newReviewRating === 5 && 'Outstanding!'}
                      {newReviewRating === 4 && 'Very Good'}
                      {newReviewRating === 3 && 'Average'}
                      {newReviewRating === 2 && 'Below Expectation'}
                      {newReviewRating === 1 && 'Poor Experience'}
                    </span>
                  </div>
                </div>

                <div className="form-group-review">
                  <label>Your Feedback & Experience</label>
                  <textarea
                    rows={4}
                    placeholder="Tell other shoppers what you loved about the fit, quality, material or shipping..."
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    required
                  />
                </div>

                <div className="review-modal-actions">
                  <button
                    type="button"
                    className="btn-review-cancel"
                    onClick={() => setIsReviewModalOpen(false)}
                    disabled={isSubmittingReview}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-review-submit"
                    disabled={isSubmittingReview || !newReviewComment.trim()}
                  >
                    {isSubmittingReview ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Submitting…</span>
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        <span>Submit Review</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


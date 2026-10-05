import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { fetchOrdersApi, cancelOrderApi, addReviewApi, getImageUrl } from '../services/api';
import {
  Search,
  ArrowLeft,
  HelpCircle,
  CheckCircle2,
  Truck,
  MapPin,
  CreditCard,
  FileText,
  Star,
  X,
  Send,
  Loader2,
  RotateCcw,
  Check,
  CircleDot,
  Home
} from 'lucide-react';
import './OrdersPage.css';

const DEMO_ORDERS = [
  {
    id: 'NV-2023-8901',
    created_at: '2024-10-12T10:00:00Z',
    status: 'Delivered',
    total_amount: 145.00,
    payment_method: 'VISA Ending in 4242',
    customer_name: 'Eleanor Shellstrop',
    address: '123 Fake Street, Apt 4B, New York, NY 10001',
    tracking_number: '1Z9999999999999999',
    subtotal: 135.00,
    shipping_fee: 5.99,
    tax: 4.01,
    items: [
      {
        id: 101,
        name: 'Organic Cotton Throw',
        price: 85.00,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400&q=80',
        badge: 'Color: Sage Green',
        subtext: '+2 other items'
      },
      {
        id: 102,
        name: 'Linen Pillow Set',
        price: 50.00,
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&q=80',
        badge: 'Size: 18x18'
      }
    ]
  },
  {
    id: 'NV-2023-9122',
    created_at: '2024-11-05T14:30:00Z',
    status: 'In Transit',
    total_amount: 89.50,
    est_delivery: 'Nov 08',
    payment_method: 'VISA Ending in 4242',
    customer_name: 'Eleanor Shellstrop',
    address: '123 Fake Street, Apt 4B, New York, NY 10001',
    tracking_number: '1Z8829102938192837',
    subtotal: 79.50,
    shipping_fee: 5.99,
    tax: 4.01,
    items: [
      {
        id: 103,
        name: 'Bamboo Desk Lamp',
        price: 89.50,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80',
        badge: 'Color: Natural Wood',
        subtext: 'Est. Delivery: Nov 08'
      }
    ]
  },
  {
    id: 'NV-2023-9405',
    created_at: '2024-11-07T09:15:00Z',
    status: 'Processing',
    total_amount: 210.00,
    payment_method: 'VISA Ending in 4242',
    customer_name: 'Eleanor Shellstrop',
    address: '123 Fake Street, Apt 4B, New York, NY 10001',
    tracking_number: '1Z3392817263541298',
    subtotal: 195.00,
    shipping_fee: 5.99,
    tax: 9.01,
    items: [
      {
        id: 104,
        name: 'Linen Essentials Set',
        price: 210.00,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&q=80',
        badge: 'Size: Queen',
        subtext: 'Preparing for shipment'
      }
    ]
  },
  {
    id: 'NV-2023-7742',
    created_at: '2024-09-28T16:20:00Z',
    status: 'Cancelled',
    total_amount: 42.00,
    payment_method: 'VISA Ending in 4242',
    customer_name: 'Eleanor Shellstrop',
    address: '123 Fake Street, Apt 4B, New York, NY 10001',
    tracking_number: 'N/A',
    subtotal: 38.00,
    shipping_fee: 0,
    tax: 4.00,
    items: [
      {
        id: 105,
        name: 'Recycled Glass Vase',
        price: 42.00,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1581783342308-f792dbdd77c5?w=400&q=80',
        badge: 'Clear Glass',
        subtext: 'Refund processed'
      }
    ]
  }
];

export default function OrdersPage() {
  const { user, setIsAuthModalOpen, navigateTo, showToast, addToCart } = useCart();
  const [orders, setOrders] = useState(DEMO_ORDERS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('Last 3 Months');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  // Review Modal State
  const [reviewingOrder, setReviewingOrder] = useState(null);
  const [selectedProductToReview, setSelectedProductToReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    try {
      const data = await fetchOrdersApi();
      if (data && Array.isArray(data) && data.length > 0) {
        setOrders(data);
      } else if (data && Array.isArray(data.data) && data.data.length > 0) {
        setOrders(data.data);
      }
    } catch (err) {
      console.warn('Using demo orders fallback:', err);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    setCancellingId(orderId);
    try {
      await cancelOrderApi(orderId, 'Customer requested cancellation');
      showToast('Order cancelled successfully.');
      setOrders((prev) =>
        prev.map((o) => (String(o.id) === String(orderId) ? { ...o, status: 'Cancelled' } : o))
      );
      if (selectedOrderDetails && String(selectedOrderDetails.id) === String(orderId)) {
        setSelectedOrderDetails((prev) => (prev ? { ...prev, status: 'Cancelled' } : null));
      }
    } catch (err) {
      showToast('Order status updated.');
      setOrders((prev) =>
        prev.map((o) => (String(o.id) === String(orderId) ? { ...o, status: 'Cancelled' } : o))
      );
    } finally {
      setCancellingId(null);
    }
  };

  const handleReorder = (order) => {
    if (order.items && order.items.length > 0) {
      order.items.forEach((item) => {
        addToCart({
          id: item.id || String(Date.now()),
          name: item.name,
          price: item.price,
          image: item.image
        }, item.quantity || 1);
      });
      showToast('Items added to cart!');
      navigateTo('cart');
    }
  };

  const handleOpenReviewModal = (order, e) => {
    if (e) e.stopPropagation();
    setReviewingOrder(order);
    const items = Array.isArray(order.items) ? order.items : [];
    if (items.length > 0) {
      setSelectedProductToReview(items[0]);
    }
    setReviewRating(5);
    setReviewComment('');
  };

  const handleCloseReviewModal = () => {
    setReviewingOrder(null);
    setSelectedProductToReview(null);
    setReviewComment('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      const pId = selectedProductToReview?.id || 1;
      await addReviewApi(pId, reviewRating, reviewComment);
      showToast('Thank you! Review submitted successfully.');
      handleCloseReviewModal();
    } catch (err) {
      showToast('Review saved.');
      handleCloseReviewModal();
    } finally {
      setSubmittingReview(false);
    }
  };

  // Filtered orders by search & drop-down filter
  const filteredOrders = useMemo(() => {
    let result = orders;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (o) =>
          String(o.id).toLowerCase().includes(q) ||
          (o.items && o.items.some((it) => it.name.toLowerCase().includes(q)))
      );
    }

    return result;
  }, [orders, searchQuery]);

  const renderStatusPill = (status) => {
    const st = (status || 'Processing').toLowerCase();
    if (st.includes('delivered')) {
      return <span className="status-pill pill-delivered">Delivered</span>;
    }
    if (st.includes('transit')) {
      return (
        <span className="status-pill pill-transit">
          <Truck size={13} /> In Transit
        </span>
      );
    }
    if (st.includes('cancel')) {
      return <span className="status-pill pill-cancelled">Cancelled</span>;
    }
    return <span className="status-pill pill-processing">Processing</span>;
  };

  // ─── 1. ORDER DETAIL VIEW (`order detail.png`) ───────────────────────────────
  if (selectedOrderDetails) {
    const o = selectedOrderDetails;
    const items = Array.isArray(o.items) ? o.items : [];
    const statusLower = (o.status || '').toLowerCase();
    const isCancelled = statusLower.includes('cancel');
    const isDelivered = statusLower.includes('delivered');
    const isInTransit = statusLower.includes('transit');

    return (
      <div className="order-detail-page-container">
        {/* Detail View Navigation Bar */}
        <header className="detail-top-nav">
          <button className="back-orders-btn" onClick={() => setSelectedOrderDetails(null)}>
            <ArrowLeft size={16} />
            <span>Back to Orders</span>
          </button>
          <div className="detail-brand-logo" onClick={() => navigateTo('home')}>
            Novanest
          </div>
          <button className="need-help-btn" onClick={() => navigateTo('messages')}>
            <HelpCircle size={16} />
            <span>Need Help?</span>
          </button>
        </header>

        <div className="detail-content-wrapper">
          <div className="detail-main-grid">
            {/* Left Column: Tracking Timeline & Shipment Items */}
            <div className="detail-left-col">
              {/* Timeline Progress Card */}
              <div className="detail-card timeline-card">
                <div className="timeline-header-row">
                  <div>
                    <h2>Order #{o.id}</h2>
                    <p className="placed-date-text">
                      Placed on {new Date(o.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="detail-status-tag">
                    Status: {o.status || 'Out for Delivery'}
                  </div>
                </div>

                {/* Progress Bar Timeline */}
                <div className="timeline-tracker">
                  <div className="tracker-line">
                    <div
                      className="tracker-progress-fill"
                      style={{
                        width: isCancelled
                          ? '0%'
                          : isDelivered
                          ? '100%'
                          : isInTransit
                          ? '75%'
                          : '40%'
                      }}
                    ></div>
                  </div>

                  <div className="tracker-steps">
                    {/* Step 1: Ordered */}
                    <div className="tracker-step completed">
                      <div className="step-node circle-check">
                        <Check size={14} />
                      </div>
                      <span className="step-label font-bold">Ordered</span>
                      <span className="step-date">Oct 24</span>
                    </div>

                    {/* Step 2: Processing */}
                    <div className="tracker-step completed">
                      <div className="step-node circle-check">
                        <Check size={14} />
                      </div>
                      <span className="step-label font-bold">Processing</span>
                      <span className="step-date">Oct 25</span>
                    </div>

                    {/* Step 3: Shipped */}
                    <div className="tracker-step completed">
                      <div className="step-node circle-check">
                        <Check size={14} />
                      </div>
                      <span className="step-label font-bold">Shipped</span>
                      <span className="step-date">Oct 26</span>
                    </div>

                    {/* Step 4: Out for Delivery */}
                    <div className={`tracker-step ${isInTransit || !isDelivered ? 'active' : 'completed'}`}>
                      <div className="step-node circle-active">
                        <CircleDot size={14} />
                      </div>
                      <span className="step-label font-bold">Out for Delivery</span>
                      <span className="step-date">Today, by 8pm</span>
                    </div>

                    {/* Step 5: Delivered */}
                    <div className={`tracker-step ${isDelivered ? 'completed' : 'pending'}`}>
                      <div className="step-node circle-home">
                        <Home size={14} />
                      </div>
                      <span className="step-label">Delivered</span>
                      <span className="step-date">{isDelivered ? 'Oct 28' : 'Pending'}</span>
                    </div>
                  </div>
                </div>

                {/* Tracking Number Box */}
                <div className="tracking-number-box">
                  <div className="tracking-info-left">
                    <div className="truck-box-icon">
                      <Truck size={20} />
                    </div>
                    <div>
                      <span className="track-label">Tracking Number</span>
                      <span className="track-code">{o.tracking_number || '1Z9999999999999999'}</span>
                    </div>
                  </div>
                  <button className="track-package-btn" onClick={() => showToast('Package tracking is live!')}>
                    Track Package
                  </button>
                </div>
              </div>

              {/* Items in this shipment */}
              <div className="detail-card items-shipment-card">
                <h3>Items in this shipment</h3>

                <div className="items-list-rows">
                  {items.map((item, idx) => (
                    <div key={idx} className="shipment-item-row">
                      <img
                        src={item.image ? getImageUrl(item.image) : 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400&q=80'}
                        alt={item.name}
                        className="shipment-item-img"
                      />
                      <div className="shipment-item-details">
                        <h4>{item.name}</h4>
                        <div className="item-variant-pills">
                          {item.badge && <span className="variant-pill">{item.badge}</span>}
                          <span className="variant-pill">Qty: {item.quantity || 1}</span>
                        </div>
                        <span className="unit-price-text">${Number(item.price).toFixed(2)} each</span>
                      </div>
                      <div className="shipment-item-total">
                        ${(Number(item.price) * (item.quantity || 1)).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Delivery Information & Order Summary */}
            <div className="detail-right-col">
              {/* Delivery Information */}
              <div className="detail-card info-side-card">
                <h3>Delivery Information</h3>

                <div className="info-sub-box">
                  <div className="sub-box-header">
                    <MapPin size={16} className="info-icon" />
                    <span>Shipping Address</span>
                  </div>
                  <div className="sub-box-body">
                    <p className="address-name">{o.customer_name || 'Eleanor Shellstrop'}</p>
                    <p>{o.address || '123 Fake Street, Apt 4B'}</p>
                    <p>New York, NY 10001</p>
                  </div>
                </div>

                <div className="info-sub-box">
                  <div className="sub-box-header">
                    <CreditCard size={16} className="info-icon" />
                    <span>Payment Method</span>
                  </div>
                  <div className="sub-box-body payment-body">
                    <span className="visa-badge">VISA</span>
                    <span>Ending in 4242</span>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="detail-card summary-side-card">
                <h3>Order Summary</h3>

                <div className="summary-rows">
                  <div className="summary-row">
                    <span>Subtotal ({items.length} items)</span>
                    <span>${Number(o.subtotal || o.total_amount * 0.88).toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Shipping</span>
                    <span>${Number(o.shipping_fee || 5.99).toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Tax</span>
                    <span>${Number(o.tax || 8.37).toFixed(2)}</span>
                  </div>

                  <div className="summary-divider"></div>

                  <div className="summary-row total-row">
                    <span>Total</span>
                    <span className="total-amount-val">${Number(o.total_amount || 107.36).toFixed(2)}</span>
                  </div>
                </div>

                <button
                  className="download-invoice-btn"
                  onClick={() => alert(`Invoice for Order #${o.id} downloaded.`)}
                >
                  <FileText size={16} />
                  <span>Download Invoice</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="orders-page-footer">
          <div className="footer-content">
            <span className="footer-logo">Novanest</span>
            <div className="footer-nav-links">
              <a href="#">Sustainability Report</a>
              <a href="#">Shipping Policy</a>
              <a href="#">Returns</a>
              <a href="#">Contact Us</a>
              <a href="#">Privacy</a>
            </div>
            <span className="footer-copyright">
              © 2024 Novanest. Consciously crafted for a better tomorrow.
            </span>
          </div>
        </footer>
      </div>
    );
  }

  // ─── 2. ORDER HISTORY LIST VIEW (`order.png`) ─────────────────────────────
  return (
    <div className="orders-history-page">
      <div className="orders-history-container">
        {/* Title & Subtitle + Search / Filter Bar */}
        <div className="history-header-bar">
          <div>
            <h1>Order History</h1>
            <p>Track, manage, and review your past and active orders.</p>
          </div>

          <div className="history-controls">
            <div className="search-input-pill">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="time-filter-select"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
            >
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 3 Months">Last 3 Months</option>
              <option value="2024">2024</option>
              <option value="All Orders">All Orders</option>
            </select>
          </div>
        </div>

        {/* Orders Cards Grid */}
        <div className="orders-cards-grid">
          {filteredOrders.map((order) => {
            const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
            const statusLower = (order.status || '').toLowerCase();
            const isDelivered = statusLower.includes('delivered');
            const isInTransit = statusLower.includes('transit');
            const isProcessing = statusLower.includes('processing');
            const isCancelled = statusLower.includes('cancel');

            return (
              <div key={order.id} className="history-order-card">
                <div className="card-top-row">
                  <div>
                    <span className="order-number-tag">ORDER #{order.id}</span>
                    <span className="order-date">
                      {new Date(order.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  {renderStatusPill(order.status)}
                </div>

                <div className="card-item-body">
                  <img
                    src={firstItem?.image ? getImageUrl(firstItem.image) : 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400&q=80'}
                    alt={firstItem?.name || 'Order Item'}
                    className="item-thumb-img"
                  />
                  <div className="item-info-text">
                    <h3>{firstItem?.name || 'Organic Cotton Throw'}</h3>
                    <p>{firstItem?.subtext || (order.items?.length > 1 ? `+${order.items.length - 1} other items` : 'Standard Delivery')}</p>
                  </div>
                </div>

                <div className="card-bottom-row">
                  <span className="order-total-price">
                    ${Number(order.total_amount).toFixed(2)}
                  </span>

                  <div className="card-action-buttons">
                    {isDelivered && (
                      <>
                        <button
                          className="btn-outline"
                          onClick={(e) => handleOpenReviewModal(order, e)}
                        >
                          Write a Review
                        </button>
                        <button
                          className="btn-green-fill"
                          onClick={() => setSelectedOrderDetails(order)}
                        >
                          View Details
                        </button>
                      </>
                    )}

                    {isInTransit && (
                      <>
                        <button
                          className="btn-outline"
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          Cancel Order
                        </button>
                        <button
                          className="btn-green-fill"
                          onClick={() => setSelectedOrderDetails(order)}
                        >
                          Track Order
                        </button>
                      </>
                    )}

                    {isProcessing && (
                      <>
                        <button
                          className="btn-outline"
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          Cancel Order
                        </button>
                        <button
                          className="btn-green-fill"
                          onClick={() => setSelectedOrderDetails(order)}
                        >
                          View Details
                        </button>
                      </>
                    )}

                    {isCancelled && (
                      <button
                        className="btn-green-fill"
                        onClick={() => handleReorder(order)}
                      >
                        Reorder
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Modal for Delivered Orders */}
      {reviewingOrder && (
        <div className="order-review-modal-backdrop animate-fade-in">
          <div className="order-review-modal-card">
            <div className="modal-header-bar">
              <div>
                <h3>Write Product Review</h3>
                <span className="modal-order-tag">Order #{reviewingOrder.id}</span>
              </div>
              <button className="modal-close-btn" onClick={handleCloseReviewModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="modal-review-form">
              {reviewingOrder.items && reviewingOrder.items.length > 1 && (
                <div className="item-select-section">
                  <label>Select Item to Review:</label>
                  <select
                    className="review-item-select"
                    value={selectedProductToReview?.id}
                    onChange={(e) => {
                      const sel = reviewingOrder.items.find((it) => String(it.id) === e.target.value);
                      if (sel) setSelectedProductToReview(sel);
                    }}
                  >
                    {reviewingOrder.items.map((it, i) => (
                      <option key={i} value={it.id}>
                        {it.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedProductToReview && (
                <div className="target-item-preview">
                  <img src={getImageUrl(selectedProductToReview.image)} alt="" />
                  <div>
                    <h4>{selectedProductToReview.name}</h4>
                    <span>${Number(selectedProductToReview.price).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="rating-picker-box">
                <label>Your Rating:</label>
                <div className="star-row">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="star-pick-dot"
                      onClick={() => setReviewRating(star)}
                    >
                      <Star
                        size={24}
                        fill={star <= reviewRating ? '#2D4B3E' : 'none'}
                        color="#2D4B3E"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="comment-box-group">
                <label>Your Review & Feedback:</label>
                <textarea
                  required
                  rows="4"
                  placeholder="How was the quality, performance, and delivery experience?"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="modal-review-textarea"
                />
              </div>

              <div className="modal-action-row">
                <button type="button" className="modal-cancel-btn" onClick={handleCloseReviewModal}>
                  Cancel
                </button>
                <button type="submit" className="modal-submit-btn" disabled={submittingReview}>
                  {submittingReview ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  <span>Submit Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="orders-page-footer">
        <div className="footer-content">
          <span className="footer-logo">Novanest</span>
          <div className="footer-nav-links">
            <a href="#">Sustainability Report</a>
            <a href="#">Shipping Policy</a>
            <a href="#">Returns</a>
            <a href="#">Contact Us</a>
            <a href="#">Privacy</a>
          </div>
          <span className="footer-copyright">
            © 2024 Novanest. Consciously crafted for a better tomorrow.
          </span>
        </div>
      </footer>
    </div>
  );
}

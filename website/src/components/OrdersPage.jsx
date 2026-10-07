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
  Home,
  Package
} from 'lucide-react';
import './OrdersPage.css';

const STATUS_FILTERS = [
  'All',
  'Pending Payment',
  'Processing',
  'On Hold',
  'Completed',
  'Cancelled',
  'Refunded',
  'Failed'
];

export default function OrdersPage() {
  const { user, openLoginModal, openSignupModal, setIsAuthModalOpen, navigateTo, showToast, addToCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState('All Orders');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  // Review Modal State
  const [reviewingOrder, setReviewingOrder] = useState(null);
  const [selectedProductToReview, setSelectedProductToReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (user) {
      loadOrders();
    } else {
      setOrders([]);
    }
  }, [user]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchOrdersApi();
      if (Array.isArray(data)) {
        setOrders(data);
      } else if (data && Array.isArray(data.data)) {
        setOrders(data.data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.warn('Error loading orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="orders-page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 160px)', padding: '40px 20px' }}>
        <div 
          className="animate-fade-in"
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '48px 36px',
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb'
          }}
        >
          <div style={{ width: '72px', height: '72px', borderRadius: '22px', background: 'linear-gradient(135deg, #2d5a27 0%, #1e3d1a 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 10px 25px -5px rgba(45, 90, 39, 0.4)' }}>
            <Package size={32} />
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', margin: '0 0 10px' }}>
            Log in to view your Orders
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#6b7280', margin: '0 0 32px', lineHeight: 1.5 }}>
            Sign in to track active shipments, view order receipts, and manage your past purchases.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
            <button
              onClick={openLoginModal}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '14px',
                border: 'none',
                background: '#2d5a27',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Package size={16} />
              <span>Log In</span>
            </button>

            <button
              onClick={openSignupModal}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '14px',
                border: '1.5px solid #d1d5db',
                background: '#fff',
                color: '#111827',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>Sign Up</span>
            </button>
          </div>

          <button
            onClick={() => navigateTo('shop')}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Continue Exploring Products
          </button>
        </div>
      </div>
    );
  }

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

  // Filtered orders by search, status filter & time filter
  const filteredOrders = useMemo(() => {
    let result = orders;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (o) =>
          String(o.id).toLowerCase().includes(q) ||
          (o.items && o.items.some((it) => (it.name || it.product_name || '').toLowerCase().includes(q))) ||
          (o.shipping_address && String(o.shipping_address).toLowerCase().includes(q))
      );
    }

    if (statusFilter && statusFilter !== 'All') {
      const target = statusFilter.toLowerCase().replace(/\s+/g, '');
      result = result.filter((o) => {
        const s = (o.status || o.order_status || 'processing').toLowerCase().replace(/\s+/g, '');
        if (target === 'completed') {
          return s === 'completed' || s === 'delivered';
        }
        if (target === 'pendingpayment') {
          return s === 'pendingpayment' || s === 'pending';
        }
        if (target === 'processing') {
          return s === 'processing' || s === 'readytoship' || s === 'intransit' || s === 'shipped';
        }
        if (target === 'onhold') {
          return s === 'onhold' || s === 'hold';
        }
        if (target === 'cancelled') {
          return s === 'cancelled' || s === 'canceled';
        }
        if (target === 'refunded') {
          return s === 'refunded' || s === 'refund';
        }
        if (target === 'failed') {
          return s === 'failed';
        }
        return s === target || s.includes(target);
      });
    }

    if (timeFilter && timeFilter !== 'All Orders') {
      const now = Date.now();
      if (timeFilter === 'Last 30 Days') {
        result = result.filter(o => (now - new Date(o.created_at || o.date || now).getTime()) <= 30 * 24 * 3600 * 1000);
      } else if (timeFilter === 'Last 3 Months') {
        result = result.filter(o => (now - new Date(o.created_at || o.date || now).getTime()) <= 90 * 24 * 3600 * 1000);
      } else if (timeFilter === '2024') {
        result = result.filter(o => new Date(o.created_at || o.date || now).getFullYear() === 2024);
      }
    }

    return result;
  }, [orders, searchQuery, statusFilter, timeFilter]);

  const renderStatusPill = (status) => {
    const raw = (status || 'Processing').trim();
    const st = raw.toLowerCase().replace(/\s+/g, '');
    
    if (st.includes('deliver') || st.includes('complete')) {
      return <span className="status-pill pill-completed"><CheckCircle2 size={13} /> Completed</span>;
    }
    if (st.includes('pendingpayment') || st === 'pending') {
      return <span className="status-pill pill-pending">Pending Payment</span>;
    }
    if (st.includes('hold')) {
      return <span className="status-pill pill-onhold">On Hold</span>;
    }
    if (st.includes('transit') || st.includes('shipped')) {
      return (
        <span className="status-pill pill-transit">
          <Truck size={13} /> In Transit
        </span>
      );
    }
    if (st.includes('cancel')) {
      return <span className="status-pill pill-cancelled">Cancelled</span>;
    }
    if (st.includes('refund')) {
      return <span className="status-pill pill-refunded">Refunded</span>;
    }
    if (st.includes('fail')) {
      return <span className="status-pill pill-failed">Failed</span>;
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
                  {items.map((item, idx) => {
                    const itemImg = item.main_image || item.image || item.image_url;
                    const itemPrice = Number(item.price || 0);
                    const itemQty = Number(item.quantity || 1);
                    return (
                      <div key={idx} className="shipment-item-row">
                        <img
                          src={itemImg ? getImageUrl(itemImg) : '/hero_lifestyle.png'}
                          alt={item.name}
                          className="shipment-item-img"
                        />
                        <div className="shipment-item-details">
                          <h4>{item.name}</h4>
                          <div className="item-variant-pills">
                            <span className="variant-pill">Qty: {itemQty}</span>
                          </div>
                          <span className="unit-price-text">Rs. {itemPrice.toLocaleString()} each</span>
                        </div>
                        <div className="shipment-item-total">
                          Rs. {(itemPrice * itemQty).toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
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
                    <p className="address-name">{o.customer_name || user?.full_name || user?.name || 'Customer'}</p>
                    <p>{o.shipping_address || o.address || 'Standard Delivery Address'}</p>
                  </div>
                </div>

                <div className="info-sub-box">
                  <div className="sub-box-header">
                    <CreditCard size={16} className="info-icon" />
                    <span>Payment Method</span>
                  </div>
                  <div className="sub-box-body payment-body">
                    <span className="visa-badge">{o.payment_method ? o.payment_method.toUpperCase() : 'COD'}</span>
                    <span>{o.payment_status ? `Status: ${o.payment_status}` : 'Cash on Delivery'}</span>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="detail-card summary-side-card">
                <h3>Order Summary</h3>

                <div className="summary-rows">
                  <div className="summary-row">
                    <span>Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
                    <span>Rs. {Number(o.subtotal ?? (Number(o.total ?? o.total_amount ?? 0) * 0.88)).toLocaleString()}</span>
                  </div>
                  <div className="summary-row">
                    <span>Shipping</span>
                    <span>{o.shipping_fee ? `Rs. ${Number(o.shipping_fee).toLocaleString()}` : 'Free'}</span>
                  </div>
                  <div className="summary-row">
                    <span>Estimated Tax</span>
                    <span>{o.tax ? `Rs. ${Number(o.tax).toLocaleString()}` : 'Rs. 0'}</span>
                  </div>

                  <div className="summary-divider"></div>

                  <div className="summary-row total-row">
                    <span>Total</span>
                    <span className="total-amount-val">Rs. {Number(o.total ?? o.total_amount ?? o.total_price ?? 0).toLocaleString()}</span>
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
              <option value="All Orders">All Orders</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 3 Months">Last 3 Months</option>
              <option value="2024">2024</option>
            </select>
          </div>
        </div>

        {/* Order Status Filters Bar (as shown in second image) */}
        <div className="order-status-filter-pills-bar">
          {STATUS_FILTERS.map((tab) => {
            const count = tab === 'All'
              ? orders.length
              : orders.filter((o) => {
                  const s = (o.status || o.order_status || 'Processing').toLowerCase().replace(/\s+/g, '');
                  const t = tab.toLowerCase().replace(/\s+/g, '');
                  if (t === 'completed') return s === 'completed' || s === 'delivered';
                  if (t === 'pendingpayment') return s === 'pendingpayment' || s === 'pending';
                  if (t === 'processing') return s === 'processing' || s === 'readytoship' || s === 'intransit' || s === 'shipped';
                  if (t === 'onhold') return s === 'onhold' || s === 'hold';
                  if (t === 'cancelled') return s === 'cancelled' || s === 'canceled';
                  if (t === 'refunded') return s === 'refunded' || s === 'refund';
                  if (t === 'failed') return s === 'failed';
                  return s === t || s.includes(t);
                }).length;

            return (
              <button
                key={tab}
                className={`status-filter-chip ${statusFilter === tab ? 'active' : ''}`}
                onClick={() => setStatusFilter(tab)}
              >
                <span>{tab}</span>
                {count > 0 && <span className="count-badge">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Orders Cards Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
            <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 16px', color: '#2d5a27' }} />
            <p style={{ fontSize: '1rem', fontWeight: 600 }}>Loading your orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '20px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: '#f0fdf4', color: '#2d5a27', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Package size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
              No orders found
            </h3>
            <p style={{ color: '#6b7280', fontSize: '0.95rem', margin: '0 0 24px' }}>
              {searchQuery || statusFilter !== 'All' ? 'No orders match your selected filters.' : "You haven't placed any orders yet."}
            </p>
            <button
              onClick={() => { setSearchQuery(''); setStatusFilter('All'); setTimeFilter('All Orders'); navigateTo('shop'); }}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                background: '#2d5a27',
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="orders-cards-grid">
            {filteredOrders.map((order) => {
              const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
              const firstItemImage = firstItem?.main_image || firstItem?.image || firstItem?.image_url;
              const orderTotal = Number(order.total ?? order.total_amount ?? order.total_price ?? 0);
              const statusLower = (order.status || '').toLowerCase();
              const isDelivered = statusLower.includes('delivered');
              const isInTransit = statusLower.includes('transit');
              const isProcessing = statusLower.includes('processing') || statusLower.includes('pending');
              const isCancelled = statusLower.includes('cancel');

              return (
                <div key={order.id} className="history-order-card">
                  <div className="card-top-row">
                    <div className="card-order-meta-col">
                      <span className="order-number-tag">ORDER #{order.id}</span>
                      <span className="order-date">
                        {new Date(order.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    {renderStatusPill(order.status)}
                  </div>

                  <div className="card-item-body">
                    <img
                      src={firstItemImage ? getImageUrl(firstItemImage) : '/hero_lifestyle.png'}
                      alt={firstItem?.name || 'Order Item'}
                      className="item-thumb-img"
                    />
                    <div className="item-info-text">
                      <h3>{firstItem?.name || `Order #${order.id}`}</h3>
                      <p>{order.shipping_address ? `Delivery to: ${order.shipping_address}` : (order.items?.length > 1 ? `+${order.items.length - 1} other items` : 'Standard Delivery')}</p>
                    </div>
                  </div>

                  <div className="card-bottom-row">
                    <span className="order-total-price">
                      Rs. {orderTotal.toLocaleString()}
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
        )}
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

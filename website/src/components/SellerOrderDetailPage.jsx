import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { getImageUrl, tcsTrackingApi, openTcsLabelApi } from '../services/api';
import TrackingTimeline from './TrackingTimeline';
import {
  Printer,
  CheckCircle2,
  Package,
  User,
  Mail,
  Phone,
  Truck,
  CreditCard,
  Clock,
  ArrowLeft
} from 'lucide-react';
import './SellerOrderDetailPage.css';

export default function SellerOrderDetailPage({ order, onBack, onOpenOrderChat }) {
  const { showToast } = useCart();

  // Hooks run before the null-order early return below — derive the id safely.
  const rawOrderId = String(order?.id ?? order?.order_id ?? '');
  const numericId = rawOrderId.replace(/[^0-9]/g, '');
  const [tracking, setTracking] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);

  const loadTracking = async () => {
    if (!numericId) return;
    setTrackLoading(true);
    const res = await tcsTrackingApi(numericId);
    if (res) setTracking(res);
    setTrackLoading(false);
  };

  useEffect(() => {
    setTracking(null);
    loadTracking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericId]);

  if (!order) return null;

  // `id` arrives as a number from the API (and may already be formatted by
  // other callers) — normalise to a '#125' style string so .replace() below
  // never runs on a number.
  const orderId = rawOrderId ? (rawOrderId.startsWith('#') ? rawOrderId : `#${rawOrderId}`) : '#ORD-1';

  const handlePrintLabel = async () => {
    const cn = tracking?.tcs_cn || order.tcs_cn;
    if (!cn) {
      showToast('Not booked with TCS yet — use the Shipments tab to book', 'error');
      return;
    }
    try {
      await openTcsLabelApi(numericId);
      showToast('TCS label downloaded — open the PDF to print');
    } catch (e) {
      showToast(e.message || 'Label failed', 'error');
    }
  };

  // "2026-10-13 17:22:28" -> "Oct 13, 2026, 5:22 PM"
  const formatPlacedAt = (value) => {
    if (!value) return 'Recently placed';
    const parsed = new Date(String(value).replace(' ', 'T'));
    if (isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  const customerName = order.customer || order.customer_name || order.customerName || 'Customer';
  const customerEmail = order.customer_email || (order.user_email) || 'customer@novanest.com';
  const customerPhone = order.customer_phone || '+92 300 1234567';
  const shippingAddress = order.shipping_address || 'Standard Delivery Address';
  const paymentMethod = order.payment_method || 'Cash on Delivery';
  // Card orders are prepaid online; COD orders are collected on delivery.
  const rawPayStatus = (order.payment_status || '').toLowerCase();
  const isPaid = rawPayStatus === 'paid';
  const paymentStatus = isPaid ? 'Paid' : (rawPayStatus === 'failed' ? 'Failed' : 'Pending');
  const payStatusColor = isPaid ? '#16a34a' : (rawPayStatus === 'failed' ? '#dc2626' : '#d97706');
  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [
    {
      name: order.product || order.product_name || 'Product Item',
      quantity: 1,
      price: order.total || order.total_amount || 0,
      sku: `SKU-${order.id || '101'}`,
      main_image: order.image || order.product_img
    }
  ];

  const totalAmount = Number(order.total || order.total_amount || 0);

  return (
    <div className="seller-order-detail-page animate-fade-in">
      {/* ── Top Bar: Back Button in white space ── */}
      <div className="order-detail-top-nav">
        <button type="button" className="order-detail-back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to Orders</span>
        </button>
      </div>

      {/* Top Breadcrumb & Action Bar */}
      <div className="detail-breadcrumb-bar">
        <div className="breadcrumb-links">
          <span className="b-root">Orders</span>
          <span className="b-sep">&gt;</span>
          <span className="b-curr">{orderId}</span>
        </div>

        <div className="detail-actions-right">
          <button className="btn-cancel-order" onClick={() => showToast(`Cancellation initiated for ${orderId}`)}>
            Cancel Order
          </button>
          <button className="btn-outline-dark" onClick={() => onOpenOrderChat ? onOpenOrderChat(order) : showToast(`Opening chat with ${customerName}...`)}>
            Contact Customer
          </button>
          <button className="btn-print-label" onClick={handlePrintLabel}>
            <Printer size={16} />
            <span>Print Label</span>
          </button>
        </div>
      </div>

      {/* Order Title & Status Banner */}
      <div className="order-detail-title-banner">
        <div className="title-status-flex">
          <h1 className="order-main-h1">Order {orderId}</h1>
          <span className={`order-status-pill green`}>{order.status || 'Ready to Ship'}</span>
        </div>
        <p className="order-placed-time">{formatPlacedAt(order.date || order.created_at)}</p>
      </div>

      {/* 4 Summary KPI Bar Cards */}
      <div className="seller-order-kpis-grid">
        <div className="s-kpi-card">
          <span className="s-kpi-label">TOTAL AMOUNT</span>
          <div className="s-kpi-val">Rs. {totalAmount.toLocaleString()}</div>
        </div>
        <div className="s-kpi-card">
          <span className="s-kpi-label">TOTAL ITEMS</span>
          <div className="s-kpi-val">{items.reduce((s, i) => s + (parseInt(i.quantity) || 1), 0)}</div>
        </div>
        <div className="s-kpi-card">
          <span className="s-kpi-label">PAYMENT</span>
          <div className="s-kpi-val flex-check"><CheckCircle2 size={16} color="#16a34a" /> {paymentMethod}</div>
        </div>
        <div className="s-kpi-card">
          <span className="s-kpi-label">FULFILLMENT</span>
          <div className="s-kpi-val flex-box"><Package size={16} color="#059669" /> {order.status || 'In Progress'}</div>
        </div>
      </div>

      {/* Main Grid: Left Column & Right Column */}
      <div className="seller-order-main-grid">
        {/* Left Column */}
        <div className="grid-left-column">
          {/* Items Ordered Table Card */}
          <div className="detail-card-panel">
            <h3 className="panel-title">Items Ordered ({items.length})</h3>
            <table className="items-ordered-table">
              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>SKU</th>
                  <th>QTY</th>
                  <th>UNIT PRICE</th>
                  <th className="text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const itemImg = item.main_image ? getImageUrl(item.main_image) : 'https://placehold.co/60x60?text=Item';
                  const unitPrice = parseFloat(item.price || 0);
                  const qty = parseInt(item.quantity || 1);
                  const lineTotal = unitPrice * qty;
                  return (
                    <tr key={idx}>
                      <td>
                        <div className="product-item-cell">
                          <img src={itemImg} alt={item.name} onError={(e) => { e.target.src = 'https://placehold.co/60x60?text=Item'; }} />
                          <div>
                            <strong>{item.name || `Product #${item.product_id || idx + 1}`}</strong>
                            <span>{item.variant_info || 'Standard Variant'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="sku-code">{item.sku || `SKU-${item.product_id || idx + 1}`}</td>
                      <td>{qty}</td>
                      <td>Rs. {unitPrice.toLocaleString()}</td>
                      <td className="text-right bold-txt">Rs. {lineTotal.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Customer Details & Shipping Method Cards Row */}
          <div className="sub-panels-row">
            {/* Customer Details */}
            <div className="detail-card-panel flex-1">
              <div className="panel-header-icon">
                <User size={18} />
                <h3>Customer Details</h3>
              </div>
              <div className="customer-info-block">
                <strong className="c-name">{customerName}</strong>
                <span className="c-email"><Mail size={14} /> {customerEmail}</span>
                <span className="c-phone"><Phone size={14} /> {customerPhone}</span>

                <div className="c-address-sec mt-16">
                  <span className="address-label">SHIPPING ADDRESS</span>
                  <p>{shippingAddress}</p>
                </div>
              </div>
            </div>

            {/* Shipping Method */}
            <div className="detail-card-panel flex-1">
              <div className="panel-header-icon">
                <Truck size={18} />
                <h3>Shipping & Logistics</h3>
              </div>
              <div className="shipping-info-block">
                <strong className="carrier-name">Express Dispatch</strong>
                <span className="carrier-sub">Tracked & Verified</span>

                <div className="ship-meta-sec mt-16">
                  <span className="address-label">TCS TRACKING ID (CN)</span>
                  <p className="bold-p">{tracking?.tcs_cn || order.tcs_cn || 'Not booked yet'}</p>
                </div>

                <div className="ship-meta-sec mt-12">
                  <span className="address-label">STATUS</span>
                  <p className="bold-p">{tracking?.tcs_status || order.tcs_status || order.status || 'Active Dispatch'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* TCS live tracking timeline */}
          <div className="detail-card-panel order-track-panel">
            <div className="panel-header-icon">
              <Truck size={18} />
              <h3>TCS Tracking</h3>
            </div>
            <TrackingTimeline
              tracking={tracking}
              loading={trackLoading}
              onRefresh={loadTracking}
              notShippedText="This order hasn't been booked with TCS yet — book it from the Shipments tab."
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="grid-right-column">
          {/* Payment Details Card */}
          <div className="detail-card-panel">
            <div className="panel-header-icon">
              <CreditCard size={18} />
              <h3>Payment Breakdown</h3>
            </div>

            <div className="financial-breakdown-lines">
              <div className="f-line">
                <span>Subtotal ({items.length} items)</span>
                <span>Rs. {totalAmount.toLocaleString()}</span>
              </div>
              <div className="f-line">
                <span>Delivery Charge</span>
                <span>Rs. 0.00</span>
              </div>
              <div className="f-line">
                <span>Tax</span>
                <span>Rs. 0.00</span>
              </div>

              <div className="f-divider"></div>

              <div className="f-line total-grand">
                <span>Grand Total</span>
                <span className="grand-val">Rs. {totalAmount.toLocaleString()}</span>
              </div>

              <div className="payment-method-badge-box">
                <CreditCard size={16} />
                <span>{paymentMethod}</span>
                <span
                  className="pay-status-chip"
                  style={{ background: payStatusColor + '1a', color: payStatusColor, borderColor: payStatusColor + '40' }}
                >
                  {paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

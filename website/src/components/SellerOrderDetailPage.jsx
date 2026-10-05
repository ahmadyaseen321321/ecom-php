import React from 'react';
import { useCart } from '../context/CartContext';
import {
  Printer,
  CheckCircle2,
  Package,
  User,
  Mail,
  Phone,
  Truck,
  CreditCard,
  Clock
} from 'lucide-react';
import './SellerOrderDetailPage.css';

export default function SellerOrderDetailPage({ order, onBack }) {
  const { showToast } = useCart();

  if (!order) return null;

  return (
    <div className="seller-order-detail-page animate-fade-in">
      {/* Top Breadcrumb & Action Bar */}
      <div className="detail-breadcrumb-bar">
        <div className="breadcrumb-links">
          <span className="b-link" onClick={onBack}>Orders</span>
          <span className="b-sep">&gt;</span>
          <span className="b-curr">{order.id || '#ORD-2023-0892'}</span>
        </div>

        <div className="detail-actions-right">
          <button className="btn-cancel-order" onClick={() => showToast('Cancellation initiated')}>
            Cancel Order
          </button>
          <button className="btn-outline-dark" onClick={() => showToast('Opening customer contact chat...')}>
            Contact Customer
          </button>
          <button className="btn-print-label" onClick={() => showToast('Printing shipping label...')}>
            <Printer size={16} />
            <span>Print Label</span>
          </button>
        </div>
      </div>

      {/* Order Title & Status Banner */}
      <div className="order-detail-title-banner">
        <div className="title-status-flex">
          <h1 className="order-main-h1">Order {order.id || '#ORD-2023-0892'}</h1>
          <span className="order-status-pill green">{order.status || 'Ready to Ship'}</span>
        </div>
        <p className="order-placed-time">{order.date || 'Oct 24, 2023 at 10:45 AM'}</p>
      </div>

      {/* 4 Summary KPI Bar Cards */}
      <div className="seller-order-kpis-grid">
        <div className="s-kpi-card">
          <span className="s-kpi-label">TOTAL AMOUNT</span>
          <div className="s-kpi-val">${order.total || '124.50'}</div>
        </div>
        <div className="s-kpi-card">
          <span className="s-kpi-label">ITEMS</span>
          <div className="s-kpi-val">2</div>
        </div>
        <div className="s-kpi-card">
          <span className="s-kpi-label">PAYMENT</span>
          <div className="s-kpi-val flex-check"><CheckCircle2 size={16} color="#16a34a" /> Paid</div>
        </div>
        <div className="s-kpi-card">
          <span className="s-kpi-label">FULFILLMENT</span>
          <div className="s-kpi-val flex-box"><Package size={16} color="#059669" /> Ready</div>
        </div>
      </div>

      {/* Main Grid: Left Column & Right Column */}
      <div className="seller-order-main-grid">
        {/* Left Column */}
        <div className="grid-left-column">
          {/* Items Ordered Table Card */}
          <div className="detail-card-panel">
            <h3 className="panel-title">Items Ordered</h3>
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
                <tr>
                  <td>
                    <div className="product-item-cell">
                      <img src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=200&auto=format&fit=crop&q=80" alt="" />
                      <div>
                        <strong>Ceramic Pour-Over Dripper</strong>
                        <span>Color: Forest Green</span>
                      </div>
                    </div>
                  </td>
                  <td className="sku-code">CM-POD-FG</td>
                  <td>1</td>
                  <td>$45.00</td>
                  <td className="text-right bold-txt">$45.00</td>
                </tr>
                <tr>
                  <td>
                    <div className="product-item-cell">
                      <img src="https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=200&auto=format&fit=crop&q=80" alt="" />
                      <div>
                        <strong>Organic Single Origin Beans</strong>
                        <span>Size: 12oz, Roast: Light</span>
                      </div>
                    </div>
                  </td>
                  <td className="sku-code">CB-SO-12-L</td>
                  <td>2</td>
                  <td>$24.00</td>
                  <td className="text-right bold-txt">$48.00</td>
                </tr>
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
                <strong className="c-name">{order.customer || 'Elena Jenkins'}</strong>
                <span className="c-email"><Mail size={14} /> elena.j@example.com</span>
                <span className="c-phone"><Phone size={14} /> +1 (555) 123-4567</span>

                <div className="c-address-sec mt-16">
                  <span className="address-label">SHIPPING ADDRESS</span>
                  <p>123 Grove Street<br />Apt 4B<br />Seattle, WA 98101<br />United States</p>
                </div>
              </div>
            </div>

            {/* Shipping Method */}
            <div className="detail-card-panel flex-1">
              <div className="panel-header-icon">
                <Truck size={18} />
                <h3>Shipping Method</h3>
              </div>
              <div className="shipping-info-block">
                <strong className="carrier-name">EcoExpress Priority</strong>
                <span className="carrier-sub">Carbon-neutral delivery</span>

                <div className="ship-meta-sec mt-16">
                  <span className="address-label">TRACKING NUMBER</span>
                  <p className="bold-p">Pending Generation</p>
                </div>

                <div className="ship-meta-sec mt-12">
                  <span className="address-label">ESTIMATED DELIVERY</span>
                  <p className="bold-p">Oct 28 - Oct 30, 2023</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="grid-right-column">
          {/* Payment Details Card */}
          <div className="detail-card-panel">
            <div className="panel-header-icon">
              <CreditCard size={18} />
              <h3>Payment Details</h3>
            </div>

            <div className="financial-breakdown-lines">
              <div className="f-line">
                <span>Subtotal (2 items)</span>
                <span>$93.00</span>
              </div>
              <div className="f-line">
                <span>Shipping Fee</span>
                <span>$20.00</span>
              </div>
              <div className="f-line">
                <span>Tax</span>
                <span>$11.50</span>
              </div>

              <div className="f-divider"></div>

              <div className="f-line total-grand">
                <span>Grand Total</span>
                <span className="grand-val">${order.total || '124.50'}</span>
              </div>

              <div className="payment-method-badge-box">
                <CreditCard size={18} color="#4b5563" />
                <div>
                  <strong>Paid via Credit Card</strong>
                  <span>Visa ending in •••• 4242</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Timeline Card */}
          <div className="detail-card-panel mt-20">
            <div className="panel-header-icon">
              <Clock size={18} />
              <h3>Order Timeline</h3>
            </div>

            <div className="order-vertical-timeline">
              <div className="timeline-item active">
                <div className="t-icon checked">✓</div>
                <div className="t-content">
                  <strong>Ready to Ship</strong>
                  <span>Waiting for carrier pickup</span>
                  <span className="t-time">Oct 24, 2:15 PM</span>
                </div>
              </div>

              <div className="timeline-item done">
                <div className="t-icon checked-light">✓</div>
                <div className="t-content">
                  <strong>Order Processed</strong>
                  <span className="t-time">Oct 24, 11:30 AM</span>
                </div>
              </div>

              <div className="timeline-item done">
                <div className="t-icon checked-light">✓</div>
                <div className="t-content">
                  <strong>Payment Confirmed</strong>
                  <span className="t-time">Oct 24, 10:46 AM</span>
                </div>
              </div>

              <div className="timeline-item done">
                <div className="t-icon dot-grey">●</div>
                <div className="t-content">
                  <strong>Order Placed</strong>
                  <span className="t-time">Oct 24, 10:45 AM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

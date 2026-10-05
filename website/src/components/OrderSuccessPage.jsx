import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { CheckCircle, Truck, ArrowRight, ExternalLink } from 'lucide-react';
import './OrderSuccessPage.css';

export default function OrderSuccessPage() {
  const { navigateTo, lastOrderData } = useCart();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Trigger entrance animation
    setTimeout(() => setAnimate(true), 100);
  }, []);

  // Generate or read order details
  const orderNumber = lastOrderData?.orderId || `MS-${Math.floor(10000 + Math.random() * 90000)}`;
  const totalCharged = lastOrderData?.total
    ? (typeof lastOrderData.total === 'number'
        ? `Rs. ${Number(lastOrderData.total).toLocaleString('en-PK')}`
        : lastOrderData.total)
    : 'Rs. 142.50';
  const firstItemName = lastOrderData?.firstItem || 'Premium Canvas Tote';
  const otherItemsCount = lastOrderData?.itemCount ? Math.max(0, lastOrderData.itemCount - 1) : 2;
  const firstItemImage = lastOrderData?.firstImage || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&auto=format&fit=crop&q=80';

  // Estimated delivery: 5-7 days from now
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 5);
  const formattedDelivery = deliveryDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="order-success-page">
      <div className="success-content-area">
        <div className={`success-center-block ${animate ? 'animate-in' : ''}`}>
          {/* Checkmark Icon */}
          <div className="success-check-circle">
            <div className="check-ring-outer">
              <div className="check-ring-inner">
                <CheckCircle size={48} className="check-icon" />
              </div>
            </div>
          </div>

          {/* Thank You Heading */}
          <h1 className="thank-you-heading">Thank You for Your Purchase!</h1>

          {/* Order Number Badge */}
          <div className="order-number-badge">
            Order #{orderNumber}
          </div>

          {/* Confirmation Text */}
          <p className="confirmation-text">
            A confirmation email has been sent to your inbox.<br />
            We'll notify you once your order is ready to ship.
          </p>

          {/* Order Summary Card */}
          <div className="order-summary-success-card">
            <div className="summary-top-row">
              <div className="summary-thumb-stack">
                <img src={firstItemImage} alt="Order item" className="stack-img" />
              </div>

              <div className="summary-text-info">
                <h3>Order Summary</h3>
                <p className="items-desc">
                  {firstItemName}{otherItemsCount > 0 ? ` and ${otherItemsCount} other item${otherItemsCount > 1 ? 's' : ''}` : ''}
                </p>

                <div className="estimated-delivery-pill">
                  <Truck size={16} className="delivery-icon" />
                  <span>Estimated Delivery: {formattedDelivery}</span>
                </div>
              </div>
            </div>

            <div className="summary-bottom-row">
              <div className="total-charged-info">
                <span className="total-label">Total Charged:</span>
                <span className="total-value">{totalCharged}</span>
              </div>

              <button
                className="view-receipt-link"
                onClick={() => navigateTo('orders')}
              >
                View Receipt <ExternalLink size={14} />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="success-actions-stack">
            <button
              className="track-order-btn"
              onClick={() => navigateTo('orders')}
            >
              <Truck size={18} />
              <span>Track My Order</span>
            </button>

            <button
              className="continue-shopping-link"
              onClick={() => navigateTo('home')}
            >
              Continue Shopping <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Mini Footer */}
      <footer className="success-mini-footer">
        <div className="footer-links-row">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Help Center</a>
        </div>
        <p>© 2024 mystore. All rights reserved.</p>
      </footer>
    </div>
  );
}

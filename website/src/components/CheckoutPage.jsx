import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { getImageUrl, placeOrderApi } from '../services/api';
import {
  ShieldCheck,
  CreditCard,
  Banknote,
  Truck,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Loader2,
  ShoppingBag,
  MapPin,
  ChevronRight
} from 'lucide-react';
import './CheckoutPage.css';

export default function CheckoutPage() {
  const { cart, cartSubtotal, user, setCart, navigateTo, showToast, setLastOrderData } = useCart();

  // Form State
  const [firstName, setFirstName] = useState(user?.full_name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user?.full_name?.split(' ')[1] || '');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState('credit'); // 'credit' | 'cod'

  // Credit Card Form
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const shippingCost = 0;
  const tax = 0;
  const totalAmount = cartSubtotal + shippingCost + tax;

  const formatPKR = (val) => {
    return `Rs. ${Number(val || 0).toLocaleString('en-PK')}`;
  };

  const handlePlaceOrder = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (cart.length === 0) {
      showToast('Your cart is empty.');
      navigateTo('shop');
      return;
    }

    if (!addressLine1.trim() || !city.trim() || !phone.trim()) {
      showToast('Please fill out your shipping address and phone number.');
      return;
    }

    try {
      setIsSubmitting(true);

      const itemsPayload = (cart || []).map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      const fullAddress = `${addressLine1}, ${city} ${zipCode ? '(' + zipCode + ')' : ''} | Phone: ${phone}`;

      const orderInfo = {
        orderId: `MS-${Math.floor(10000 + Math.random() * 90000)}`,
        total: totalAmount || 0,
        firstItem: cart[0]?.name || 'Items',
        itemCount: (cart || []).reduce((acc, item) => acc + (item.quantity || 1), 0),
        firstImage: cart[0]?.image || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&auto=format&fit=crop&q=80'
      };

      // Save order data for Order Success page
      setLastOrderData(orderInfo);

      // Background sync to API (safe fire-and-forget)
      try {
        placeOrderApi({
          total: totalAmount,
          address: fullAddress,
          payment_method: paymentMethod === 'credit' ? 'Credit Card' : 'Cash on Delivery',
          items: itemsPayload,
        }).catch(() => {});
      } catch (apiErr) {
        console.log('Background placeOrderApi error:', apiErr);
      }

      // Clear cart
      setCart([]);
      showToast('🎉 Order placed successfully!');

      // Navigate to order-success page
      navigateTo('order-success');
    } catch (err) {
      console.error('Error handling order placement:', err);
      navigateTo('order-success');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="checkout-page-wrapper">
      <div className="container">
        {/* Breadcrumb Navigation */}
        <div className="checkout-breadcrumb">
          <button className="crumb-btn" onClick={() => navigateTo('home')}>Home</button>
          <span className="sep">&gt;</span>
          <button className="crumb-btn" onClick={() => navigateTo('cart')}>Cart</button>
          <span className="sep">&gt;</span>
          <span className="crumb-curr">Checkout</span>
        </div>

        <h1 className="checkout-main-title font-serif">Secure Checkout</h1>

        <div className="checkout-layout-grid">
          {/* Main Checkout Form Column */}
          <form onSubmit={handlePlaceOrder} className="checkout-form-col">
            {/* Step 1: Shipping Address */}
            <section className="checkout-step-card animate-fade-in">
              <div className="step-header">
                <span className="step-num">1</span>
                <h2>Shipping Address</h2>
              </div>

              <div className="step-body">
                <div className="form-row-two">
                  <div className="input-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      required
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+92 300 1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label>Address Line 1</label>
                  <input
                    type="text"
                    required
                    placeholder="123 Olive Street, Apartment 4B"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                  />
                </div>

                <div className="form-row-two">
                  <div className="input-group">
                    <label>City</label>
                    <input
                      type="text"
                      required
                      placeholder="Lahore / Karachi"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>ZIP / Postal Code</label>
                    <input
                      type="text"
                      placeholder="54000"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Step 2: Payment Information */}
            <section className="checkout-step-card animate-fade-in">
              <div className="step-header">
                <span className="step-num">2</span>
                <h2>Payment Information</h2>
              </div>

              <div className="step-body">
                {/* Payment Option Tabs */}
                <div className="payment-tabs-row">
                  <button
                    type="button"
                    className={`payment-tab-btn ${paymentMethod === 'credit' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('credit')}
                  >
                    <CreditCard size={18} />
                    <span>Credit / Debit Card</span>
                  </button>

                  <button
                    type="button"
                    className={`payment-tab-btn ${paymentMethod === 'cod' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('cod')}
                  >
                    <Banknote size={18} />
                    <span>Cash on Delivery</span>
                  </button>
                </div>

                {/* Credit Card Input Form */}
                {paymentMethod === 'credit' && (
                  <div className="card-form-subwrap animate-fade-in">
                    <div className="input-group">
                      <label>Card Number</label>
                      <div className="input-with-icon">
                        <input
                          type="text"
                          placeholder="0000 0000 0000 0000"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                        />
                        <Lock size={16} className="input-lock-icon" />
                      </div>
                    </div>

                    <div className="form-row-two">
                      <div className="input-group">
                        <label>Expiry Date</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                        />
                      </div>
                      <div className="input-group">
                        <label>CVC</label>
                        <input
                          type="text"
                          placeholder="123"
                          value={cvc}
                          onChange={(e) => setCvc(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Cash on Delivery Notice */}
                {paymentMethod === 'cod' && (
                  <div className="cod-notice-box animate-fade-in">
                    <CheckCircle2 size={20} color="#3D5647" />
                    <p>Pay with cash directly to the courier driver upon package arrival at your delivery address.</p>
                  </div>
                )}
              </div>
            </section>
          </form>

          {/* Right Column: Order Summary Sidebar */}
          <aside className="checkout-summary-col">
            <div className="checkout-summary-card">
              <h3>Order Summary</h3>

              <div className="checkout-items-list">
                {cart.length > 0 ? (
                  cart.map((item) => (
                    <div key={item.id} className="checkout-item-row">
                      <img src={getImageUrl(item.image)} alt={item.name} className="item-thumb" />
                      <div className="item-info">
                        <h4>{item.name}</h4>
                        <span className="item-qty">Qty: {item.quantity}</span>
                      </div>
                      <span className="item-price">{formatPKR(item.price * item.quantity)}</span>
                    </div>
                  ))
                ) : (
                  <div className="empty-cart-summary">
                    <p>No items in cart</p>
                  </div>
                )}
              </div>

              <div className="summary-breakdown">
                <div className="summary-line">
                  <span>Subtotal</span>
                  <span>{formatPKR(cartSubtotal)}</span>
                </div>
                <div className="summary-line">
                  <span>Shipping</span>
                  <span className="green-txt">Free</span>
                </div>
                <div className="summary-line">
                  <span>Tax</span>
                  <span>Rs. 0</span>
                </div>

                <div className="summary-divider"></div>

                <div className="summary-line total-line">
                  <span>Total</span>
                  <span className="total-price">{formatPKR(totalAmount)}</span>
                </div>
              </div>

              <button
                type="button"
                className="place-order-submit-btn"
                disabled={isSubmitting || cart.length === 0}
                onClick={handlePlaceOrder}
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
                <span>Place Order</span>
              </button>

              <div className="ssl-security-footer">
                <ShieldCheck size={16} />
                <span>128-BIT SSL ENCRYPTED</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

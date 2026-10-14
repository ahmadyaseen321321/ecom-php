import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import {
  getImageUrl,
  placeOrderApi,
  fetchPaymentModeApi,
  createPaymentSessionApi,
  confirmPaymentApi
} from '../services/api';
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
  const { cart, cartSubtotal, user, clearCart, navigateTo, showToast, setLastOrderData } = useCart();

  // Form State
  const [firstName, setFirstName] = useState(user?.full_name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user?.full_name?.split(' ')[1] || '');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' | 'cod'
  const [paymentMode, setPaymentMode] = useState('demo');     // 'demo' | 'live'

  // Card Form (used for the in-app demo checkout; live mode hands off to Stripe)
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Which gateway mode are we in? Drives whether card entry is local (demo)
  // or handed off to Stripe's hosted page (live).
  useEffect(() => {
    let mounted = true;
    fetchPaymentModeApi()
      .then((res) => {
        if (mounted && res && res.mode) setPaymentMode(res.mode);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const shippingCost = 0;
  const tax = 0;
  const totalAmount = cartSubtotal + shippingCost + tax;

  const formatPKR = (val) => {
    return `Rs. ${Number(val || 0).toLocaleString('en-PK')}`;
  };

  // Keep the card number readable (groups of 4) without changing the value length.
  const handleCardNumberChange = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    setCardNumber(digits.replace(/(.{4})/g, '$1 ').trim());
  };

  const handlePlaceOrder = async (e) => {
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

    const itemsPayload = (cart || []).map((item) => ({
      product_id: item.id,
      quantity: item.quantity,
      price: item.price,
    }));

    const fullAddress = `${addressLine1}, ${city} ${zipCode ? '(' + zipCode + ')' : ''} | Phone: ${phone}`;

    try {
      setIsSubmitting(true);

      // ── Cash on Delivery: save the order straight away ──────────────
      if (paymentMethod === 'cod') {
        let savedOrder = null;
        try {
          savedOrder = await placeOrderApi({
            total: totalAmount,
            address: fullAddress,
            payment_method: 'Cash on Delivery',
            payment_status: 'pending',
            items: itemsPayload,
          });
        } catch (apiErr) {
          console.log('placeOrderApi response:', apiErr);
        }

        const codOrderId = savedOrder?.order_id;
        if (!codOrderId) {
          showToast('Could not place your order. Please check your connection and try again.');
          return;
        }

        setLastOrderData({
          orderId: `${codOrderId}`,
          total: totalAmount || 0,
          firstItem: cart[0]?.name || 'Items',
          itemCount: (cart || []).reduce((acc, item) => acc + (item.quantity || 1), 0),
          firstImage: cart[0]?.image || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&auto=format&fit=crop&q=80'
        });
        clearCart();
        showToast('🎉 Order placed successfully! Pay on delivery.');
        navigateTo('order-success');
        return;
      }

      // ── Card (Stripe): create order + a Checkout Session ────────────
      const session = await createPaymentSessionApi({
        address: fullAddress,
        payment_method: 'Card (Stripe)',
        origin: window.location.origin,
        items: itemsPayload,
      });

      if (!session || !session.order_id) {
        showToast('Could not start the payment. Please try again.');
        return;
      }

      // LIVE mode → hand the buyer to Stripe's hosted checkout page.
      if (session.mode === 'live' && session.url) {
        showToast('Redirecting to secure payment…');
        window.location.href = session.url;
        return;
      }

      // DEMO mode → confirm the payment in-app using the card entered below.
      if (!cardNumber || cardNumber.replace(/\s/g, '').length < 12) {
        showToast('Enter a test card number (4242 4242 4242 4242) to simulate payment.');
        setIsSubmitting(false);
        return;
      }

      const result = await confirmPaymentApi({
        order_id: session.order_id,
        session_id: session.session_id,
        card_number: cardNumber,
      });

      if (!result || !result.paid) {
        showToast('Payment failed. Your card was declined — try 4242 4242 4242 4242.');
        setIsSubmitting(false);
        return;
      }

      setLastOrderData({
        orderId: `${session.order_id}`,
        total: session.total || totalAmount || 0,
        firstItem: cart[0]?.name || 'Items',
        itemCount: (cart || []).reduce((acc, item) => acc + (item.quantity || 1), 0),
        firstImage: cart[0]?.image || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&auto=format&fit=crop&q=80'
      });
      clearCart();
      showToast('💳 Payment successful! Order confirmed.');
      navigateTo('order-success');
    } catch (err) {
      console.error('Error handling order placement:', err);
      showToast('Could not place your order. Please try again.');
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
                    className={`payment-tab-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <CreditCard size={18} />
                    <span>Card (Stripe)</span>
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

                {/* Card (Stripe) */}
                {paymentMethod === 'card' && (
                  <div className="card-form-subwrap animate-fade-in">
                    {paymentMode === 'live' ? (
                      // Live mode: Stripe's hosted page collects the card.
                      <div className="cod-notice-box">
                        <Lock size={20} color="#3D5647" />
                        <p>You'll be redirected to Stripe's secure checkout to complete your payment.</p>
                      </div>
                    ) : (
                      <>
                        <div className="stripe-demo-banner">
                          <ShieldCheck size={16} />
                          <span>
                            Test mode — use <strong>4242 4242 4242 4242</strong> to pay, or{' '}
                            <strong>4000 0000 0000 0002</strong> to see a decline.
                          </span>
                        </div>

                        <div className="input-group">
                          <label>Card Number</label>
                          <div className="input-with-icon">
                            <input
                              type="text"
                              placeholder="4242 4242 4242 4242"
                              value={cardNumber}
                              onChange={(e) => handleCardNumberChange(e.target.value)}
                              inputMode="numeric"
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
                      </>
                    )}
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

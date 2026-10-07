import React, { useState, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Banknote,
  Building,
  Lock,
  LogIn,
  UserPlus
} from 'lucide-react';
import { getImageUrl } from '../services/api';
import './CartPage.css';

export default function CartPage() {
  const {
    cart,
    user,
    updateQuantity,
    removeFromCart,
    cartSubtotal,
    navigateTo,
    showToast,
    openLoginModal,
    openSignupModal,
    setIsLoginRequiredOpen
  } = useCart();

  const [promoCode, setPromoCode] = useState('');

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (promoCode.trim()) {
      showToast('Promo code applied successfully!');
    }
  };

  const handleProceedCheckout = () => {
    if (!user) {
      setIsLoginRequiredOpen(true);
      return;
    }
    navigateTo('checkout');
  };

  return (
    <div className="cart-page-wrapper">
      <div className="container">
        {/* Breadcrumb Navigation */}
        <div className="cart-breadcrumb-bar">
          <button onClick={() => navigateTo('home')}>Home</button>
          <span className="sep">›</span>
          <span className="current">Shopping Cart</span>
        </div>

        <h1 className="cart-main-heading">Your Cart</h1>

        {/* Unauthenticated User Banner */}
        {!user && (
          <div 
            className="animate-fade-in"
            style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
              border: '1.5px solid #86efac',
              borderRadius: '16px',
              padding: '18px 24px',
              marginBottom: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#2d5a27', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Lock size={20} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: '#14532d' }}>
                  Log in to buy a product
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#166534' }}>
                  Please sign in or create an account to save items and proceed to checkout.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={openLoginModal}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#2d5a27',
                  color: '#fff',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <LogIn size={15} /> Log In
              </button>
              <button
                onClick={openSignupModal}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  border: '1.5px solid #2d5a27',
                  background: '#fff',
                  color: '#2d5a27',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <UserPlus size={15} /> Sign Up
              </button>
            </div>
          </div>
        )}

        {cart.length === 0 ? (
          <div className="empty-cart-card">
            <ShoppingBag size={56} className="empty-bag-icon" />
            <h2>Your cart is empty</h2>
            <p>
              {!user
                ? 'Log in to view your items or explore our catalog to add products.'
                : "Looks like you haven't added any items to your cart yet."}
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px', flexWrap: 'wrap' }}>
              {!user && (
                <>
                  <button className="continue-shop-green-btn" onClick={openLoginModal}>
                    <LogIn size={18} />
                    <span>Log In</span>
                  </button>
                  <button className="continue-shop-green-btn" onClick={openSignupModal} style={{ background: '#fff', color: '#2d5a27', border: '1.5px solid #2d5a27' }}>
                    <UserPlus size={18} />
                    <span>Sign Up</span>
                  </button>
                </>
              )}
              <button className="continue-shop-green-btn" onClick={() => navigateTo('shop')}>
                <ArrowLeft size={18} />
                <span>Explore Shop</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="cart-grid-layout">
            {/* Left Products Table */}
            <div className="cart-table-container">
              <div className="cart-header-row">
                <span className="col-product">PRODUCT</span>
                <span className="col-quantity">QUANTITY</span>
                <span className="col-price">PRICE</span>
                <span className="col-total">TOTAL</span>
                <span className="col-action"></span>
              </div>

              <div className="cart-items-stack">
                {cart.map((item) => (
                  <div key={item.id} className="cart-product-row">
                    <div className="product-info-cell">
                      <div className="product-thumb-container">
                        <img src={getImageUrl(item.image)} alt={item.name} />
                      </div>
                      <div className="product-title-specs">
                        <h4>{item.name}</h4>
                        <span className="variant-label">{item.variant || item.category || 'Standard'}</span>
                      </div>
                    </div>

                    <div className="quantity-control-cell">
                      <div className="qty-stepper">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="stepper-btn"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="stepper-val">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="stepper-btn"
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="unit-price-cell">
                      ${Number(item.price).toFixed(2)}
                    </div>

                    <div className="total-price-cell">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>

                    <div className="action-delete-cell">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="delete-item-btn"
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-table-footer">
                <button
                  className="back-to-shop-link"
                  onClick={() => navigateTo('shop')}
                >
                  <ArrowLeft size={16} />
                  <span>Continue Shopping</span>
                </button>
              </div>
            </div>

            {/* Right Order Summary Card */}
            <div className="cart-summary-container">
              <div className="order-summary-card">
                <h3 className="summary-title">Order Summary</h3>

                {/* Promo Code Input */}
                <form className="promo-input-group" onSubmit={handleApplyPromo}>
                  <label>APPLY COUPON</label>
                  <div className="input-with-button">
                    <input
                      type="text"
                      placeholder="Promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                    />
                    <button type="submit" className="apply-promo-btn">
                      Apply
                    </button>
                  </div>
                </form>

                {/* Line Items */}
                <div className="summary-lines-stack">
                  <div className="summary-line">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="summary-line">
                    <span>Shipping</span>
                    <span className="muted-italic">Calculated at next step</span>
                  </div>
                  <div className="summary-line">
                    <span>Estimated Tax</span>
                    <span>$0.00</span>
                  </div>
                </div>

                <div className="summary-divider-line"></div>

                {/* Total */}
                <div className="summary-grand-total">
                  <span>Total</span>
                  <span className="grand-amount">${subtotal.toFixed(2)}</span>
                </div>

                {/* Checkout CTA */}
                <button
                  className="proceed-checkout-btn"
                  onClick={handleProceedCheckout}
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={18} />
                </button>

                <div className="checkout-trust-badge">
                  <span>SECURE CHECKOUT POWERED BY NOVANEST</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './CartDrawer.css';

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
    showToast,
    navigateTo,
  } = useCart();

  if (!isCartOpen) return null;

  const FREE_SHIPPING_THRESHOLD = 100;
  const progressPercent = Math.min((cartSubtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD - cartSubtotal;

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigateTo('checkout');
  };

  return (
    <div className="cart-overlay">
      <div className="cart-backdrop" onClick={() => setIsCartOpen(false)} />
      
      <div className="cart-drawer">
        {/* Drawer Header */}
        <div className="cart-drawer-header">
          <div className="cart-header-title">
            <ShoppingBag size={20} className="header-bag-icon" />
            <h3>Your Shopping Cart</h3>
            <span className="cart-item-badge">{cart.length}</span>
          </div>
          <button className="close-drawer-btn" onClick={() => setIsCartOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Free Shipping Progress Bar */}
        <div className="free-shipping-box">
          <p className="shipping-text">
            {remainingForFreeShipping > 0 ? (
              <>Add <strong>${remainingForFreeShipping.toFixed(2)}</strong> more to get <strong>FREE Shipping!</strong></>
            ) : (
              <>🎉 You have qualified for <strong>FREE Shipping!</strong></>
            )}
          </p>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Cart Item List */}
        <div className="cart-items-wrap">
          {cart.length > 0 ? (
            cart.map((item) => (
              <div key={item.id} className="cart-item-card">
                <img src={item.image} alt={item.name} className="cart-item-img" />
                
                <div className="cart-item-details">
                  <span className="item-category">{item.category}</span>
                  <h4 className="item-name">{item.name}</h4>
                  <span className="item-price">${item.price.toFixed(2)}</span>

                  <div className="cart-item-actions">
                    <div className="quantity-counter">
                      <button onClick={() => updateQuantity(item.id, -1)} aria-label="Decrease">
                        <Minus size={14} />
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} aria-label="Increase">
                        <Plus size={14} />
                      </button>
                    </div>

                    <button
                      className="remove-item-btn"
                      onClick={() => removeFromCart(item.id)}
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-cart">
              <ShoppingBag size={48} className="empty-bag" />
              <p className="empty-title">Your cart is currently empty</p>
              <p className="empty-subtitle">Explore our collections to add sustainable luxury items.</p>
              <button
                className="btn btn-forest"
                onClick={() => setIsCartOpen(false)}
              >
                Start Shopping
              </button>
            </div>
          )}
        </div>

        {/* Footer Subtotal & Checkout */}
        {cart.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="summary-row">
              <span>Subtotal</span>
              <span className="subtotal-amount">${cartSubtotal.toFixed(2)}</span>
            </div>
            <p className="taxes-note">Taxes and shipping calculated at checkout.</p>

            <button className="btn btn-forest checkout-btn" onClick={handleCheckout}>
              PROCEED TO CHECKOUT <ArrowRight size={18} />
            </button>

            <div className="secure-badge">
              <ShieldCheck size={14} />
              <span>256-Bit SSL Encrypted Checkout</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

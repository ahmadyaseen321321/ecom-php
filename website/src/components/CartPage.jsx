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
  Building
} from 'lucide-react';
import './CartPage.css';

const DEMO_CART_ITEMS = [
  {
    id: 'c1',
    name: 'Artisan Sourdough Loaf',
    variant: 'Freshly Baked • 500g',
    price: 8.50,
    quantity: 2,
    image: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'c2',
    name: 'Chocolate Fudge Cake',
    variant: 'Double Layer • Slice',
    price: 12.00,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'c3',
    name: 'Glazed Donut Box',
    variant: 'Set of 4 • Assorted',
    price: 15.00,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&auto=format&fit=crop&q=80'
  }
];

export default function CartPage() {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    cartSubtotal,
    navigateTo,
    showToast
  } = useCart();

  const [promoCode, setPromoCode] = useState('');
  const [demoCart, setDemoCart] = useState(DEMO_CART_ITEMS);

  // Use active cart if populated, or demo fallback items matching checkout.png design mockup
  const displayCart = useMemo(() => {
    if (cart.length > 0) return cart;
    return demoCart;
  }, [cart, demoCart]);

  const handleUpdateQty = (itemId, delta) => {
    if (cart.length > 0) {
      updateQuantity(itemId, delta);
    } else {
      setDemoCart((prev) =>
        prev
          .map((item) => {
            if (item.id === itemId) {
              const newQty = item.quantity + delta;
              return newQty > 0 ? { ...item, quantity: newQty } : null;
            }
            return item;
          })
          .filter(Boolean)
      );
    }
  };

  const handleRemove = (itemId) => {
    if (cart.length > 0) {
      removeFromCart(itemId);
    } else {
      setDemoCart((prev) => prev.filter((item) => item.id !== itemId));
      showToast('Item removed from cart');
    }
  };

  const subtotal = useMemo(() => {
    return displayCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [displayCart]);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (promoCode.trim()) {
      showToast('Promo code applied successfully!');
    }
  };

  const handleProceedCheckout = () => {
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

        {displayCart.length === 0 ? (
          <div className="empty-cart-card">
            <ShoppingBag size={56} className="empty-bag-icon" />
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added any items to your cart yet.</p>
            <button className="continue-shop-green-btn" onClick={() => navigateTo('shop')}>
              <ArrowLeft size={18} />
              <span>Explore Shop</span>
            </button>
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
                {displayCart.map((item) => (
                  <div key={item.id} className="cart-product-row">
                    <div className="col-product product-meta-box">
                      <img src={item.image} alt={item.name} className="product-thumb-img" />
                      <div>
                        <h3 className="product-item-title">{item.name}</h3>
                        <p className="product-variant-text">{item.variant || item.category || 'Standard'}</p>
                      </div>
                    </div>

                    <div className="col-quantity">
                      <div className="qty-selector-pill">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, -1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="qty-val">{item.quantity}</span>
                        <button type="button" onClick={() => handleUpdateQty(item.id, 1)}>
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="col-price">
                      <span className="price-text">${Number(item.price).toFixed(2)}</span>
                    </div>

                    <div className="col-total">
                      <span className="total-price-text">${(Number(item.price) * item.quantity).toFixed(2)}</span>
                    </div>

                    <div className="col-action">
                      <button
                        type="button"
                        className="delete-item-btn"
                        onClick={() => handleRemove(item.id)}
                        title="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button className="back-continue-shop-link" onClick={() => navigateTo('shop')}>
                <ArrowLeft size={16} />
                <span>Continue Shopping</span>
              </button>
            </div>

            {/* Right Summary Sidebar */}
            <aside className="cart-summary-sidebar">
              <div className="summary-card-box">
                <h2>Order Summary</h2>

                <div className="coupon-apply-section">
                  <label>APPLY COUPON</label>
                  <form className="coupon-input-group" onSubmit={handleApplyPromo}>
                    <input
                      type="text"
                      placeholder="Promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                    />
                    <button type="submit" className="apply-coupon-btn">
                      Apply
                    </button>
                  </form>
                </div>

                <div className="summary-calc-rows">
                  <div className="calc-row">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="calc-row">
                    <span>Shipping</span>
                    <span className="shipping-calc-note">Calculated at next step</span>
                  </div>
                  <div className="calc-row">
                    <span>Estimated Tax</span>
                    <span>$0.00</span>
                  </div>
                </div>

                <div className="summary-total-bar">
                  <span>Total</span>
                  <span className="grand-total-val">${subtotal.toFixed(2)}</span>
                </div>

                <button className="proceed-to-checkout-btn" onClick={handleProceedCheckout}>
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={18} />
                </button>

                <div className="secure-tag-row">
                  <span>SECURE CHECKOUT POWERED BY MYSTORE</span>
                </div>

                <div className="payment-icons-flex">
                  <CreditCard size={22} />
                  <Banknote size={22} />
                  <Building size={22} />
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="cart-page-footer">
        <div className="container">
          <div className="footer-content-flex">
            <div className="brand-copy-info">
              <h3>mystore</h3>
              <p>Providing high-quality artisan goods delivered directly to your door. Experience the taste of premium quality with every order.</p>
            </div>

            <div className="footer-links-group">
              <div>
                <h4>Support</h4>
                <a href="#">Help Center</a>
                <a href="#">Shipping Policy</a>
                <a href="#">Returns</a>
              </div>
              <div>
                <h4>Company</h4>
                <a href="#">About Us</a>
                <a href="#">Careers</a>
                <a href="#">Sustainability</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <span>© 2024 mystore eCommerce. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

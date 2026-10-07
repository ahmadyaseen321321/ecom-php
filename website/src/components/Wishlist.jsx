import React, { useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { ShoppingBag, X, ArrowRight, Heart } from 'lucide-react';
import './Wishlist.css';

export default function Wishlist() {
  const { user, openLoginModal, openSignupModal, wishlist, liveProducts, toggleWishlist, addToCart, navigateTo, showToast } = useCart();

  const wishlistItems = useMemo(() => {
    return liveProducts.filter((product) =>
      wishlist.includes(String(product.id)) || wishlist.includes(product.id)
    );
  }, [liveProducts, wishlist]);

  const handleRemove = (itemId) => {
    toggleWishlist(itemId);
    showToast('Item removed from Wishlist');
  };

  const moveAllToCart = () => {
    if (wishlistItems.length === 0) return;

    wishlistItems.forEach((item) => {
      addToCart(item);
    });

    showToast(`Moved ${wishlistItems.length} items to cart`);
  };

  if (!user) {
    return (
      <div className="wishlist-page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 160px)', padding: '40px 20px' }}>
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
            <Heart size={32} />
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', margin: '0 0 10px' }}>
            Log in to view your Wishlist
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#6b7280', margin: '0 0 32px', lineHeight: 1.5 }}>
            Sign in to access your saved favorites, track price drops, and manage your personal collection.
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
              <Heart size={16} />
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

  return (
    <div className="wishlist-page-wrapper">
      <div className="container">
        {/* Page Header Bar */}
        <div className="wishlist-header-row">
          <div className="header-title-block">
            <h1 className="page-heading">My Wishlist</h1>
            <p className="items-count-text">
              You have {wishlistItems.length} {wishlistItems.length === 1 ? 'premium item' : 'premium items'} saved for later
            </p>
          </div>

          {wishlistItems.length > 0 && (
            <button className="move-all-cart-btn" onClick={moveAllToCart}>
              <ShoppingBag size={18} />
              <span>Move All to Cart</span>
            </button>
          )}
        </div>

        {/* Wishlist Cards Grid */}
        {wishlistItems.length === 0 ? (
          <div className="empty-wishlist-box">
            <h2>Your wishlist is empty</h2>
            <p>Explore our collections and save your favorite items for later.</p>
            <button className="continue-shop-btn" onClick={() => navigateTo('shop')}>
              Explore Shop <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <>
            <div className="wishlist-cards-grid">
              {wishlistItems.map((item) => (
                <div key={item.id} className="wishlist-item-card">
                  {/* Image container box */}
                  <div className="card-image-box">
                    <img
                      src={item.image}
                      alt={item.name}
                      onClick={() => navigateTo('product-details', item)}
                    />
                    <button
                      className="card-remove-btn"
                      onClick={() => handleRemove(item.id)}
                      title="Remove"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Card Content */}
                  <div className="card-content-box">
                    <h3
                      className="product-name-title"
                      onClick={() => navigateTo('product-details', item)}
                    >
                      {item.name}
                    </h3>
                    <span className="product-price-val">${Number(item.price).toFixed(2)}</span>

                    <button
                      className="add-to-cart-green-pill"
                      onClick={() => addToCart(item)}
                    >
                      <ShoppingBag size={16} />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Progress Counter */}
            <div className="wishlist-bottom-counter">
              <span>Showing {wishlistItems.length} of {wishlistItems.length} items</span>
              <div className="counter-green-indicator"></div>
            </div>
          </>
        )}
      </div>

      {/* Footer matching wishlist design mockup */}
      <footer className="wishlist-page-footer">
        <div className="container">
          <div className="footer-cols-grid">
            <div className="footer-brand-col">
              <h3>mystore</h3>
              <p>Curated minimalist essentials for the modern lifestyle. Quality and sustainability at our core.</p>
            </div>

            <div className="footer-links-col">
              <h4>Shop</h4>
              <a href="#">All Products</a>
              <a href="#">New Arrivals</a>
              <a href="#">Best Sellers</a>
              <a href="#">Sale</a>
            </div>

            <div className="footer-links-col">
              <h4>Support</h4>
              <a href="#">Contact Us</a>
              <a href="#">Shipping Info</a>
              <a href="#">Returns & Exchanges</a>
              <a href="#">FAQs</a>
            </div>

            <div className="footer-links-col">
              <h4>Connect</h4>
              <p className="newsletter-sub-text">Join our newsletter for exclusive updates.</p>
            </div>
          </div>

          <div className="footer-bottom-copy">
            <span>© 2024 mystore. All rights reserved.</span>
            <div className="legal-links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

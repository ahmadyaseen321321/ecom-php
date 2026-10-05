import React, { useMemo, useState } from 'react';
import { useCart } from '../context/CartContext';
import { ShoppingBag, X, ArrowRight } from 'lucide-react';
import './Wishlist.css';

const MOCK_WISHLIST_DEMO = [
  {
    id: 'w1',
    name: 'Linen Blend Jacket',
    price: 145.00,
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'w2',
    name: 'Minimalist Timepiece',
    price: 210.00,
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'w3',
    name: 'Leather Travel Bag',
    price: 185.00,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'w4',
    name: 'Essential Cotton Tee',
    price: 35.00,
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'w5',
    name: 'City Walk Sneakers',
    price: 120.00,
    image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&auto=format&fit=crop&q=80'
  }
];

export default function Wishlist() {
  const { wishlist, liveProducts, toggleWishlist, addToCart, navigateTo, showToast } = useCart();

  // Combine live saved wishlist items with mock demo items for full design representation
  const [removedDemoIds, setRemovedDemoIds] = useState([]);

  const wishlistItems = useMemo(() => {
    const liveItems = liveProducts.filter((product) =>
      wishlist.includes(String(product.id)) || wishlist.includes(product.id)
    );
    if (liveItems.length > 0) return liveItems;

    return MOCK_WISHLIST_DEMO.filter((item) => !removedDemoIds.includes(item.id));
  }, [liveProducts, wishlist, removedDemoIds]);

  const handleRemove = (itemId) => {
    if (wishlist.length > 0) {
      toggleWishlist(itemId);
    } else {
      setRemovedDemoIds((prev) => [...prev, itemId]);
      showToast('Item removed from Wishlist');
    }
  };

  const moveAllToCart = () => {
    if (wishlistItems.length === 0) return;

    wishlistItems.forEach((item) => {
      addToCart(item);
    });

    showToast(`Moved ${wishlistItems.length} items to cart`);
  };

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

import React, { useState } from 'react';
import { JUST_LANDED_PRODUCTS as MOCK_PRODUCTS } from '../data/mockProducts';
import { useCart } from '../context/CartContext';
import { Heart, ShoppingBag, Eye, ArrowRight } from 'lucide-react';
import './JustLanded.css';

export default function JustLanded() {
  const { liveProducts, addToCart, wishlist, toggleWishlist, setQuickViewProduct, navigateTo } = useCart();
  const [visibleProductCount, setVisibleProductCount] = useState(10);

  const products = liveProducts && liveProducts.length > 0
    ? liveProducts
    : MOCK_PRODUCTS;
  const displayProducts = products.slice(0, visibleProductCount);

  const handleNavigate = (product) => {
    navigateTo('product-details', product);
  };

  return (
    <section id="just-landed" className="just-landed-section">
      <div className="container">
        {/* Header with Navigation Controls */}
        <div className="just-landed-header">
          <div>
            <h2 className="just-landed-title font-serif">Just Landed</h2>
            <p className="just-landed-subtitle">
              The latest arrivals tailored for everyday living.
            </p>
          </div>

        </div>

        <div className="landed-grid">
          {displayProducts.map((product) => {
            const isWishlisted = wishlist.some((id) => String(id) === String(product.id));
            return (
            <div key={product.id} className="landed-card" onClick={() => handleNavigate(product)}>
              <div className="landed-image-wrap">
                <img src={product.image} alt={product.name} className="landed-img" />
                <div className="landed-floating-actions">
                  <button
                    className={`landed-action-circle ${isWishlisted ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(product.id);
                    }}
                    title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    className="landed-action-circle"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuickViewProduct(product);
                    }}
                    title="Quick View"
                    aria-label={`Quick view ${product.name}`}
                  >
                    <Eye size={16} />
                  </button>
                </div>
                <button
                  className="landed-add-to-cart-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product);
                  }}
                  title="Add to Cart"
                >
                  <ShoppingBag size={16} /> Add to Cart
                </button>
              </div>

              <div className="landed-info">
                <span className="landed-category">{product.category}</span>
                <h3 className="landed-name">{product.name}</h3>
                <div className="landed-footer">
                  <span className="landed-price">Rs. {Number(product.price).toLocaleString()}</span>
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {/* CTA Button */}
        {displayProducts.length < products.length && (
          <div className="center-cta-wrap">
            <button
              type="button"
              className="btn btn-forest"
              onClick={() => setVisibleProductCount((count) => count + 10)}
            >
              VIEW MORE <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

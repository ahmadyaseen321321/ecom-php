import React from 'react';
import { SEASONAL_ARCHIVE_PRODUCTS as MOCK_PRODUCTS } from '../data/mockProducts';
import { useCart } from '../context/CartContext';
import { Heart, Eye, ShoppingBag, ArrowRight } from 'lucide-react';
import './SeasonalArchive.css';

export default function SeasonalArchive() {
  const { liveProducts, addToCart, wishlist, toggleWishlist, setQuickViewProduct, navigateTo } = useCart();

  // Use top 4 live products or fallback to mock products
  const displayProducts = liveProducts && liveProducts.length > 0
    ? liveProducts.slice(0, 4)
    : MOCK_PRODUCTS;

  const handleNavigate = (product) => {
    navigateTo('product-details', product);
  };

  return (
    <section id="seasonal-archive" className="seasonal-archive-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div>
            <span className="section-tag">CURATED COLLECTION</span>
            <h2 className="section-title font-serif">The Seasonal Archive</h2>
            <p className="section-subtitle">
              Thoughtfully curated collections designed for balance, longevity, and timeless relevance.
            </p>
          </div>
          <a href="#discover-more" className="explore-link">
            Explore all collections <ArrowRight size={16} />
          </a>
        </div>

        {/* Product Cards Grid */}
        <div className="archive-grid">
          {displayProducts.map((product) => {
            const isWishlisted = wishlist.includes(product.id);
            return (
              <div key={product.id} className="archive-card">
                <div className="card-image-container" onClick={() => handleNavigate(product)}>
                  <img src={product.image} alt={product.name} className="product-image" />
                  
                  {/* Badge */}
                  {product.badge && (
                    <span className={`card-badge badge-${product.badgeType || 'green'}`}>
                      {product.badge}
                    </span>
                  )}

                  {/* Top Right Floating Actions */}
                  <div className="floating-actions">
                    <button
                      className={`action-circle ${isWishlisted ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                      title="Add to Wishlist"
                    >
                      <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      className="action-circle"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuickViewProduct(product);
                      }}
                      title="Quick View"
                    >
                      <Eye size={16} />
                    </button>
                  </div>

                  {/* Add to Cart Overlay */}
                  <button
                    className="add-to-cart-overlay-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                  >
                    <ShoppingBag size={16} /> Add to Cart
                  </button>
                </div>

                <div className="card-details" onClick={() => handleNavigate(product)}>
                  <span className="product-category">{product.category}</span>
                  <h3 className="product-name">{product.name}</h3>
                  <div className="price-row">
                    <span className="current-price">${product.price.toFixed(2)}</span>
                    {product.originalPrice && (
                      <span className="original-price">${product.originalPrice.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import React, { useRef } from 'react';
import { JUST_LANDED_PRODUCTS as MOCK_PRODUCTS } from '../data/mockProducts';
import { useCart } from '../context/CartContext';
import { ChevronLeft, ChevronRight, ShoppingBag, Eye, ArrowRight } from 'lucide-react';
import './JustLanded.css';

export default function JustLanded() {
  const { liveProducts, addToCart, setQuickViewProduct, navigateTo } = useCart();
  const sliderRef = useRef(null);

  // Use live products or fallback to mock products
  const displayProducts = liveProducts && liveProducts.length > 0
    ? liveProducts
    : MOCK_PRODUCTS;

  const handleNavigate = (product) => {
    navigateTo('product-details', product);
  };

  const scroll = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
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

          <div className="carousel-controls">
            <button className="control-btn" onClick={() => scroll('left')} aria-label="Previous">
              <ChevronLeft size={20} />
            </button>
            <button className="control-btn" onClick={() => scroll('right')} aria-label="Next">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Horizontal Slider */}
        <div className="slider-container" ref={sliderRef}>
          {displayProducts.map((product) => (
            <div key={product.id} className="landed-card" onClick={() => handleNavigate(product)}>
              <div className="landed-image-wrap">
                <img src={product.image} alt={product.name} className="landed-img" />
                
                <button
                  className="quick-view-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuickViewProduct(product);
                  }}
                  title="Quick View"
                >
                  <Eye size={16} /> Quick View
                </button>
              </div>

              <div className="landed-info">
                <span className="landed-category">{product.category}</span>
                <h3 className="landed-name">{product.name}</h3>
                <div className="landed-footer">
                  <span className="landed-price">${product.price.toFixed(2)}</span>
                  <button
                    className="add-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                    title="Add to Cart"
                  >
                    <ShoppingBag size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="center-cta-wrap">
          <a href="#discover-more" className="btn btn-forest">
            EXPLORE ALL PRODUCTS <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}

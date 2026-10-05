import React, { useState } from 'react';
import { X, Star, Heart, ShoppingBag, Plus, Minus, Truck, RotateCcw } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './QuickViewModal.css';

export default function QuickViewModal() {
  const { quickViewProduct, setQuickViewProduct, addToCart, wishlist, toggleWishlist } = useCart();
  const [qty, setQty] = useState(1);

  if (!quickViewProduct) return null;

  const isWishlisted = wishlist.includes(quickViewProduct.id);

  const handleAddToCart = () => {
    addToCart(quickViewProduct, qty);
    setQuickViewProduct(null);
    setQty(1);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={() => setQuickViewProduct(null)} />

      <div className="quick-view-modal">
        <button
          className="modal-close-btn"
          onClick={() => setQuickViewProduct(null)}
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        <div className="modal-body">
          {/* Left: Product Image */}
          <div className="modal-image-col">
            <img src={quickViewProduct.image} alt={quickViewProduct.name} className="modal-product-img" />
          </div>

          {/* Right: Product Information */}
          <div className="modal-info-col">
            <span className="modal-category">{quickViewProduct.category}</span>
            <h2 className="modal-title font-serif">{quickViewProduct.name}</h2>

            {/* Rating */}
            <div className="modal-rating">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} fill="#3C5E4B" color="#3C5E4B" />
                ))}
              </div>
              <span className="rating-text">
                {quickViewProduct.rating || '4.9'} ({quickViewProduct.reviewsCount || 24} customer reviews)
              </span>
            </div>

            {/* Price */}
            <div className="modal-price-row">
              <span className="modal-current-price">${quickViewProduct.price.toFixed(2)}</span>
              {quickViewProduct.originalPrice && (
                <span className="modal-original-price">${quickViewProduct.originalPrice.toFixed(2)}</span>
              )}
            </div>

            {/* Description */}
            <p className="modal-description">
              {quickViewProduct.description ||
                'Crafted with meticulous attention to detail and sustainable materials. Designed for longevity and everyday minimalist elegance.'}
            </p>

            {/* Quantity and Actions */}
            <div className="modal-purchase-group">
              <div className="modal-qty-picker">
                <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease">
                  <Minus size={14} />
                </button>
                <span>{qty}</span>
                <button onClick={() => setQty(qty + 1)} aria-label="Increase">
                  <Plus size={14} />
                </button>
              </div>

              <button className="btn btn-forest flex-1" onClick={handleAddToCart}>
                <ShoppingBag size={18} /> Add to Cart
              </button>

              <button
                className={`modal-wishlist-btn ${isWishlisted ? 'active' : ''}`}
                onClick={() => toggleWishlist(quickViewProduct.id)}
                title="Add to Wishlist"
              >
                <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Features Info */}
            <div className="modal-features">
              <div className="feature-item">
                <Truck size={16} />
                <span>Free Express Shipping over $100</span>
              </div>
              <div className="feature-item">
                <RotateCcw size={16} />
                <span>30-Day Hassle-Free Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

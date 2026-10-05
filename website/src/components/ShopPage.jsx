import React, { useState, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { SEASONAL_ARCHIVE_PRODUCTS, JUST_LANDED_PRODUCTS, DISCOVER_PRODUCTS } from '../data/mockProducts';
import { Heart, Eye, ShoppingBag, Star, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import './ShopPage.css';

export default function ShopPage() {
  const {
    liveProducts,
    liveCategories,
    addToCart,
    wishlist,
    toggleWishlist,
    setQuickViewProduct,
    navigateTo
  } = useCart();

  // Filter States
  const [selectedCategories, setSelectedCategories] = useState(['ALL']);
  const [maxPrice, setMaxPrice] = useState(500000);
  const [sortBy, setSortBy] = useState('recommended');
  const [currentPageNum, setCurrentPageNum] = useState(1);

  const ITEMS_PER_PAGE = 12;

  // Aggregate API live products + mock fallback products
  const allShopProducts = useMemo(() => {
    if (liveProducts && liveProducts.length > 0) return liveProducts;
    const map = new Map();
    [...SEASONAL_ARCHIVE_PRODUCTS, ...JUST_LANDED_PRODUCTS, ...DISCOVER_PRODUCTS].forEach((p) => {
      map.set(p.id, p);
    });
    return Array.from(map.values());
  }, [liveProducts]);

  // Build category list from API
  const categoryOptions = useMemo(() => {
    if (liveCategories && liveCategories.length > 0) {
      return liveCategories.map((cat) => ({
        id: cat.id,
        label: cat.name,
      }));
    }
    return [];
  }, [liveCategories]);

  // Handle Category checkbox toggle
  const toggleCategoryFilter = (catId) => {
    if (catId === 'ALL') {
      setSelectedCategories(['ALL']);
      setCurrentPageNum(1);
      return;
    }
    setSelectedCategories((prev) => {
      let updated = prev.filter((c) => c !== 'ALL');
      if (updated.includes(catId)) {
        updated = updated.filter((c) => c !== catId);
      } else {
        updated.push(catId);
      }
      setCurrentPageNum(1);
      return updated.length === 0 ? ['ALL'] : updated;
    });
  };

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    let result = allShopProducts;

    // Price Filter
    result = result.filter((p) => p.price <= maxPrice);

    // Category Filter
    if (!selectedCategories.includes('ALL')) {
      result = result.filter((p) =>
        selectedCategories.some(
          (cat) =>
            String(p.categoryId) === String(cat) ||
            p.category?.toLowerCase() === categoryOptions.find(c => c.id === cat)?.label?.toLowerCase()
        )
      );
    }

    // Sorting
    if (sortBy === 'price-low') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result = [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [allShopProducts, maxPrice, selectedCategories, sortBy, categoryOptions]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = filteredProducts.slice(
    (currentPageNum - 1) * ITEMS_PER_PAGE,
    currentPageNum * ITEMS_PER_PAGE
  );

  // Format PKR price
  const formatPKR = (price) => {
    return `Rs. ${Number(price).toLocaleString('en-PK')}`;
  };

  return (
    <div className="shop-page-wrapper">
      <div className="container">
        <div className="shop-layout">
          {/* LEFT SIDEBAR: FILTERS */}
          <aside className="shop-sidebar">
            <h3 className="sidebar-title">Filters</h3>

            {/* Category Checkboxes â€” fetched from API */}
            <div className="filter-group">
              <h4 className="filter-group-title">CATEGORIES</h4>
              <div className="checkbox-list">
                <label className="custom-checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes('ALL')}
                    onChange={() => toggleCategoryFilter('ALL')}
                  />
                  <span className="checkbox-custom" />
                  <span className="label-text">All Products</span>
                </label>

                {categoryOptions.map((cat) => (
                  <label key={cat.id} className="custom-checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.id)}
                      onChange={() => toggleCategoryFilter(cat.id)}
                    />
                    <span className="checkbox-custom" />
                    <span className="label-text">{cat.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range Slider â€” PKR */}
            <div className="filter-group">
              <h4 className="filter-group-title">PRICE RANGE</h4>
              <div className="price-slider-wrap">
                <input
                  type="range"
                  min="0"
                  max="500000"
                  step="1000"
                  value={maxPrice}
                  onChange={(e) => { setMaxPrice(Number(e.target.value)); setCurrentPageNum(1); }}
                  className="price-slider"
                />
                <div className="price-range-labels">
                  <span>Rs. 0</span>
                  <span className="max-price-val">{maxPrice >= 500000 ? 'Rs. 500,000+' : formatPKR(maxPrice)}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT MAIN SECTION: PRODUCTS GRID */}
          <main className="shop-main-content">
            {/* Header Row */}
            <div className="shop-header-row">
              <div className="shop-title-group">
                <h1 className="shop-collection-title font-serif">Our Products</h1>
                <p className="shop-count-sub">Showing {filteredProducts.length} products</p>
              </div>

              <div className="shop-sort-group">
                <span className="sort-by-label">SORT BY</span>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setCurrentPageNum(1); }}
                  className="sort-select-pill"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Customer Rating</option>
                </select>
              </div>
            </div>

            {/* Products 3-Column Grid */}
            <div className="shop-products-grid">
              {paginatedProducts.map((product) => {
                const isWishlisted = wishlist.includes(product.id);
                return (
                  <div
                    key={product.id}
                    className="shop-product-card animate-fade-in"
                    onClick={() => navigateTo('product-details', product)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-image-box">
                      <img src={product.image} alt={product.name} className="product-image" />

                      {product.badge && (
                        <span className={`badge-tag ${product.badgeType || 'green'}`}>
                          {product.badge}
                        </span>
                      )}

                      <div className="card-floating-actions">
                        <button
                          className={`action-btn-pill ${isWishlisted ? 'active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                          title="Wishlist"
                        >
                          <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          className="action-btn-pill"
                          onClick={(e) => { e.stopPropagation(); setQuickViewProduct(product); }}
                          title="Quick View"
                        >
                          <Eye size={16} />
                        </button>
                      </div>

                      <button
                        className="bottom-cart-btn-circle"
                        onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                        title="Add to cart"
                      >
                        <ShoppingBag size={16} />
                      </button>
                    </div>

                    <div className="card-details-body">
                      <div className="title-price-row">
                        <h3 className="product-item-name">{product.name}</h3>
                        <div className="price-group">
                          <span className="item-price">{formatPKR(product.price)}</span>
                          {product.originalPrice && (
                            <span className="item-original-price">{formatPKR(product.originalPrice)}</span>
                          )}
                        </div>
                      </div>

                      <p className="product-subtitle">{product.category}</p>

                      <div className="rating-stars-row">
                        <div className="stars-list">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              fill={i < Math.floor(product.rating || 5) ? '#D4AF37' : '#E2E8F0'}
                              color={i < Math.floor(product.rating || 5) ? '#D4AF37' : '#E2E8F0'}
                            />
                          ))}
                        </div>
                        <span className="reviews-count">({product.reviewsCount || 0})</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="shop-pagination-wrap">
                <button
                  className="page-arrow-btn"
                  disabled={currentPageNum === 1}
                  onClick={() => setCurrentPageNum((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    className={`page-num-btn ${currentPageNum === num ? 'active' : ''}`}
                    onClick={() => setCurrentPageNum(num)}
                  >
                    {num}
                  </button>
                ))}

                {totalPages > 5 && (
                  <>
                    <span className="page-dots">...</span>
                    <button
                      className={`page-num-btn ${currentPageNum === totalPages ? 'active' : ''}`}
                      onClick={() => setCurrentPageNum(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  className="page-arrow-btn"
                  disabled={currentPageNum === totalPages}
                  onClick={() => setCurrentPageNum((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

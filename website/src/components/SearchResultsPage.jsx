import React, { useMemo, useState } from 'react';
import { useCart } from '../context/CartContext';
import { SEASONAL_ARCHIVE_PRODUCTS, JUST_LANDED_PRODUCTS, DISCOVER_PRODUCTS } from '../data/mockProducts';
import { Heart, Eye, ShoppingBag, Search, X, ArrowLeft, SlidersHorizontal, Sparkles, Star } from 'lucide-react';
import './SearchResultsPage.css';

export default function SearchResultsPage() {
  const {
    liveProducts,
    liveCategories,
    searchQuery,
    setSearchQuery,
    addToCart,
    wishlist,
    toggleWishlist,
    setQuickViewProduct,
    navigateTo
  } = useCart();

  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('featured');

  // Aggregate all catalog products
  const allProducts = useMemo(() => {
    if (liveProducts && liveProducts.length > 0) return liveProducts;
    const map = new Map();
    [...SEASONAL_ARCHIVE_PRODUCTS, ...JUST_LANDED_PRODUCTS, ...DISCOVER_PRODUCTS].forEach((p) => {
      map.set(p.id, p);
    });
    return Array.from(map.values());
  }, [liveProducts]);

  // Build category filter pills dynamically from live API categories or fallback
  const categoryFilterTabs = useMemo(() => {
    const tabs = [{ id: 'ALL', label: 'ALL' }];
    if (liveCategories && liveCategories.length > 0) {
      liveCategories.forEach((cat) => {
        tabs.push({ id: cat.id, label: cat.name.toUpperCase() });
      });
    } else {
      tabs.push(
        { id: 'apparel', label: 'APPAREL' },
        { id: 'beauty', label: 'BEAUTY' },
        { id: 'home-decor', label: 'HOME DECOR' },
        { id: 'care', label: 'CARE' },
        { id: 'accessories', label: 'ACCESSORIES' }
      );
    }
    return tabs;
  }, [liveCategories]);

  // Filter products by searchQuery and category
  const filteredProducts = useMemo(() => {
    let result = allProducts;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'ALL') {
      result = result.filter(
        (p) =>
          p.categoryId === selectedCategory ||
          String(p.categoryId) === String(selectedCategory) ||
          p.category.toUpperCase() === selectedCategory.toUpperCase()
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
  }, [allProducts, searchQuery, selectedCategory, sortBy]);

  const popularTags = ['Cotton', 'Serum', 'Leather', 'Mug', 'Vase', 'Candle', 'Care'];

  return (
    <div className="search-page-container">
      {/* Breadcrumb */}
      <div className="search-breadcrumb-bar">
        <div className="container">
          <div className="breadcrumb">
            <span className="breadcrumb-link" onClick={() => navigateTo('home')}>Home</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Search Results</span>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="search-page-header">
        <div className="container">
          <div className="search-header-content">
            <div className="search-title-wrap">
              <h1 className="search-heading font-serif">
                {searchQuery ? (
                  <>Search Results for <span className="highlight-query">"{searchQuery}"</span></>
                ) : (
                  <>Explore Catalog</>
                )}
              </h1>
              <p className="search-count-text">
                Found <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'item' : 'items'} matching your criteria
              </p>
            </div>

            {searchQuery && (
              <button
                className="clear-search-btn"
                onClick={() => {
                  setSearchQuery('');
                  navigateTo('home');
                }}
              >
                <X size={16} /> Clear Search
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container">
        {/* Filter and Sort Toolbar */}
        <div className="search-toolbar">
          <div className="category-filter-pills">
            {categoryFilterTabs.map((tab) => (
              <button
                key={tab.id}
                className={`filter-btn ${selectedCategory === tab.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="sort-dropdown-wrap">
            <SlidersHorizontal size={15} className="sort-icon" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="featured">Sort by: Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="search-products-grid">
            {filteredProducts.map((product) => {
              const isWishlisted = wishlist.includes(product.id);
              return (
                <div
                  key={product.id}
                  className="search-product-card animate-fade-in"
                  onClick={() => navigateTo('product-details', product)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="product-image-container">
                    <img src={product.image} alt={product.name} className="product-img" />

                    {product.badge && (
                      <span className={`badge ${product.badgeType || 'green'}`}>
                        {product.badge}
                      </span>
                    )}

                    <div className="card-quick-actions">
                      <button
                        className={`action-circle ${isWishlisted ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(product.id);
                        }}
                        title="Wishlist"
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

                    <button
                      className="add-to-cart-bar-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                    >
                      <ShoppingBag size={16} /> Add to Cart
                    </button>
                  </div>

                  <div className="product-card-body">
                    <span className="product-category-tag">{product.category}</span>
                    <h3 className="product-card-title">{product.name}</h3>

                    <div className="product-rating-row">
                      <div className="stars">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            fill={i < Math.floor(product.rating || 5) ? '#D4AF37' : '#E2E8F0'}
                            color={i < Math.floor(product.rating || 5) ? '#D4AF37' : '#E2E8F0'}
                          />
                        ))}
                      </div>
                      <span className="rating-num">{product.rating || 4.9}</span>
                    </div>

                    <div className="product-price-row">
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
        ) : (
          <div className="search-empty-state">
            <div className="empty-icon-wrap">
              <Search size={44} />
            </div>
            <h2>No products found for "{searchQuery}"</h2>
            <p>Check the spelling or try searching for one of these popular terms:</p>

            <div className="popular-tags-row">
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  className="popular-tag-btn"
                  onClick={() => setSearchQuery(tag)}
                >
                  <Sparkles size={12} /> {tag}
                </button>
              ))}
            </div>

            <button
              className="return-shop-btn"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                navigateTo('home');
              }}
            >
              <ArrowLeft size={16} /> Back to Shop
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

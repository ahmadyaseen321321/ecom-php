import React from 'react';
import { DISCOVER_PRODUCTS as MOCK_PRODUCTS } from '../data/mockProducts';
import { useCart } from '../context/CartContext';
import { Heart, Eye, ShoppingBag } from 'lucide-react';
import './DiscoverMore.css';

export default function DiscoverMore() {
  const {
    liveProducts,
    liveCategories,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    searchQuery,
    addToCart,
    wishlist,
    toggleWishlist,
    setQuickViewProduct,
    navigateTo,
  } = useCart();

  // Build filter tabs dynamically from live categories or fallback
  const filterTabs = [
    { id: 'ALL', label: 'ALL' },
    ...(liveCategories && liveCategories.length > 0
      ? liveCategories.map((c) => ({ id: c.id, label: c.name.toUpperCase() }))
      : [
          { id: 'apparel', label: 'APPAREL' },
          { id: 'beauty', label: 'BEAUTY' },
          { id: 'home-decor', label: 'HOME DECOR' },
          { id: 'accessories', label: 'ACCESSORIES' },
        ]),
  ];

  const productsSource = liveProducts && liveProducts.length > 0
    ? liveProducts
    : MOCK_PRODUCTS;

  // Filter products based on selected tab and search query
  const filteredProducts = productsSource.filter((product) => {
    const matchesCategory =
      selectedCategoryFilter === 'ALL' ||
      product.categoryId === selectedCategoryFilter ||
      product.category.toUpperCase() === selectedCategoryFilter;
      
    const matchesSearch =
      searchQuery.trim() === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <section id="discover-more" className="discover-more-section">
      <div className="container">
        <h2 className="discover-title font-serif text-center">Discover More</h2>

        {/* Filter Pills */}
        <div className="filter-tabs">
          {filterTabs.map((tab) => {
            const isActive = selectedCategoryFilter === tab.id;
            return (
              <button
                key={tab.id}
                className={`filter-pill ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedCategoryFilter(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        <div className="discover-grid">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              const isWishlisted = wishlist.includes(product.id);
              return (
                <div
                  key={product.id}
                  className="discover-card"
                  onClick={() => navigateTo('product-details', product)}
                >
                  <div className="discover-image-wrap">
                    <img src={product.image} alt={product.name} className="discover-img" />

                    <div className="discover-actions">
                      <button
                        className={`action-btn-circle ${isWishlisted ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(product.id);
                        }}
                        title="Wishlist"
                      >
                        <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        className="action-btn-circle"
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
                      className="discover-add-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                    >
                      <ShoppingBag size={15} /> Add to Cart
                    </button>
                  </div>

                  <div className="discover-info">
                    <span className="discover-category">{product.category}</span>
                    <h3 className="discover-item-name">{product.name}</h3>
                    <div className="discover-footer">
                      <span className="discover-item-price">${product.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-results">
              <p>No products found matching your criteria.</p>
              <button
                className="btn btn-dark-outline"
                onClick={() => setSelectedCategoryFilter('ALL')}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

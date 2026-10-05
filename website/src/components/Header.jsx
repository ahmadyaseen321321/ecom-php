import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ShoppingBag, Search, User, Menu, X, MoreVertical, Settings, LogOut, Eye, ArrowRight, Sparkles, Store } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { SEASONAL_ARCHIVE_PRODUCTS, JUST_LANDED_PRODUCTS, DISCOVER_PRODUCTS } from '../data/mockProducts';
import './Header.css';

export default function Header() {
  const {
    liveProducts,
    totalCartCount,
    searchQuery,
    setSearchQuery,
    user,
    logout,
    setIsAuthModalOpen,
    navigateTo,
    setIsSideDrawerOpen,
    setActiveInfoModal,
    setQuickViewProduct,
    addToCart,
    currentPage
  } = useCart();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef(null);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Aggregate all products across live API and mock fallbacks
  const allProducts = useMemo(() => {
    if (liveProducts && liveProducts.length > 0) return liveProducts;
    const map = new Map();
    [...SEASONAL_ARCHIVE_PRODUCTS, ...JUST_LANDED_PRODUCTS, ...DISCOVER_PRODUCTS].forEach((p) => {
      map.set(p.id, p);
    });
    return Array.from(map.values());
  }, [liveProducts]);

  // Filter matching products
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [searchQuery, allProducts]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim() !== '') {
      navigateTo('search');
    } else {
      navigateTo('home');
    }
  };

  return (
    <header className="site-header">
      {/* Top Navbar */}
      <div className="navbar-wrapper">
        <div className="navbar-container">
          {/* Left: 3-Dots / Menu Button, Brand Logo, Nav Links */}
          <div className="navbar-left">
            <button
              className="header-menu-btn"
              onClick={() => setIsSideDrawerOpen(true)}
              title="Open Side Menu"
              aria-label="Open Side Menu"
            >
              <Menu size={16} />
              <span>Menu</span>
            </button>

            <a
              href="#"
              className="brand-logo"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('home');
              }}
            >
              <div className="logo-box-icon">
                {/* Pixel-perfect Isometric Box Logo */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#3D5647" stroke="#3D5647" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M2 17L12 22L22 17" stroke="#3D5647" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 7V17" stroke="#3D5647" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M22 7V17" stroke="#3D5647" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M12 12V22" stroke="#3D5647" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <span className="logo-text">mystore</span>
            </a>

            <nav className={`header-nav-links ${mobileMenuOpen ? 'active' : ''}`}>
              <a
                href="#"
                className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('home');
                }}
              >
                Home
              </a>
              <a
                href="#"
                className={`nav-link ${currentPage === 'shop' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('shop');
                }}
              >
                Shop
              </a>
              <a
                href="#"
                className={`nav-link ${currentPage === 'wishlist' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('wishlist');
                }}
              >
                Whishlist
              </a>
              <a
                href="#"
                className={`nav-link ${currentPage === 'orders' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('orders');
                }}
              >
                orders
              </a>
              <a
                href="#"
                className={`nav-link ${currentPage === 'messages' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('messages');
                }}
              >
                messages
              </a>
            </nav>
          </div>

          {/* Right: Search Bar & Actions */}
          <div className="navbar-right">
            <div className="header-search-container">
              <div className="header-search-pill">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search curated styles..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => {
                    if (searchQuery.trim() !== '') navigateTo('search');
                  }}
                />
                {searchQuery && (
                  <button
                    className="clear-search"
                    onClick={() => {
                      setSearchQuery('');
                      navigateTo('home');
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="header-actions-group">
              <button
                className="pill-action-btn cart-btn"
                onClick={() => navigateTo('cart')}
                title="Shopping Cart"
                aria-label="Shopping Cart"
              >
                <ShoppingBag size={18} />
                {totalCartCount > 0 && <span className="action-badge">{totalCartCount}</span>}
              </button>

              <div className="profile-container">
                <button
                  className="pill-action-btn profile-btn"
                  title="Account"
                  aria-label="Account"
                  onClick={() => {
                    if (user) {
                      setIsProfileMenuOpen(!isProfileMenuOpen);
                    } else {
                      setIsAuthModalOpen(true);
                    }
                  }}
                >
                  {user ? (
                    <span className="user-initials">
                      {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                    </span>
                  ) : (
                    <User size={18} />
                  )}
                </button>

                {user && isProfileMenuOpen && (
                  <div className="profile-dropdown">
                    {(user.role === 'seller' || user.is_seller == 1) && (
                      <div className="dropdown-item seller-mode" onClick={() => {
                        setIsProfileMenuOpen(false);
                        navigateTo('seller-dashboard');
                      }}>
                        <Store size={16} />
                        <span>Seller Dashboard</span>
                      </div>
                    )}
                    <div className="dropdown-item" onClick={() => {
                      setIsProfileMenuOpen(false);
                      setActiveInfoModal('profile');
                    }}>
                      <User size={16} />
                      <span>Profile</span>
                    </div>
                    <div className="dropdown-item" onClick={() => {
                      setIsProfileMenuOpen(false);
                      setActiveInfoModal('settings');
                    }}>
                      <Settings size={16} />
                      <span>Settings</span>
                    </div>
                    <div className="dropdown-item logout" onClick={() => {
                      logout();
                      setIsProfileMenuOpen(false);
                    }}>
                      <LogOut size={16} />
                      <span>Sign out</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                className="mobile-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Announcement Marquee Bar (Placed BELOW Navbar) */}
      <div className="announcement-bar-bottom">
        <div className="announcement-track">
          <span>EXTRA 20% OFF ALL OUTERWEAR</span>
          <span className="star">☆</span>
          <span>USE CODE: WINTER20</span>
          <span className="star">☆</span>
          <span>FREE SHIPPING ON ORDERS OVER $100</span>
          <span className="star">☆</span>
          <span>LIMITED TIME ONLY</span>
          <span className="star">☆</span>
          <span>EXTRA 20% OFF ALL OUTERWEAR</span>
          <span className="star">☆</span>
          <span>USE CODE: WINTER20</span>
          <span className="star">☆</span>
          <span>FREE SHIPPING ON ORDERS OVER $100</span>
          <span className="star">☆</span>
          <span>LIMITED TIME ONLY</span>
          <span className="star">☆</span>
        </div>
      </div>
    </header>
  );
}

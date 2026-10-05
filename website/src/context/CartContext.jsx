import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchProducts, fetchCategories, getImageUrl, fetchWishlistApi, addToWishlistApi, removeFromWishlistApi } from '../services/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // ─── Live data from API ───────────────────────────────────
  const [liveProducts, setLiveProducts] = useState([]);
  const [liveCategories, setLiveCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [productsData, categoriesData] = await Promise.all([
          fetchProducts(),
          fetchCategories(),
        ]);

        if (productsData) {
          // Normalize product data from backend to match component expectations
          const normalized = productsData.map((p) => {
            const rawPrice = parseFloat(p.price || 0);
            const rawDiscount = parseFloat(p.discount_price || 0);
            const hasDiscount = rawDiscount > 0 && rawDiscount < rawPrice;

            return {
              id: String(p.id),
              name: p.name,
              description: p.description || '',
              category: p.category_name || '',
              categoryId: String(p.category_id),
              price: hasDiscount ? rawDiscount : rawPrice,
              originalPrice: hasDiscount ? rawPrice : null,
              image: getImageUrl(p.main_image),
              allImages: p.all_images
                ? p.all_images.split(',').map((img) => getImageUrl(img))
                : [getImageUrl(p.main_image)],
              rating: 4.8,
              reviewsCount: 0,
              stock: parseInt(p.stock || 0),
              badge: hasDiscount ? 'SALE' : null,
              badgeType: hasDiscount ? 'red' : 'green',
            };
          });
          setLiveProducts(normalized);
        }

        if (categoriesData) {
          const normalizedCats = categoriesData.map((c) => ({
            id: String(c.id),
            name: c.name,
            image: c.image_url ? getImageUrl(c.image_url) : null,
          }));
          setLiveCategories(normalizedCats);
        }
      } catch (err) {
        console.error('Failed to load data from API:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // ─── Cart State ──────────────────────────────────────────
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);

  // ─── Dark Mode ─────────────────────────────────────────
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('darkMode') === 'true';
    } catch {
      return false;
    }
  });

  const toggleDarkMode = (value) => {
    const newVal = typeof value === 'boolean' ? value : !darkMode;
    setDarkMode(newVal);
    localStorage.setItem('darkMode', String(newVal));
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);
  const [activeInfoModal, setActiveInfoModal] = useState(null); // 'profile' | 'settings' | 'about' | 'faq' | 'terms' | null
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.role === 'admin') {
          return 'admin-dashboard';
        }
        if (parsed && (parsed.role === 'seller' || parsed.is_seller == 1)) {
          return 'seller-dashboard';
        }
      }
    } catch (e) {
      console.error('Error initializing page state:', e);
    }
    return 'home';
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [lastOrderData, setLastOrderData] = useState(null);

  // Sync wishlist to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    } catch (err) {
      console.error('Failed to save wishlist to localStorage:', err);
    }
  }, [wishlist]);

  // Fetch backend wishlist when user logs in or page loads with token
  useEffect(() => {
    async function loadWishlist() {
      const token = localStorage.getItem('token');
      if (user || token) {
        try {
          const res = await fetchWishlistApi();
          console.log('[WISHLIST LOAD] Backend response:', res);
          if (res) {
            const list = Array.isArray(res) ? res : (res.data || res.items || []);
            if (Array.isArray(list)) {
              const ids = list.map((item) => String(typeof item === 'object' ? (item.product_id || item.id || item.productId) : item));
              setWishlist((prev) => Array.from(new Set([...prev, ...ids])));
            }
          }
        } catch (err) {
          console.error('Failed to fetch backend wishlist:', err);
        }
      }
    }
    loadWishlist();
  }, [user]);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (event) => {
      const isAdmin  = user && user.role === 'admin';
      const isSeller = user && (user.role === 'seller' || user.is_seller == 1);
      if (isAdmin) {
        setCurrentPage('admin-dashboard');
        return;
      }
      if (isSeller) {
        setCurrentPage('seller-dashboard');
        return;
      }
      if (event.state && event.state.page) {
        setCurrentPage(event.state.page);
      } else {
        setCurrentPage('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  const navigateTo = (page, product = null) => {
    const isSeller = user && (user.role === 'seller' || user.is_seller == 1);
    // Admin can freely navigate; sellers are locked to their dashboard
    const targetPage = isSeller ? 'seller-dashboard' : page;

    setCurrentPage(targetPage);
    if (product) setSelectedProduct(product);

    // Push to browser history
    window.history.pushState({ page: targetPage, productId: product?.id }, '', '');
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        if (parsedUser && parsedUser.role === 'admin') {
          setCurrentPage('admin-dashboard');
        } else if (parsedUser && (parsedUser.role === 'seller' || parsedUser.is_seller == 1)) {
          setCurrentPage('seller-dashboard');
        } else {
          setCurrentPage('home');
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    showToast(`Welcome back, ${userData.full_name || userData.name || 'User'}!`);
    if (userData && userData.role === 'admin') {
      setCurrentPage('admin-dashboard');
    } else if (userData && (userData.role === 'seller' || userData.is_seller == 1)) {
      setCurrentPage('seller-dashboard');
    } else {
      setCurrentPage('home');
    }
  };

  const logout = () => {
    setUser(null);
    setWishlist([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentPage('home');
    showToast('Logged out successfully');
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const addToCart = (product, quantity = 1) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prev, { ...product, quantity }];
    });
    showToast(`Added "${product.name}" to your cart`);
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
    showToast('Item removed from cart');
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const toggleWishlist = async (productId) => {
    const pIdStr = String(productId);
    const isInWishlist = wishlist.includes(pIdStr) || wishlist.includes(productId);

    // Optimistic UI update for instantaneous responsiveness
    if (isInWishlist) {
      setWishlist((prev) => prev.filter((id) => String(id) !== pIdStr));
      showToast('Removed from Wishlist');
      try {
        await removeFromWishlistApi(productId);
      } catch (err) {
        console.error('Failed to sync wishlist removal with backend:', err);
      }
    } else {
      setWishlist((prev) => [...prev, pIdStr]);
      showToast('Saved to Wishlist');
      try {
        await addToWishlistApi(productId);
      } catch (err) {
        console.error('Failed to sync wishlist addition with backend:', err);
      }
    }
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        // Live data
        liveProducts,
        liveCategories,
        isLoading,
        // Cart state
        cart,
        wishlist,
        isCartOpen,
        setIsCartOpen,
        quickViewProduct,
        setQuickViewProduct,
        searchQuery,
        setSearchQuery,
        selectedCategoryFilter,
        setSelectedCategoryFilter,
        toastMessage,
        user,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isSideDrawerOpen,
        setIsSideDrawerOpen,
        activeInfoModal,
        setActiveInfoModal,
        currentPage,
        setCurrentPage,
        selectedProduct,
        setSelectedProduct,
        lastOrderData,
        setLastOrderData,
        navigateTo,
        login,
        logout,
        addToCart,
        removeFromCart,
        updateQuantity,
        toggleWishlist,
        totalCartCount,
        cartSubtotal,
        showToast,
        darkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

import React from 'react';
import { CartProvider, useCart } from './context/CartContext';
import Header from './components/Header';
import Hero from './components/Hero';
import CategoryBubbles from './components/CategoryBubbles';
import SeasonalArchive from './components/SeasonalArchive';
import JustLanded from './components/JustLanded';
import PromoBanner from './components/PromoBanner';
import DiscoverMore from './components/DiscoverMore';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import SideDrawer from './components/SideDrawer';
import QuickViewModal from './components/QuickViewModal';
import AuthModal from './components/AuthModal';
import InfoModals from './components/InfoModals';
import ProductDetails from './components/ProductDetails';
import Wishlist from './components/Wishlist';
import CartPage from './components/CartPage';
import SearchResultsPage from './components/SearchResultsPage';
import ShopPage from './components/ShopPage';
import OrdersPage from './components/OrdersPage';
import CheckoutPage from './components/CheckoutPage';
import SellerDashboard from './components/SellerDashboard';
import AdminDashboard from './components/AdminDashboard';
import MessagesPage from './components/MessagesPage';
import OrderSuccessPage from './components/OrderSuccessPage';
import AboutPage from './components/AboutPage';
import ContactPage from './components/ContactPage';
import NovanestNavHeader from './components/NovanestNavHeader';
import ProfileSettingsPage from './components/ProfileSettingsPage';
import LoginRequiredModal from './components/LoginRequiredModal';
import { CheckCircle } from 'lucide-react';
import './App.css';

function MainLayout() {
  const {
    toastMessage,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    isLoginRequiredOpen,
    setIsLoginRequiredOpen,
    openLoginModal,
    openSignupModal,
    currentPage
  } = useCart();

  const isNovanestStaticPage = currentPage === 'about' || currentPage === 'contact';

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification animate-fade-in">
          <CheckCircle size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      {isNovanestStaticPage ? (
        <NovanestNavHeader />
      ) : (
        currentPage !== 'seller-dashboard' && currentPage !== 'admin-dashboard' && <Header />
      )}

      {currentPage === 'home' && (
        <main>
          <Hero />
          <CategoryBubbles />
          <SeasonalArchive />
          <JustLanded />
          <PromoBanner />
          <DiscoverMore />
          <Testimonials />
        </main>
      )}

      {currentPage === 'search' && <SearchResultsPage />}

      {currentPage === 'shop' && <ShopPage />}

      {currentPage === 'product-details' && <ProductDetails />}

      {currentPage === 'wishlist' && <Wishlist />}

      {currentPage === 'cart' && <CartPage />}

      {currentPage === 'orders' && <OrdersPage />}

      {currentPage === 'messages' && <MessagesPage />}

      {currentPage === 'about' && <AboutPage />}

      {currentPage === 'contact' && <ContactPage />}

      {currentPage === 'profile' && <ProfileSettingsPage initialTab="profile" />}

      {currentPage === 'settings' && <ProfileSettingsPage initialTab="settings" />}

      {currentPage === 'checkout' && <CheckoutPage />}

      {currentPage === 'order-success' && <OrderSuccessPage />}

      {currentPage === 'seller-dashboard' && <SellerDashboard />}

      {currentPage === 'admin-dashboard' && <AdminDashboard />}

      {currentPage !== 'seller-dashboard' && currentPage !== 'admin-dashboard' && currentPage !== 'messages' && <Footer />}

      {/* Interactive Overlays */}
      <CartDrawer />
      <SideDrawer />
      <QuickViewModal />
      <LoginRequiredModal
        isOpen={isLoginRequiredOpen}
        onClose={() => setIsLoginRequiredOpen(false)}
        onLoginClick={openLoginModal}
        onSignupClick={openSignupModal}
      />
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
      />
      <InfoModals />
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <MainLayout />
    </CartProvider>
  );
}

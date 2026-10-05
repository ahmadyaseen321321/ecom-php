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
import MessagesPage from './components/MessagesPage';
import OrderSuccessPage from './components/OrderSuccessPage';
import { CheckCircle } from 'lucide-react';
import './App.css';

function MainLayout() {
  const { toastMessage, isAuthModalOpen, setIsAuthModalOpen, currentPage } = useCart();

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification animate-fade-in">
          <CheckCircle size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {currentPage !== 'seller-dashboard' && <Header />}

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

      {currentPage === 'checkout' && <CheckoutPage />}

      {currentPage === 'order-success' && <OrderSuccessPage />}

      {currentPage === 'seller-dashboard' && <SellerDashboard />}

      {currentPage !== 'seller-dashboard' && <Footer />}

      {/* Interactive Overlays */}
      <CartDrawer />
      <SideDrawer />
      <QuickViewModal />
      <AuthModal
        isOpen={isAuthModalOpen}
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

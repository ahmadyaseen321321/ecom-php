import React from 'react';
import {
  X,
  User,
  Settings,
  Info,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  Leaf,
  Sparkles,
  ShieldCheck,
  LogIn
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import './SideDrawer.css';

export default function SideDrawer() {
  const {
    isSideDrawerOpen,
    setIsSideDrawerOpen,
    user,
    logout,
    setIsAuthModalOpen,
    setActiveInfoModal,
    showToast
  } = useCart();

  if (!isSideDrawerOpen) return null;

  const handleOpenModal = (modalName) => {
    setIsSideDrawerOpen(false);
    if (modalName === 'profile' && !user) {
      setIsAuthModalOpen(true);
    } else {
      setActiveInfoModal(modalName);
    }
  };

  const handleLogout = () => {
    setIsSideDrawerOpen(false);
    if (user) {
      logout();
    } else {
      showToast('You are currently signed out');
    }
  };

  return (
    <div className="side-drawer-overlay">
      <div className="side-drawer-backdrop" onClick={() => setIsSideDrawerOpen(false)} />

      <aside className="side-drawer animate-slide-right">
        {/* Drawer Header */}
        <div className="side-drawer-header">
          <div className="drawer-brand">
            <div className="drawer-logo-icon">
              <Leaf size={18} />
            </div>
            <span className="drawer-brand-title">mystore</span>
          </div>
          <button
            className="drawer-close-btn"
            onClick={() => setIsSideDrawerOpen(false)}
            aria-label="Close drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        <div className="drawer-user-card">
          {user ? (
            <div className="user-profile-summary" onClick={() => handleOpenModal('profile')}>
              <div className="avatar-circle">
                {user.full_name
                  ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
                  : 'US'}
              </div>
              <div className="user-info">
                <div className="user-name-row">
                  <h4 className="user-name">{user.full_name}</h4>
                  <span className="member-tag"><ShieldCheck size={11} /> Member</span>
                </div>
                <p className="user-email">{user.email}</p>
              </div>
              <ChevronRight size={16} className="arrow-icon" />
            </div>
          ) : (
            <div className="guest-banner">
              <div className="guest-text">
                <div className="guest-title-row">
                  <Sparkles size={16} className="sparkle-icon" />
                  <h4>Welcome to mystore</h4>
                </div>
                <p>Sign in for exclusive perks, order tracking & rewards.</p>
              </div>
              <button
                className="guest-login-btn"
                onClick={() => {
                  setIsSideDrawerOpen(false);
                  setIsAuthModalOpen(true);
                }}
              >
                <LogIn size={15} /> Log In / Register
              </button>
            </div>
          )}
        </div>

        {/* Navigation Options List */}
        <nav className="drawer-nav-menu">
          <div className="menu-section-label">Account & Support</div>

          <button className="nav-item" onClick={() => handleOpenModal('profile')}>
            <div className="nav-item-left">
              <div className="icon-wrapper profile-icon">
                <User size={18} />
              </div>
              <span className="nav-label">Profile</span>
            </div>
            <ChevronRight size={16} className="chevron" />
          </button>

          <button className="nav-item" onClick={() => handleOpenModal('settings')}>
            <div className="nav-item-left">
              <div className="icon-wrapper settings-icon">
                <Settings size={18} />
              </div>
              <span className="nav-label">Settings</span>
            </div>
            <ChevronRight size={16} className="chevron" />
          </button>

          <button className="nav-item" onClick={() => handleOpenModal('about')}>
            <div className="nav-item-left">
              <div className="icon-wrapper about-icon">
                <Info size={18} />
              </div>
              <span className="nav-label">About Us</span>
            </div>
            <ChevronRight size={16} className="chevron" />
          </button>

          <button className="nav-item" onClick={() => handleOpenModal('faq')}>
            <div className="nav-item-left">
              <div className="icon-wrapper faq-icon">
                <HelpCircle size={18} />
              </div>
              <span className="nav-label">FAQ</span>
            </div>
            <ChevronRight size={16} className="chevron" />
          </button>

          <button className="nav-item" onClick={() => handleOpenModal('terms')}>
            <div className="nav-item-left">
              <div className="icon-wrapper terms-icon">
                <FileText size={18} />
              </div>
              <span className="nav-label">Terms & Conditions</span>
            </div>
            <ChevronRight size={16} className="chevron" />
          </button>
        </nav>

        {/* Bottom Drawer Footer: Logout */}
        <div className="drawer-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </div>
  );
}

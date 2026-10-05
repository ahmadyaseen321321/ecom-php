import React, { useState } from 'react';
import {
  X,
  User,
  Settings,
  Info,
  HelpCircle,
  FileText,
  Check,
  Shield,
  Bell,
  Globe,
  Moon,
  ChevronDown,
  ChevronUp,
  Package,
  Heart,
  Award,
  Truck,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import './InfoModals.css';

export default function InfoModals() {
  const { activeInfoModal, setActiveInfoModal, user, showToast } = useCart();

  // Settings State
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [promoAlerts, setPromoAlerts] = useState(false);
  const [currency, setCurrency] = useState('USD ($)');

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  if (!activeInfoModal) return null;

  const closeModal = () => setActiveInfoModal(null);

  const faqItems = [
    {
      q: 'What is mystore’s shipping policy?',
      a: 'We offer free express carbon-neutral shipping on all orders over $100. Standard delivery typically takes 3-5 business days depending on your location.'
    },
    {
      q: 'How do I request a return or exchange?',
      a: 'We accept hassle-free returns within 30 days of receipt. Simply navigate to your account dashboard or contact customer support to receive a prepaid return shipping label.'
    },
    {
      q: 'Are all mystore products sustainably sourced?',
      a: 'Yes! 100% of our materials are organically harvested or recycled, crafted under ethical fair-trade working conditions.'
    },
    {
      q: 'How can I track my order status?',
      a: 'Once your order ships, you will receive an email confirmation with live GPS tracking details and estimated arrival times.'
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept major credit cards (Visa, MasterCard, Amex), Apple Pay, Google Pay, PayPal, and Klarna financing.'
    }
  ];

  return (
    <div className="info-modal-overlay">
      <div className="info-modal-backdrop" onClick={closeModal} />

      <div className="info-modal-card animate-scale-up">
        {/* Modal Header */}
        <div className="info-modal-header">
          <div className="modal-title-group">
            {activeInfoModal === 'profile' && <User className="modal-title-icon profile-theme" size={22} />}
            {activeInfoModal === 'settings' && <Settings className="modal-title-icon settings-theme" size={22} />}
            {activeInfoModal === 'about' && <Info className="modal-title-icon about-theme" size={22} />}
            {activeInfoModal === 'faq' && <HelpCircle className="modal-title-icon faq-theme" size={22} />}
            {activeInfoModal === 'terms' && <FileText className="modal-title-icon terms-theme" size={22} />}

            <h3>
              {activeInfoModal === 'profile' && 'User Profile'}
              {activeInfoModal === 'settings' && 'App Settings'}
              {activeInfoModal === 'about' && 'About mystore'}
              {activeInfoModal === 'faq' && 'Frequently Asked Questions'}
              {activeInfoModal === 'terms' && 'Terms & Conditions'}
            </h3>
          </div>

          <button className="info-modal-close" onClick={closeModal} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="info-modal-body">
          {/* PROFILE VIEW */}
          {activeInfoModal === 'profile' && (
            <div className="modal-section profile-section">
              {user ? (
                <>
                  <div className="profile-header-card">
                    <div className="profile-large-avatar">
                      {(user.full_name || user.name || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)}
                    </div>
                    <div className="profile-header-details">
                      <h4>{user.full_name || user.name}</h4>
                      <p>{user.email}</p>
                      <span className="gold-badge"><Sparkles size={12} /> Gold VIP Tier</span>
                    </div>
                  </div>

                  <div className="profile-grid">
                    <div className="profile-stat-box">
                      <Package size={20} />
                      <div>
                        <span className="stat-number">12</span>
                        <span className="stat-label">Total Orders</span>
                      </div>
                    </div>

                    <div className="profile-stat-box">
                      <Heart size={20} />
                      <div>
                        <span className="stat-number">5</span>
                        <span className="stat-label">Saved Wishlist</span>
                      </div>
                    </div>
                  </div>

                  <div className="profile-details-group">
                    <h5 className="group-heading">Personal Information</h5>
                    <div className="detail-row">
                      <span className="detail-label">Full Name</span>
                      <span className="detail-value">{user.full_name || user.name || '—'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Email Address</span>
                      <span className="detail-value">{user.email}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Membership Since</span>
                      <span className="detail-value">August 2026</span>
                    </div>
                  </div>

                  <button
                    className="modal-primary-btn"
                    onClick={() => {
                      showToast('Profile updated successfully!');
                      closeModal();
                    }}
                  >
                    Save Profile Changes
                  </button>
                </>
              ) : (
                <div className="guest-profile-prompt">
                  <User size={48} className="prompt-icon" />
                  <h4>Not Signed In</h4>
                  <p>Please log in to access your order history, profile preferences, and saved addresses.</p>
                </div>
              )}
            </div>
          )}

          {/* SETTINGS VIEW */}
          {activeInfoModal === 'settings' && (
            <div className="modal-section settings-section">
              <div className="setting-group">
                <h5 className="group-heading">Preferences</h5>

                <div className="setting-toggle-row">
                  <div className="setting-info">
                    <Moon size={18} />
                    <div>
                      <span className="setting-title">Dark Mode</span>
                      <span className="setting-desc">Switch between light and dark theme</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={(e) => setDarkMode(e.target.checked)}
                    className="custom-toggle"
                  />
                </div>

                <div className="setting-toggle-row">
                  <div className="setting-info">
                    <Globe size={18} />
                    <div>
                      <span className="setting-title">Currency</span>
                      <span className="setting-desc">Select preferred shopping currency</span>
                    </div>
                  </div>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="custom-select"
                  >
                    <option value="USD ($)">USD ($)</option>
                    <option value="EUR (€)">EUR (€)</option>
                    <option value="GBP (£)">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="setting-group">
                <h5 className="group-heading">Notifications</h5>

                <div className="setting-toggle-row">
                  <div className="setting-info">
                    <Bell size={18} />
                    <div>
                      <span className="setting-title">Email Notifications</span>
                      <span className="setting-desc">Receive updates about order delivery status</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="custom-toggle"
                  />
                </div>

                <div className="setting-toggle-row">
                  <div className="setting-info">
                    <Shield size={18} />
                    <div>
                      <span className="setting-title">Promotional Offers</span>
                      <span className="setting-desc">Get notified of seasonal discount drops</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={promoAlerts}
                    onChange={(e) => setPromoAlerts(e.target.checked)}
                    className="custom-toggle"
                  />
                </div>
              </div>

              <button
                className="modal-primary-btn"
                onClick={() => {
                  showToast('Settings saved successfully!');
                  closeModal();
                }}
              >
                Save Preferences
              </button>
            </div>
          )}

          {/* ABOUT US VIEW */}
          {activeInfoModal === 'about' && (
            <div className="modal-section about-section">
              <div className="about-hero-card">
                <h4>Empowering Mindful Living</h4>
                <p>
                  At <strong>mystore</strong>, we craft timeless minimalist essentials built from organic and sustainable materials.
                </p>
              </div>

              <div className="about-features-grid">
                <div className="about-feature">
                  <Award size={24} className="feature-icon" />
                  <h5>Ethical Crafting</h5>
                  <p>Hand-crafted in certified zero-emission sustainable facilities.</p>
                </div>

                <div className="about-feature">
                  <Truck size={24} className="feature-icon" />
                  <h5>100% Carbon Neutral</h5>
                  <p>Every order shipment offset with tree planting programs.</p>
                </div>

                <div className="about-feature">
                  <RotateCcw size={24} className="feature-icon" />
                  <h5>Circular Lifetime Warranty</h5>
                  <p>Send back worn products anytime for free recycling & credit.</p>
                </div>
              </div>
            </div>
          )}

          {/* FAQ VIEW */}
          {activeInfoModal === 'faq' && (
            <div className="modal-section faq-section">
              <p className="faq-intro">Have questions? We’re here to help you every step of the way.</p>

              <div className="faq-accordion-list">
                {faqItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`faq-item ${openFaqIndex === idx ? 'open' : ''}`}
                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  >
                    <div className="faq-question-row">
                      <span className="faq-question">{item.q}</span>
                      {openFaqIndex === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                    {openFaqIndex === idx && (
                      <p className="faq-answer animate-fade-in">{item.a}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TERMS & CONDITIONS VIEW */}
          {activeInfoModal === 'terms' && (
            <div className="modal-section terms-section">
              <div className="terms-scroll-box">
                <h4>1. Introduction</h4>
                <p>
                  Welcome to mystore. By accessing or using our website, mobile site, or services, you agree to be bound by these Terms and Conditions.
                </p>

                <h4>2. Privacy & Data Protection</h4>
                <p>
                  We respect your personal privacy. We do not sell or trade user data to third parties. All transactions are processed via 256-bit encrypted SSL payment gateways.
                </p>

                <h4>3. Return & Refund Policy</h4>
                <p>
                  Items may be returned within 30 days of delivery provided they are unworn, in original packaging, and with tags intact.
                </p>

                <h4>4. Intellectual Property</h4>
                <p>
                  All logos, designs, product imagery, and text content on this site are the exclusive property of mystore.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

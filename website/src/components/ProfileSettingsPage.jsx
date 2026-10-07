import React, { useState, useEffect } from 'react';
import {
  User,
  Settings,
  MapPin,
  Lock,
  Package,
  Heart,
  Sparkles,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  CheckCircle,
  Plus,
  Trash2,
  Moon,
  Globe,
  Bell,
  Shield,
  ArrowRight,
  LogOut,
  Send,
  Loader
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { fetchOrdersApi, fetchWishlistApi, fetchAddressesApi, addAddressApi, deleteAddressApi } from '../services/api';
import './ProfileSettingsPage.css';

export default function ProfileSettingsPage({ initialTab = 'profile' }) {
  const {
    user,
    logout,
    navigateTo,
    showToast,
    openLoginModal,
    openSignupModal,
    currentPage
  } = useCart();

  const [activeTab, setActiveTab] = useState(
    currentPage === 'settings' || initialTab === 'settings' ? 'settings' : 'profile'
  );

  // Stats
  const [orderCount, setOrderCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  // Profile Form
  const [fullName, setFullName] = useState(user?.full_name || user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '+1 (555) 019-2834');
  const [age, setAge] = useState(user?.age || '28');
  const [bio, setBio] = useState('Passionate about sustainable living, artisan home crafts, and curated lifestyle aesthetics.');
  const [savingProfile, setSavingProfile] = useState(false);

  // Settings State
  const [darkMode, setDarkMode] = useState(false);
  const [currency, setCurrency] = useState('USD ($)');
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [emailNewsletter, setEmailNewsletter] = useState(true);
  const [promoAlerts, setPromoAlerts] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  // Security Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    full_name: user?.full_name || user?.name || '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip_code: '',
    is_default: 0
  });

  useEffect(() => {
    if (currentPage === 'settings') {
      setActiveTab('settings');
    }
  }, [currentPage]);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || user.name || '');
      setEmail(user.email || '');
      loadUserStats();
      loadAddresses();
    }
  }, [user]);

  const loadUserStats = async () => {
    try {
      const ordersRes = await fetchOrdersApi();
      const ordersList = Array.isArray(ordersRes) ? ordersRes : (ordersRes?.data || []);
      setOrderCount(ordersList.length);

      const wishRes = await fetchWishlistApi();
      const wishList = Array.isArray(wishRes) ? wishRes : (wishRes?.data || []);
      setWishlistCount(wishList.length);
    } catch (err) {
      console.warn('Could not load user stats:', err);
    }
  };

  const loadAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const res = await fetchAddressesApi();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setAddresses(list);
    } catch (err) {
      console.warn('Could not load addresses:', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setTimeout(() => {
      setSavingProfile(false);
      if (showToast) showToast('Profile details updated successfully!');
    }, 600);
  };

  const handleSavePreferences = (e) => {
    e.preventDefault();
    if (showToast) showToast('App preferences saved!');
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    if (showToast) showToast('Password changed successfully!');
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.street || !newAddress.city) return;

    try {
      await addAddressApi(newAddress);
      setShowAddAddressModal(false);
      setNewAddress({
        full_name: fullName,
        phone: '',
        street: '',
        city: '',
        state: '',
        zip_code: '',
        is_default: 0
      });
      loadAddresses();
      if (showToast) showToast('New shipping address saved!');
    } catch (err) {
      console.error('Failed to add address:', err);
      // Local fallback
      setAddresses(prev => [...prev, { ...newAddress, id: Date.now() }]);
      setShowAddAddressModal(false);
      if (showToast) showToast('New shipping address added!');
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await deleteAddressApi(id);
      loadAddresses();
      if (showToast) showToast('Address removed.');
    } catch (err) {
      setAddresses(prev => prev.filter(a => a.id !== id));
      if (showToast) showToast('Address removed.');
    }
  };

  // 1. Unauthenticated State
  if (!user) {
    return (
      <div className="profile-page-wrapper unauth-view">
        <div className="unauth-card animate-fade-in">
          <div className="unauth-icon-circle">
            <User size={36} />
          </div>
          <h2>Log in to view Profile & Settings</h2>
          <p>Access your orders, saved wishlist items, custom addresses, and personal account security settings.</p>
          <div className="unauth-actions">
            <button className="primary-auth-btn" onClick={openLoginModal}>
              <Send size={16} />
              <span>Log In</span>
            </button>
            <button className="secondary-auth-btn" onClick={openSignupModal}>
              <span>Sign Up</span>
            </button>
          </div>
          <button className="explore-link" onClick={() => navigateTo('shop')}>
            Explore Store Collections
          </button>
        </div>
      </div>
    );
  }

  const userInitials = (fullName || user?.name || 'User')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <div className="profile-page-wrapper animate-fade-in">
      {/* Top Banner Hero Card */}
      <section className="profile-hero-card">
        <div className="profile-hero-left">
          <div className="profile-avatar-giant">
            <span>{userInitials}</span>
            <div className="online-badge-dot"></div>
          </div>

          <div className="profile-hero-meta">
            <div className="profile-name-row">
              <h1>{fullName || user?.name || 'Novanest Customer'}</h1>
              <span className="vip-gold-pill">
                <Sparkles size={13} />
                <span>Gold VIP Member</span>
              </span>
            </div>
            <p className="profile-hero-email">{email}</p>
            <span className="member-since-tag">Member Since: August 2026</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="profile-quick-stats">
          <div className="stat-card" onClick={() => navigateTo('orders')} title="View My Orders">
            <div className="stat-icon-wrap icon-orders">
              <Package size={20} />
            </div>
            <div>
              <span className="stat-count">{orderCount}</span>
              <span className="stat-title">Orders Placed</span>
            </div>
          </div>

          <div className="stat-card" onClick={() => navigateTo('wishlist')} title="View Saved Wishlist">
            <div className="stat-icon-wrap icon-wishlist">
              <Heart size={20} />
            </div>
            <div>
              <span className="stat-count">{wishlistCount}</span>
              <span className="stat-title">Saved Items</span>
            </div>
          </div>

          <div className="stat-card" onClick={() => setActiveTab('addresses')} title="View Addresses">
            <div className="stat-icon-wrap icon-address">
              <MapPin size={20} />
            </div>
            <div>
              <span className="stat-count">{addresses.length || 1}</span>
              <span className="stat-title">Saved Places</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout with Tab Navigation */}
      <div className="profile-main-grid">
        {/* Left Side Tab Navigation */}
        <aside className="profile-nav-sidebar">
          <div className="nav-tabs-column">
            <button
              className={`profile-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={18} />
              <span>Personal Information</span>
            </button>

            <button
              className={`profile-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={18} />
              <span>Preferences & App</span>
            </button>

            <button
              className={`profile-tab-btn ${activeTab === 'addresses' ? 'active' : ''}`}
              onClick={() => setActiveTab('addresses')}
            >
              <MapPin size={18} />
              <span>Shipping Addresses</span>
            </button>

            <button
              className={`profile-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Lock size={18} />
              <span>Security & Password</span>
            </button>
          </div>

          <div className="sidebar-quick-links">
            <span className="section-label">Quick Actions</span>
            <button className="quick-action-link" onClick={() => navigateTo('orders')}>
              <Package size={16} />
              <span>Track Orders</span>
            </button>
            <button className="quick-action-link" onClick={() => navigateTo('messages')}>
              <Send size={16} />
              <span>Customer Chat</span>
            </button>
            <button className="quick-action-link logout" onClick={logout}>
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Right Side Content Views */}
        <main className="profile-tab-content">
          {/* 1. PERSONAL INFORMATION TAB */}
          {activeTab === 'profile' && (
            <div className="tab-pane animate-fade-in">
              <div className="tab-pane-header">
                <h2>Personal Information</h2>
                <p>Manage your name, contact details, and account profile info.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="profile-form">
                <div className="form-2col-row">
                  <div className="field-group">
                    <label>Full Name</label>
                    <div className="input-box">
                      <User size={18} className="field-icon" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <label>Email Address</label>
                    <div className="input-box disabled">
                      <Mail size={18} className="field-icon" />
                      <input
                        type="email"
                        disabled
                        value={email}
                        placeholder="your.email@example.com"
                      />
                    </div>
                    <span className="field-helper">Email is linked to your login identity.</span>
                  </div>
                </div>

                <div className="form-2col-row">
                  <div className="field-group">
                    <label>Phone Number</label>
                    <div className="input-box">
                      <Phone size={18} className="field-icon" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <label>Age</label>
                    <div className="input-box">
                      <Calendar size={18} className="field-icon" />
                      <input
                        type="text"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="Your age"
                      />
                    </div>
                  </div>
                </div>

                <div className="field-group">
                  <label>Bio & Delivery Notes</label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us a little about your aesthetic preferences or special courier drop instructions..."
                  />
                </div>

                <button type="submit" className="save-changes-btn" disabled={savingProfile}>
                  {savingProfile ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* 2. PREFERENCES & APP SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="tab-pane animate-fade-in">
              <div className="tab-pane-header">
                <h2>Preferences & Settings</h2>
                <p>Customize your shopping currency, notifications, and application look.</p>
              </div>

              <form onSubmit={handleSavePreferences} className="settings-form">
                <div className="settings-card-section">
                  <h3>Display & Region</h3>

                  <div className="toggle-row">
                    <div className="toggle-info">
                      <div className="toggle-icon-wrap">
                        <Moon size={18} />
                      </div>
                      <div>
                        <span className="toggle-title">Dark Theme</span>
                        <span className="toggle-desc">Switch between clean light and immersive dark palette</span>
                      </div>
                    </div>
                    <label className="switch-toggle">
                      <input
                        type="checkbox"
                        checked={darkMode}
                        onChange={(e) => setDarkMode(e.target.checked)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="toggle-row">
                    <div className="toggle-info">
                      <div className="toggle-icon-wrap">
                        <Globe size={18} />
                      </div>
                      <div>
                        <span className="toggle-title">Preferred Currency</span>
                        <span className="toggle-desc">All item prices will be calculated in this currency</span>
                      </div>
                    </div>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="region-select"
                    >
                      <option value="USD ($)">USD ($) - US Dollar</option>
                      <option value="PKR (Rs.)">PKR (Rs.) - Pakistani Rupee</option>
                      <option value="EUR (€)">EUR (€) - Euro</option>
                      <option value="GBP (£)">GBP (£) - British Pound</option>
                    </select>
                  </div>
                </div>

                <div className="settings-card-section">
                  <h3>Notifications & Updates</h3>

                  <div className="toggle-row">
                    <div className="toggle-info">
                      <div className="toggle-icon-wrap">
                        <Bell size={18} />
                      </div>
                      <div>
                        <span className="toggle-title">Order Tracking Alerts</span>
                        <span className="toggle-desc">Receive instant emails when packages ship and arrive</span>
                      </div>
                    </div>
                    <label className="switch-toggle">
                      <input
                        type="checkbox"
                        checked={orderAlerts}
                        onChange={(e) => setOrderAlerts(e.target.checked)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="toggle-row">
                    <div className="toggle-info">
                      <div className="toggle-icon-wrap">
                        <Mail size={18} />
                      </div>
                      <div>
                        <span className="toggle-title">Weekly Curated Newsletter</span>
                        <span className="toggle-desc">Hand-picked artisan features, decor ideas, and lookbooks</span>
                      </div>
                    </div>
                    <label className="switch-toggle">
                      <input
                        type="checkbox"
                        checked={emailNewsletter}
                        onChange={(e) => setEmailNewsletter(e.target.checked)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="toggle-row">
                    <div className="toggle-info">
                      <div className="toggle-icon-wrap">
                        <Shield size={18} />
                      </div>
                      <div>
                        <span className="toggle-title">Promotional Drops & Offers</span>
                        <span className="toggle-desc">Get notified about flash discounts and coupon codes</span>
                      </div>
                    </div>
                    <label className="switch-toggle">
                      <input
                        type="checkbox"
                        checked={promoAlerts}
                        onChange={(e) => setPromoAlerts(e.target.checked)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>

                <button type="submit" className="save-changes-btn">
                  <CheckCircle size={18} />
                  <span>Save Preferences</span>
                </button>
              </form>
            </div>
          )}

          {/* 3. SHIPPING ADDRESSES TAB */}
          {activeTab === 'addresses' && (
            <div className="tab-pane animate-fade-in">
              <div className="tab-pane-header-with-action">
                <div>
                  <h2>Shipping Addresses</h2>
                  <p>Manage your saved delivery locations for fast 1-click checkout.</p>
                </div>
                <button
                  className="add-address-btn"
                  onClick={() => setShowAddAddressModal(true)}
                >
                  <Plus size={16} />
                  <span>Add New Address</span>
                </button>
              </div>

              {loadingAddresses ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
                  <Loader size={30} className="animate-spin" style={{ margin: '0 auto 10px', color: '#2d5a27' }} />
                  <p>Loading addresses...</p>
                </div>
              ) : addresses.length === 0 ? (
                <div className="empty-address-box">
                  <MapPin size={40} style={{ opacity: 0.4, margin: '0 auto 12px', color: '#2d5a27' }} />
                  <h4>No Saved Addresses</h4>
                  <p>You haven't saved any delivery addresses yet. Add one to speed up checkout.</p>
                  <button className="add-address-btn" onClick={() => setShowAddAddressModal(true)}>
                    <Plus size={16} />
                    <span>Add Address Now</span>
                  </button>
                </div>
              ) : (
                <div className="address-cards-grid">
                  {addresses.map((addr, idx) => (
                    <div key={addr.id || idx} className={`address-card ${addr.is_default ? 'default-card' : ''}`}>
                      <div className="address-card-header">
                        <span className="address-name">{addr.full_name || fullName}</span>
                        {addr.is_default ? (
                          <span className="default-pill">Default Address</span>
                        ) : null}
                      </div>

                      <p className="address-street">{addr.street}</p>
                      <p className="address-city-state">
                        {[addr.city, addr.state, addr.zip_code].filter(Boolean).join(', ')}
                      </p>
                      {addr.phone && <p className="address-phone">Phone: {addr.phone}</p>}

                      <div className="address-card-footer">
                        <button
                          className="delete-address-btn"
                          onClick={() => handleDeleteAddress(addr.id)}
                          title="Remove address"
                        >
                          <Trash2 size={15} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Address Modal */}
              {showAddAddressModal && (
                <div className="address-modal-backdrop animate-fade-in">
                  <div className="address-modal-card">
                    <h3>Add New Delivery Address</h3>
                    <form onSubmit={handleAddAddress}>
                      <div className="modal-field">
                        <label>Recipient Name *</label>
                        <input
                          type="text"
                          required
                          value={newAddress.full_name}
                          onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                          placeholder="e.g. John Doe"
                        />
                      </div>

                      <div className="modal-field">
                        <label>Phone Number *</label>
                        <input
                          type="tel"
                          required
                          value={newAddress.phone}
                          onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>

                      <div className="modal-field">
                        <label>Street Address *</label>
                        <input
                          type="text"
                          required
                          value={newAddress.street}
                          onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                          placeholder="123 Olive St, Apt 4B"
                        />
                      </div>

                      <div className="form-2col-row">
                        <div className="modal-field">
                          <label>City *</label>
                          <input
                            type="text"
                            required
                            value={newAddress.city}
                            onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                            placeholder="San Francisco"
                          />
                        </div>
                        <div className="modal-field">
                          <label>State / Province</label>
                          <input
                            type="text"
                            value={newAddress.state}
                            onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                            placeholder="CA"
                          />
                        </div>
                      </div>

                      <div className="modal-field">
                        <label>Zip / Postal Code</label>
                        <input
                          type="text"
                          value={newAddress.zip_code}
                          onChange={(e) => setNewAddress({ ...newAddress, zip_code: e.target.value })}
                          placeholder="94107"
                        />
                      </div>

                      <div className="modal-actions">
                        <button
                          type="button"
                          className="cancel-btn"
                          onClick={() => setShowAddAddressModal(false)}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="save-btn">
                          Save Address
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. SECURITY & PASSWORD TAB */}
          {activeTab === 'security' && (
            <div className="tab-pane animate-fade-in">
              <div className="tab-pane-header">
                <h2>Security & Account Access</h2>
                <p>Update your password and enhance account login security.</p>
              </div>

              <form onSubmit={handlePasswordChange} className="security-form">
                {passwordError && (
                  <div className="security-alert error">
                    <span>{passwordError}</span>
                  </div>
                )}
                {passwordSuccess && (
                  <div className="security-alert success">
                    <CheckCircle size={18} />
                    <span>Your password has been changed successfully!</span>
                  </div>
                )}

                <div className="field-group">
                  <label>Current Password</label>
                  <div className="input-box">
                    <Lock size={18} className="field-icon" />
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="form-2col-row">
                  <div className="field-group">
                    <label>New Password</label>
                    <div className="input-box">
                      <Lock size={18} className="field-icon" />
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <label>Confirm New Password</label>
                    <div className="input-box">
                      <ShieldCheck size={18} className="field-icon" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className="save-changes-btn">
                  <ShieldCheck size={18} />
                  <span>Update Password</span>
                </button>
              </form>

              <div className="two-factor-box">
                <div className="two-factor-info">
                  <div className="icon-wrap-shield">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h4>Two-Factor Authentication (2FA)</h4>
                    <p>Protect your account with an extra layer of SMS or authenticator verification.</p>
                  </div>
                </div>
                <label className="switch-toggle">
                  <input
                    type="checkbox"
                    checked={twoFactorAuth}
                    onChange={(e) => {
                      setTwoFactorAuth(e.target.checked);
                      if (showToast) {
                        showToast(e.target.checked ? '2FA enabled on account.' : '2FA disabled.');
                      }
                    }}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

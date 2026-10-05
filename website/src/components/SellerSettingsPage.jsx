import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import {
  Palette,
  User,
  Bell,
  Lock,
  Store,
  Mail,
  Phone,
  Save,
  Check
} from 'lucide-react';
import './SellerSettingsPage.css';

export default function SellerSettingsPage() {
  const { showToast, darkMode, toggleDarkMode } = useCart();


  // Communication Toggles
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [customerMessages, setCustomerMessages] = useState(true);
  const [promoAlerts, setPromoAlerts] = useState(false);

  // Profile Fields
  const [storeName, setStoreName] = useState('Novanest');
  const [contactEmail, setContactEmail] = useState('bishophea024@gmail.com');
  const [phoneNumber, setPhoneNumber] = useState('+1 (555) 000-0000');

  // Security Fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSave = () => {
    showToast('Settings saved successfully!');
  };

  const handleDiscard = () => {
    setStoreName('Novanest');
    setContactEmail('bishophea024@gmail.com');
    setPhoneNumber('+1 (555) 000-0000');
    setCurrentPassword('');
    setNewPassword('');
    showToast('Changes discarded');
  };

  return (
    <div className="seller-settings-page animate-fade-in">
      {/* Header */}
      <div className="settings-main-header">
        <div>
          <h1 className="settings-page-title">Settings Overview</h1>
          <p className="settings-page-subtitle">
            Manage your store's appearance, notifications, and core profile details.
          </p>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="settings-two-col-grid">
        {/* ═══ LEFT COLUMN ═══ */}
        <div className="settings-left-col">
          {/* Theme Preferences Card */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-icon-circle green">
                <Palette size={18} />
              </div>
              <div>
                <h3>Theme Preferences</h3>
                <p>Customize your workspace</p>
              </div>
            </div>

            <div className="theme-picker-row">
              <div
                className={`theme-option ${!darkMode ? 'selected' : ''}`}
                onClick={() => toggleDarkMode(false)}
              >
                <div className="theme-preview light-preview">
                  <div className="tp-bar"></div>
                  <div className="tp-bar short"></div>
                  <div className="tp-bar"></div>
                </div>
                <span className="theme-label">
                  Light Mode
                  {!darkMode && <Check size={14} className="check-icon" />}
                </span>
              </div>

              <div
                className={`theme-option ${darkMode ? 'selected' : ''}`}
                onClick={() => toggleDarkMode(true)}
              >
                <div className="theme-preview dark-preview">
                  <div className="tp-bar"></div>
                  <div className="tp-bar short"></div>
                  <div className="tp-bar"></div>
                </div>
                <span className="theme-label">
                  Dark Mode
                  {darkMode && <Check size={14} className="check-icon" />}
                </span>
              </div>
            </div>
          </div>

          {/* Communication Card */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-icon-circle blue">
                <Bell size={18} />
              </div>
              <div>
                <h3>Communication</h3>
                <p>Alerts and updates</p>
              </div>
            </div>

            <div className="toggle-list">
              <div className="toggle-row">
                <div>
                  <strong>Order Updates</strong>
                  <span>Status changes & fulfillment</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={orderUpdates}
                    onChange={() => setOrderUpdates(!orderUpdates)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="toggle-divider"></div>

              <div className="toggle-row">
                <div>
                  <strong>Customer Messages</strong>
                  <span>Inquiries & disputes</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={customerMessages}
                    onChange={() => setCustomerMessages(!customerMessages)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="toggle-divider"></div>

              <div className="toggle-row">
                <div>
                  <strong>Promotional Alerts</strong>
                  <span>Platform news & offers</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={promoAlerts}
                    onChange={() => setPromoAlerts(!promoAlerts)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT COLUMN ═══ */}
        <div className="settings-right-col">
          {/* Profile Management Card */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-icon-circle olive">
                <User size={18} />
              </div>
              <div>
                <h3>Profile Management</h3>
                <p>Update your public store information</p>
              </div>
            </div>

            <div className="form-fields">
              <div className="field-group full">
                <label>Store Name</label>
                <div className="input-with-icon">
                  <Store size={16} className="field-icon" />
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                  />
                </div>
              </div>

              <div className="field-row-2col">
                <div className="field-group">
                  <label>Contact Email</label>
                  <div className="input-with-icon">
                    <Mail size={16} className="field-icon" />
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="field-group">
                  <label>Phone Number</label>
                  <div className="input-with-icon">
                    <Phone size={16} className="field-icon" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Security Sub-Section */}
            <div className="security-section">
              <h4 className="security-title">Security</h4>
              <p className="security-subtitle">Manage your authentication credentials.</p>

              <div className="security-fields-card">
                <div className="field-group full">
                  <label>Current Password</label>
                  <div className="input-with-icon">
                    <Lock size={16} className="field-icon" />
                    <input
                      type="password"
                      value={currentPassword}
                      placeholder="••••••••"
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="field-group full">
                  <label>New Password</label>
                  <div className="input-with-icon">
                    <Lock size={16} className="field-icon" />
                    <input
                      type="password"
                      value={newPassword}
                      placeholder="Minimum 8 characters"
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="settings-action-bar">
        <button className="discard-btn" onClick={handleDiscard}>Discard</button>
        <button className="save-changes-btn" onClick={handleSave}>
          <Save size={16} />
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  );
}

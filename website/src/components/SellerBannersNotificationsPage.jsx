import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import {
  Image,
  Upload,
  Trash2,
  Bell,
  Send,
  Users,
  User,
  ChevronDown,
  X,
  Search,
  Plus
} from 'lucide-react';
import './SellerBannersNotificationsPage.css';

const DEMO_USERS = [
  { id: 'u1', name: 'Eleanor Vance', email: 'eleanor@example.com', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80' },
  { id: 'u2', name: 'Marcus Thorne', email: 'marcus@example.com', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80' },
  { id: 'u3', name: 'Sarah Williams', email: 'sarah@example.com', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80' },
  { id: 'u4', name: 'Thomas Chen', email: 'thomas@example.com', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80' },
  { id: 'u5', name: 'Emily Davis', email: 'emily@example.com', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&auto=format&fit=crop&q=80' },
];

export default function SellerBannersNotificationsPage() {
  const { showToast } = useCart();

  // ─── Banner State ───
  const [banners, setBanners] = useState([
    { id: 1, url: '', file: null, preview: null },
    { id: 2, url: '', file: null, preview: null },
  ]);

  // ─── Notification State ───
  const [notifSubject, setNotifSubject] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifTarget, setNotifTarget] = useState('all'); // 'all' | 'specific'
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [sentNotifications, setSentNotifications] = useState([
    { id: 'n1', subject: 'Flash Sale - 40% Off All Items!', target: 'All Users', date: 'Oct 23, 2023', status: 'Delivered' },
    { id: 'n2', subject: 'Your order has been shipped', target: 'Eleanor Vance', date: 'Oct 22, 2023', status: 'Delivered' },
    { id: 'n3', subject: 'New arrivals in store', target: 'All Users', date: 'Oct 20, 2023', status: 'Delivered' },
  ]);

  // ─── Banner Handlers ───
  const handleBannerFileChange = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setBanners((prev) =>
        prev.map((b, i) =>
          i === index ? { ...b, file, preview: ev.target.result } : b
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBanner = (index) => {
    setBanners((prev) =>
      prev.map((b, i) =>
        i === index ? { ...b, file: null, preview: null, url: '' } : b
      )
    );
  };

  const handleSaveBanners = () => {
    showToast('Banners saved successfully!');
  };

  // ─── Notification Handlers ───
  const handleToggleUser = (user) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u.id === user.id);
      if (exists) return prev.filter((u) => u.id !== user.id);
      return [...prev, user];
    });
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const filteredUsers = DEMO_USERS.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  ).filter((u) => !selectedUsers.find((s) => s.id === u.id));

  const handleSendNotification = () => {
    if (!notifSubject.trim()) {
      showToast('Please enter a notification subject');
      return;
    }
    if (!notifBody.trim()) {
      showToast('Please enter a notification body');
      return;
    }
    if (notifTarget === 'specific' && selectedUsers.length === 0) {
      showToast('Please select at least one user');
      return;
    }

    const targetLabel = notifTarget === 'all'
      ? 'All Users'
      : selectedUsers.map((u) => u.name).join(', ');

    setSentNotifications((prev) => [
      {
        id: `n${Date.now()}`,
        subject: notifSubject,
        target: targetLabel,
        date: 'Just now',
        status: 'Sending...',
      },
      ...prev,
    ]);

    showToast(`Notification sent to ${targetLabel}`);
    setNotifSubject('');
    setNotifBody('');
    setSelectedUsers([]);
  };

  return (
    <div className="banners-notif-page animate-fade-in">
      {/* Header */}
      <div className="bn-page-header">
        <div>
          <h1 className="page-title">Banners & Notifications</h1>
          <p className="page-subtitle">Manage promotional banners and send push notifications to your customers.</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="bn-two-col-grid">
        {/* ═══ LEFT: Banners ═══ */}
        <div className="bn-section-card">
          <div className="bn-card-header">
            <div className="bn-icon-circle green">
              <Image size={18} />
            </div>
            <div>
              <h3>Promotional Banners</h3>
              <p>Upload up to 2 banners displayed on the storefront homepage.</p>
            </div>
          </div>

          <div className="banners-upload-grid">
            {banners.map((banner, idx) => (
              <div key={banner.id} className="banner-slot">
                <label className="banner-slot-label">Banner {idx + 1}</label>
                {banner.preview ? (
                  <div className="banner-preview-wrap">
                    <img src={banner.preview} alt={`Banner ${idx + 1}`} className="banner-preview-img" />
                    <button className="banner-remove-btn" onClick={() => handleRemoveBanner(idx)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="banner-upload-zone" htmlFor={`banner-input-${idx}`}>
                    <Upload size={28} className="upload-icon" />
                    <span className="upload-text">Click to upload</span>
                    <span className="upload-hint">PNG, JPG up to 2MB · Recommended: 1200×400</span>
                    <input
                      id={`banner-input-${idx}`}
                      type="file"
                      accept="image/*"
                      className="hidden-file-input"
                      onChange={(e) => handleBannerFileChange(idx, e)}
                    />
                  </label>
                )}
              </div>
            ))}
          </div>

          <div className="bn-card-footer">
            <button className="bn-save-btn" onClick={handleSaveBanners}>
              Save Banners
            </button>
          </div>
        </div>

        {/* ═══ RIGHT: Send Notification ═══ */}
        <div className="bn-section-card">
          <div className="bn-card-header">
            <div className="bn-icon-circle amber">
              <Bell size={18} />
            </div>
            <div>
              <h3>Send Notification</h3>
              <p>Push a notification to specific or all users.</p>
            </div>
          </div>

          {/* Target Selector */}
          <div className="notif-target-row">
            <label className="notif-field-label">Send To</label>
            <div className="target-toggle-pills">
              <button
                className={`target-pill ${notifTarget === 'all' ? 'active' : ''}`}
                onClick={() => { setNotifTarget('all'); setSelectedUsers([]); }}
              >
                <Users size={14} />
                <span>All Users</span>
              </button>
              <button
                className={`target-pill ${notifTarget === 'specific' ? 'active' : ''}`}
                onClick={() => setNotifTarget('specific')}
              >
                <User size={14} />
                <span>Specific Users</span>
              </button>
            </div>
          </div>

          {/* User Selector (only if specific) */}
          {notifTarget === 'specific' && (
            <div className="specific-users-block">
              {/* Selected Users Tags */}
              {selectedUsers.length > 0 && (
                <div className="selected-users-tags">
                  {selectedUsers.map((u) => (
                    <span key={u.id} className="user-tag">
                      <img src={u.avatar} alt="" className="tag-avatar" />
                      {u.name}
                      <button onClick={() => handleRemoveUser(u.id)} className="tag-remove">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Search + Dropdown */}
              <div className="user-search-wrap">
                <Search size={15} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={userSearchQuery}
                  onChange={(e) => { setUserSearchQuery(e.target.value); setShowUserDropdown(true); }}
                  onFocus={() => setShowUserDropdown(true)}
                />
              </div>

              {showUserDropdown && filteredUsers.length > 0 && (
                <div className="user-dropdown-list">
                  {filteredUsers.map((u) => (
                    <div
                      key={u.id}
                      className="user-dropdown-item"
                      onClick={() => { handleToggleUser(u); setShowUserDropdown(false); setUserSearchQuery(''); }}
                    >
                      <img src={u.avatar} alt="" className="dropdown-avatar" />
                      <div>
                        <strong>{u.name}</strong>
                        <span>{u.email}</span>
                      </div>
                      <Plus size={14} className="add-icon" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Subject */}
          <div className="notif-field">
            <label className="notif-field-label">Subject</label>
            <input
              type="text"
              className="notif-input"
              placeholder="e.g. Flash Sale - 40% Off All Items!"
              value={notifSubject}
              onChange={(e) => setNotifSubject(e.target.value)}
            />
          </div>

          {/* Body */}
          <div className="notif-field">
            <label className="notif-field-label">Body</label>
            <textarea
              className="notif-textarea"
              rows="5"
              placeholder="Write your notification message here..."
              value={notifBody}
              onChange={(e) => setNotifBody(e.target.value)}
            />
          </div>

          <div className="bn-card-footer">
            <button className="bn-send-btn" onClick={handleSendNotification}>
              <Send size={15} />
              <span>Send Notification</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Notification History Table ═══ */}
      <div className="bn-section-card mt-28">
        <div className="bn-card-header">
          <div className="bn-icon-circle purple">
            <Bell size={18} />
          </div>
          <div>
            <h3>Notification History</h3>
            <p>Recently sent push notifications.</p>
          </div>
        </div>

        <div className="notif-history-table-wrap">
          <table className="notif-history-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Target</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sentNotifications.map((n) => (
                <tr key={n.id}>
                  <td className="notif-subject-cell">{n.subject}</td>
                  <td className="notif-target-cell">{n.target}</td>
                  <td className="notif-date-cell">{n.date}</td>
                  <td>
                    <span className={`notif-status-badge ${n.status === 'Delivered' ? 'delivered' : 'sending'}`}>
                      {n.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

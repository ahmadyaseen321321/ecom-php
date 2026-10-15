import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useSocket } from '../context/SocketContext';
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
  Plus,
  Loader2
} from 'lucide-react';
import {
  fetchBanners,
  saveBannerApi,
  deleteBannerApi,
  fetchSellerProductsApi,
  getImageUrl
} from '../services/api';
import './SellerBannersNotificationsPage.css';

const DEMO_USERS = [
  { id: 'u1', name: 'Eleanor Vance', email: 'eleanor@example.com', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80' },
  { id: 'u2', name: 'Marcus Thorne', email: 'marcus@example.com', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80' },
  { id: 'u3', name: 'Sarah Williams', email: 'sarah@example.com', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80' },
  { id: 'u4', name: 'Thomas Chen', email: 'thomas@example.com', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80' },
  { id: 'u5', name: 'Emily Davis', email: 'emily@example.com', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&auto=format&fit=crop&q=80' },
];

const MAX_BANNER_BYTES = 8 * 1024 * 1024; // matches PHP cap

const emptySlot = (slot) => ({
  slot,
  id: null,
  image_url: '',
  file: null,
  preview: null,
  clear_image: false,
  badge_text: '',
  title: '',
  subtitle: '',
  button_text: '',
  link_type: 'none',
  product_id: '',
  link: '',
});

const SLOT_META = [
  { slot: 1, name: 'Banner 1 — Homepage Hero', hint: 'Top banner on the homepage (dark hero card)' },
  { slot: 2, name: 'Banner 2 — Homepage Promo', hint: 'Second promo banner below the hero' },
];

export default function SellerBannersNotificationsPage() {
  const { showToast } = useCart();
  const { emitNotification } = useSocket();

  // ─── Banner State ───
  const [banners, setBanners] = useState([emptySlot(1), emptySlot(2)]);
  const [isBannersLoading, setIsBannersLoading] = useState(true);
  const [isSavingBanners, setIsSavingBanners] = useState(false);
  const [myProducts, setMyProducts] = useState([]);

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

  // Load saved banners + seller's products (for the button product link)
  useEffect(() => {
    let alive = true;
    Promise.allSettled([fetchBanners(), fetchSellerProductsApi()]).then(([bannersRes, productsRes]) => {
      if (!alive) return;
      if (bannersRes.status === 'fulfilled' && Array.isArray(bannersRes.value)) {
        const rows = bannersRes.value;
        setBanners([1, 2].map((slot) => {
          const row = rows.find((r) => Number(r.slot) === slot);
          if (!row) return emptySlot(slot);
          return {
            slot,
            id: row.id,
            image_url: row.image_url || '',
            file: null,
            preview: null,
            clear_image: false,
            badge_text: row.badge_text || '',
            title: row.title || '',
            subtitle: row.subtitle || '',
            button_text: row.button_text || '',
            link_type: row.link_type || 'none',
            product_id: row.product_id || '',
            link: row.link || '',
          };
        }));
      }
      if (productsRes.status === 'fulfilled' && Array.isArray(productsRes.value)) {
        setMyProducts(productsRes.value);
      }
      setIsBannersLoading(false);
    });
    return () => { alive = false; };
  }, []);

  // ─── Banner Handlers ───
  const updateSlot = (index, patch) => {
    setBanners((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  };

  const handleBannerFileChange = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Banner must be an image file (PNG, JPG, WEBP)');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_BANNER_BYTES) {
      showToast('Banner image must be smaller than 8MB');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const img = new window.Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const ratio = w / Math.max(1, h);

        // Strict 3:1 panoramic aspect ratio (tolerance: 2.6:1 to 3.4:1)
        if (w < 1000 || h < 300) {
          showToast(`Image resolution too small (${w}×${h}px). Banner requires at least 1000px width by 300px height.`, 'error');
          e.target.value = '';
          return;
        }

        if (ratio < 2.6 || ratio > 3.4) {
          showToast(
            `Invalid aspect ratio (${ratio.toFixed(2)}:1). Only 3:1 ratio banner images (e.g. 1200×400 or 1500×500) are accepted. Your image was ${w}×${h}px.`,
            'error'
          );
          e.target.value = '';
          return;
        }

        updateSlot(index, {
          file,
          preview: dataUrl,
          clear_image: false,
          dimensions: `${w}×${h}`,
          aspectRatio: `${ratio.toFixed(2)}:1`,
        });
        showToast(`Image accepted (${w}×${h}px, ${ratio.toFixed(2)}:1 ratio)`);
      };
      img.onerror = () => {
        showToast('Could not decode the selected image file', 'error');
        e.target.value = '';
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBannerImage = (index) => {
    const b = banners[index];
    updateSlot(index, {
      file: null,
      preview: null,
      image_url: '',
      clear_image: Boolean(b.id && b.image_url),
    });
  };

  const handleDeleteBanner = async (index) => {
    const b = banners[index];
    try {
      if (b.id) {
        await deleteBannerApi(b.slot);
      }
      setBanners((prev) => prev.map((x, i) => (i === index ? emptySlot(b.slot) : x)));
      showToast(`Banner ${b.slot} removed — homepage shows the default design`);
    } catch (err) {
      showToast('Could not remove the banner');
    }
  };

  const handleSaveBanners = async () => {
    // Validate + collect slots that have any content
    const toSave = [];
    for (let i = 0; i < banners.length; i++) {
      const b = banners[i];
      const hasContent = b.title.trim() || b.subtitle.trim() || b.badge_text.trim() ||
        b.button_text.trim() || b.file || b.image_url;
      if (!hasContent) continue;

      if (!b.title.trim()) {
        showToast(`Add a headline for Banner ${b.slot}`);
        return;
      }
      if (b.link_type === 'product' && !b.product_id) {
        showToast(`Pick a product for Banner ${b.slot}'s button`);
        return;
      }
      if (b.link_type === 'url' && !b.link.trim()) {
        showToast(`Enter a URL for Banner ${b.slot}'s button`);
        return;
      }
      toSave.push(b);
    }

    if (toSave.length === 0) {
      showToast('Add a headline or image to a banner first');
      return;
    }

    setIsSavingBanners(true);
    try {
      const savedRows = [];
      for (const b of toSave) {
        const res = await saveBannerApi({
          slot: b.slot,
          badge_text: b.badge_text.trim(),
          title: b.title.trim(),
          subtitle: b.subtitle.trim(),
          button_text: b.button_text.trim(),
          link_type: b.link_type,
          product_id: b.link_type === 'product' ? b.product_id : null,
          link: b.link_type === 'url' ? b.link.trim() : '',
          file: b.file,
          clear_image: b.clear_image,
        });
        if (res && res.id) savedRows.push(res);
      }

      // Refresh slot state from server rows
      setBanners((prev) => prev.map((b) => {
        const saved = savedRows.find((r) => Number(r.slot) === b.slot);
        if (!saved) return b;
        return {
          ...b,
          id: saved.id,
          image_url: saved.image_url || '',
          file: null,
          preview: null,
          clear_image: false,
          badge_text: saved.badge_text || '',
          title: saved.title || '',
          subtitle: saved.subtitle || '',
          button_text: saved.button_text || '',
          link_type: saved.link_type || 'none',
          product_id: saved.product_id || '',
          link: saved.link || '',
        };
      }));
      showToast('Banners saved — homepage updated!');
    } catch (err) {
      showToast(err?.message || 'Failed to save banners');
    } finally {
      setIsSavingBanners(false);
    }
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

    // Emit Real-Time Broadcast / Targeted Notification via Socket.IO
    emitNotification({
      type: 'promo',
      title: notifSubject,
      message: notifBody,
      targetRole: notifTarget === 'all' ? null : null,
      targetUserId: notifTarget === 'specific' && selectedUsers.length === 1 ? selectedUsers[0].id : null
    });

    setSentNotifications((prev) => [
      {
        id: `n${Date.now()}`,
        subject: notifSubject,
        target: targetLabel,
        date: 'Just now',
        status: 'Delivered',
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
              <p>These replace the two homepage banners. Buyers clicking the button open your linked product.</p>
            </div>
          </div>

          {isBannersLoading ? (
            <div className="bn-banners-loading">
              <Loader2 size={20} className="animate-spin" />
              <span>Loading banners…</span>
            </div>
          ) : (
            <div className="banners-upload-grid">
              {banners.map((banner, idx) => {
                const displayImage = banner.preview || (banner.image_url ? getImageUrl(banner.image_url) : null);
                const linkedProduct = myProducts.find((p) => String(p.id) === String(banner.product_id));
                return (
                  <div key={banner.slot} className="banner-slot">
                    <div className="banner-slot-head">
                      <label className="banner-slot-label">{SLOT_META[idx].name}</label>
                      {banner.id && (
                        <button className="banner-slot-delete" onClick={() => handleDeleteBanner(idx)}>
                          <Trash2 size={12} />
                          <span>Remove banner</span>
                        </button>
                      )}
                    </div>
                    <p className="banner-slot-hint">{SLOT_META[idx].hint}</p>

                    {displayImage ? (
                      <div className="banner-preview-wrap">
                        {/* Live preview: image + the text buyers will see */}
                        <div className="banner-live-preview">
                          <img src={displayImage} alt={`Banner ${banner.slot}`} className="banner-preview-img" />
                          <div className="blp-overlay">
                            {banner.badge_text.trim() && <span className="blp-badge">{banner.badge_text}</span>}
                            {banner.title.trim() && <span className="blp-title">{banner.title}</span>}
                            {(banner.button_text.trim() || linkedProduct) && (
                              <span className="blp-btn">{banner.button_text.trim() || 'Shop Now'}</span>
                            )}
                          </div>
                        </div>
                        <div className="banner-ratio-badge">
                          ✓ 3:1 Ratio {banner.dimensions ? `(${banner.dimensions})` : 'Verified'}
                        </div>
                        <button className="banner-remove-btn" onClick={() => handleRemoveBannerImage(idx)} title="Remove image">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="banner-upload-zone" htmlFor={`banner-input-${idx}`}>
                        <Upload size={28} className="upload-icon" />
                        <span className="upload-text">Click to upload banner</span>
                        <span className="upload-hint">
                          <strong>Strict 3:1 Ratio Required</strong> (e.g. 1200×400 or 1500×500)
                        </span>
                        <span className="upload-subhint">
                          Min width: 1000px · Min height: 300px · Max 8MB
                        </span>
                        <input
                          id={`banner-input-${idx}`}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden-file-input"
                          onChange={(e) => handleBannerFileChange(idx, e)}
                        />
                      </label>
                    )}

                    {/* ── Text overlay fields ── */}
                    <div className="banner-text-fields">
                      <div className="banner-field">
                        <label>Badge / Tag Text</label>
                        <input
                          type="text"
                          maxLength={60}
                          placeholder="e.g. SUSTAINABLE COLLECTION"
                          value={banner.badge_text}
                          onChange={(e) => updateSlot(idx, { badge_text: e.target.value })}
                        />
                      </div>
                      <div className="banner-field">
                        <label>Headline *</label>
                        <input
                          type="text"
                          maxLength={120}
                          placeholder="e.g. TIMELESS | ESSENTIALS."
                          value={banner.title}
                          onChange={(e) => updateSlot(idx, { title: e.target.value })}
                        />
                        <span className="banner-field-hint">Use “|” to split into two lines with the second highlighted.</span>
                      </div>
                      <div className="banner-field">
                        <label>Description</label>
                        <textarea
                          rows={2}
                          maxLength={220}
                          placeholder="Short line shown under the headline…"
                          value={banner.subtitle}
                          onChange={(e) => updateSlot(idx, { subtitle: e.target.value })}
                        />
                      </div>
                      <div className="banner-field">
                        <label>Button Text</label>
                        <input
                          type="text"
                          maxLength={50}
                          placeholder="e.g. Shop the Collection"
                          value={banner.button_text}
                          onChange={(e) => updateSlot(idx, { button_text: e.target.value })}
                        />
                      </div>

                      {/* ── Button link target ── */}
                      <div className="banner-field banner-link-field">
                        <label>Button Link</label>
                        <div className="banner-link-pills">
                          {[
                            { v: 'product', l: 'Product' },
                            { v: 'url', l: 'Custom URL' },
                            { v: 'none', l: 'Default' },
                          ].map((opt) => (
                            <button
                              key={opt.v}
                              type="button"
                              className={`banner-link-pill ${banner.link_type === opt.v ? 'active' : ''}`}
                              onClick={() => updateSlot(idx, { link_type: opt.v })}
                            >
                              {opt.l}
                            </button>
                          ))}
                        </div>
                        {banner.link_type === 'product' && (
                          <select
                            className="banner-product-select"
                            value={banner.product_id}
                            onChange={(e) => updateSlot(idx, { product_id: e.target.value })}
                          >
                            <option value="">— Select one of your products —</option>
                            {myProducts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} — Rs. {Number(p.price || 0).toLocaleString()}
                              </option>
                            ))}
                          </select>
                        )}
                        {banner.link_type === 'url' && (
                          <input
                            type="text"
                            placeholder="https://… or #section-id"
                            value={banner.link}
                            onChange={(e) => updateSlot(idx, { link: e.target.value })}
                          />
                        )}
                        {banner.link_type === 'none' && (
                          <span className="banner-field-hint">Button scrolls to the product sections.</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="bn-card-footer">
            <button className="bn-save-btn" onClick={handleSaveBanners} disabled={isSavingBanners || isBannersLoading}>
              {isSavingBanners ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Saving…</span>
                </>
              ) : (
                'Save Banners'
              )}
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

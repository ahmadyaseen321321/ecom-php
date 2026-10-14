import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { fetchProfileApi, updateProfileApi, getImageUrl } from '../services/api';
import {
  ArrowLeft,
  Camera,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  User as UserIcon,
  CheckCircle2
} from 'lucide-react';
import './SellerProfilePage.css';

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=240&auto=format&fit=crop';
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export default function SellerProfilePage({ onBack }) {
  const { user, updateUser, showToast } = useCart();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('seller');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Prefill from the stored user instantly, then refresh from the API
  useEffect(() => {
    let alive = true;
    setFullName(user?.full_name || '');
    setEmail(user?.email || '');
    setPhone(user?.phone || '');
    setRole(user?.role || 'seller');
    setAvatarUrl(user?.profile_image || user?.avatar || '');

    fetchProfileApi()
      .then((p) => {
        if (!alive || !p || !p.id) return;
        setFullName(p.full_name || '');
        setEmail(p.email || '');
        setPhone(p.phone || '');
        setRole(p.role || 'seller');
        setAvatarUrl(p.profile_image || '');
      })
      .catch(() => {
        // keep the local fallback values
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAvatarPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please choose an image file');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      showToast('Avatar must be smaller than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarFile(file);
      setAvatarPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      showToast('Please enter your full name');
      return;
    }
    setIsSaving(true);
    try {
      const res = await updateProfileApi({
        fullName: fullName.trim(),
        phone: phone.trim(),
        file: avatarFile,
      });
      const newImage = avatarFile ? (res?.profile_image || avatarUrl) : avatarUrl;
      updateUser({
        full_name: fullName.trim(),
        phone: phone.trim(),
        ...(avatarFile && res?.profile_image ? { profile_image: res.profile_image } : {}),
      });
      if (avatarFile && res?.profile_image) setAvatarUrl(res.profile_image);
      setAvatarFile(null);
      setAvatarPreview(null);
      showToast('Profile updated successfully');
    } catch (err) {
      showToast(err?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const displayAvatar = avatarPreview || (avatarUrl ? getImageUrl(avatarUrl) : FALLBACK_AVATAR);

  return (
    <div className="seller-profile-page animate-fade-in">
      <div className="spp-header-row">
        <button className="spp-back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to Overview</span>
        </button>
        <div className="spp-title-block">
          <h1 className="spp-title">Profile Setup</h1>
          <p className="spp-subtitle">Manage how you appear across the dashboard and storefront.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="spp-loading-state">
          <Loader2 size={26} className="animate-spin" />
          <span>Loading your profile…</span>
        </div>
      ) : (
        <div className="spp-card">
          {/* Avatar picker */}
          <div className="spp-avatar-section">
            <div className="spp-avatar-wrap">
              <img src={displayAvatar} alt="Profile avatar" className="spp-avatar" />
              <button
                type="button"
                className="spp-avatar-camera"
                onClick={() => fileInputRef.current?.click()}
                title="Change photo"
              >
                <Camera size={15} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="spp-hidden-input"
                onChange={handleAvatarPick}
              />
            </div>
            <div className="spp-avatar-meta">
              <span className="spp-avatar-name">{fullName || 'Your name'}</span>
              <span className="spp-avatar-role">
                <ShieldCheck size={13} />
                {role === 'admin' ? 'Administrator' : 'Seller Account'}
              </span>
              {avatarFile && (
                <button
                  type="button"
                  className="spp-avatar-reset"
                  onClick={() => {
                    setAvatarFile(null);
                    setAvatarPreview(null);
                  }}
                >
                  Remove selected photo
                </button>
              )}
            </div>
          </div>

          {/* Form fields */}
          <div className="spp-form-grid">
            <div className="spp-field">
              <label>
                <UserIcon size={14} /> Full Name
              </label>
              <input
                type="text"
                maxLength={80}
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="spp-field">
              <label>
                <Mail size={14} /> Email
              </label>
              <input type="email" value={email} disabled title="Email cannot be changed here" />
              <span className="spp-field-hint">Contact support to change your login email.</span>
            </div>

            <div className="spp-field">
              <label>
                <Phone size={14} /> Phone
              </label>
              <input
                type="tel"
                maxLength={20}
                placeholder="e.g. 0300 1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="spp-field">
              <label>
                <ShieldCheck size={14} /> Account Type
              </label>
              <input type="text" value={role === 'admin' ? 'Administrator' : 'Seller'} disabled />
            </div>
          </div>

          <div className="spp-footer">
            <span className="spp-saved-hint">
              <CheckCircle2 size={14} /> Changes appear instantly in the top bar.
            </span>
            <div className="spp-footer-actions">
              <button type="button" className="spp-cancel-btn" onClick={onBack}>
                Cancel
              </button>
              <button type="button" className="spp-save-btn" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Saving…</span>
                  </>
                ) : (
                  'Save Profile'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './LogoutConfirmModal.css';

export default function LogoutConfirmModal({ isOpen, onClose, onConfirm }) {
  const {
    isLogoutModalOpen,
    cancelLogout,
    performLogout,
    user
  } = useCart();

  const showModal = isOpen !== undefined ? isOpen : isLogoutModalOpen;
  const handleClose = onClose || cancelLogout;
  const handleConfirm = onConfirm || performLogout;

  // Close when pressing Escape key
  useEffect(() => {
    if (!showModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal, handleClose]);

  if (!showModal) return null;

  const displayName = user?.full_name || user?.name || user?.username || 'User';
  const roleName = user?.role === 'admin'
    ? 'Admin'
    : (user?.role === 'seller' || user?.is_seller == 1)
      ? 'Seller'
      : 'Customer';

  return createPortal(
    <div
      className="logout-modal-overlay logout-animate-fade-in"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
    >
      <div
        className="logout-modal-card logout-animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          className="logout-modal-close"
          onClick={handleClose}
          aria-label="Cancel and close"
        >
          <X size={18} />
        </button>

        {/* Warning Icon */}
        <div className="logout-modal-icon-wrap">
          <div className="logout-modal-icon-bg">
            <LogOut size={26} strokeWidth={2.2} />
          </div>
        </div>

        {/* Content */}
        <div className="logout-modal-content">
          <h2 id="logout-modal-title" className="logout-modal-title">
            Sign Out?
          </h2>
          <p className="logout-modal-description">
            Are you sure you want to log out of your account?
          </p>

          {/* User Preview */}
          {user && (
            <div className="logout-modal-user-preview">
              <div className="logout-user-avatar">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="logout-user-info">
                <span className="logout-user-name">{displayName}</span>
                <span className="logout-user-role">{roleName} Account</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="logout-modal-actions">
            <button
              type="button"
              className="logout-modal-btn cancel-btn"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="logout-modal-btn confirm-btn"
              onClick={handleConfirm}
            >
              <LogOut size={16} />
              <span>Yes, Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

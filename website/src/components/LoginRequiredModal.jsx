import React from 'react';
import { createPortal } from 'react-dom';
import { Lock, LogIn, UserPlus, X, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './LoginRequiredModal.css';

export default function LoginRequiredModal({ isOpen, onClose, onLoginClick, onSignupClick }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="login-req-overlay animate-fade-in" onClick={onClose}>
      <div className="login-req-modal animate-scale-up" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="login-req-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        {/* Icon Header */}
        <div className="login-req-icon-box">
          <div className="login-req-icon-inner">
            <Lock size={26} strokeWidth={2.2} />
          </div>
        </div>

        {/* Content */}
        <div className="login-req-body">
          <h2 className="login-req-title">Login Required</h2>
          <p className="login-req-subtitle">
            Please log in or create a new account to add items to your cart and complete your purchase.
          </p>

          {/* Action Buttons */}
          <div className="login-req-buttons-stack">
            <button className="login-req-btn primary-login" onClick={onLoginClick}>
              <LogIn size={18} />
              <span>Log In</span>
            </button>

            <button className="login-req-btn secondary-signup" onClick={onSignupClick}>
              <UserPlus size={18} />
              <span>Sign Up</span>
            </button>
          </div>

          {/* Continue browsing link */}
          <button className="login-req-guest-link" onClick={onClose}>
            Continue exploring products
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

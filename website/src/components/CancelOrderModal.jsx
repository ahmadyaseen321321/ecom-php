import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X, Check, Loader2, HelpCircle } from 'lucide-react';
import './CancelOrderModal.css';

const USER_REASONS = [
  'Change of mind',
  'Ordered by mistake',
  'Found a better price elsewhere',
  'Delivery time is too long',
  'Need to change shipping address or items',
  'Decided not to purchase'
];

const SELLER_REASONS = [
  'Item out of stock',
  'Customer requested cancellation',
  'Pricing or inventory error',
  'Delivery location unreachable',
  'Unable to fulfill order in time'
];

export default function CancelOrderModal({
  isOpen,
  order,
  isSeller = false,
  onClose,
  onConfirm,
  loading = false
}) {
  const [reason, setReason] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const reasonsList = isSeller ? SELLER_REASONS : USER_REASONS;

  // Reset state whenever modal opens or order changes
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setSelectedPreset('');
      setErrorMsg('');
    }
  }, [isOpen, order?.id]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const orderDisplayId = order?.id
    ? (String(order.id).startsWith('#') ? order.id : `#${order.id}`)
    : 'Order';

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset);
    setReason(preset);
    setErrorMsg('');
  };

  const handleReasonChange = (e) => {
    const val = e.target.value;
    setReason(val);
    if (selectedPreset && val !== selectedPreset) {
      setSelectedPreset('');
    }
    if (errorMsg && val.trim()) {
      setErrorMsg('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setErrorMsg('Please enter or select a cancellation reason.');
      return;
    }
    if (onConfirm) {
      onConfirm(trimmed);
    }
  };

  return createPortal(
    <div
      className="cancel-modal-overlay cancel-animate-fade-in"
      onClick={() => { if (!loading) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-modal-title"
    >
      <div
        className="cancel-modal-card cancel-animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          className="cancel-modal-close"
          onClick={() => { if (!loading) onClose(); }}
          aria-label="Close modal"
          disabled={loading}
        >
          <X size={18} />
        </button>

        {/* Warning Icon Badge */}
        <div className="cancel-modal-icon-wrap">
          <div className="cancel-modal-icon-bg">
            <AlertTriangle size={26} strokeWidth={2.2} />
          </div>
        </div>

        {/* Header */}
        <div className="cancel-modal-header">
          <h2 id="cancel-modal-title" className="cancel-modal-title">
            Cancel {orderDisplayId}?
          </h2>
          <p className="cancel-modal-subtitle">
            {isSeller
              ? 'Please specify a reason for cancelling this order so the customer is properly notified.'
              : 'Please let us know why you are cancelling this order to help us improve your experience.'}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="cancel-modal-form">
          <div className="cancel-input-group">
            <label htmlFor="cancel-reason-input" className="cancel-input-label">
              Reason for cancellation <span className="req-star">*</span>
            </label>
            <textarea
              id="cancel-reason-input"
              className={`cancel-reason-textarea ${errorMsg ? 'has-error' : ''}`}
              placeholder="Type your cancellation reason here..."
              rows={3}
              value={reason}
              onChange={handleReasonChange}
              maxLength={300}
              disabled={loading}
              autoFocus
            />
            <div className="cancel-input-footer">
              {errorMsg ? (
                <span className="cancel-error-text">{errorMsg}</span>
              ) : (
                <span className="cancel-hint-text">
                  <HelpCircle size={13} /> Select a quick reason below or write your own.
                </span>
              )}
              <span className="cancel-char-count">{reason.length}/300</span>
            </div>
          </div>

          {/* Quick Select Reason Chips */}
          <div className="cancel-presets-section">
            <span className="cancel-presets-label">Common reasons:</span>
            <div className="cancel-presets-chips">
              {reasonsList.map((preset) => {
                const isSelected = selectedPreset === preset || reason === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    className={`cancel-preset-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelectPreset(preset)}
                    disabled={loading}
                  >
                    {isSelected && <Check size={13} className="chip-check-icon" />}
                    <span>{preset}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="cancel-modal-actions">
            <button
              type="button"
              className="cancel-btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Keep Order
            </button>
            <button
              type="submit"
              className="cancel-btn-danger"
              disabled={loading || !reason.trim()}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="cancel-spin" />
                  <span>Cancelling...</span>
                </>
              ) : (
                <span>Confirm Cancellation</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

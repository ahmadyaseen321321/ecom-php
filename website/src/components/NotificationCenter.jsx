import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Package,
  MessageSquare,
  Truck,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Inbox
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useCart } from '../context/CartContext';
import './NotificationCenter.css';

export default function NotificationCenter({ isOpen, onClose }) {
  const {
    notifications,
    unreadNotifCount,
    toastAlert,
    soundEnabled,
    setSoundEnabled,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    dismissToastAlert
  } = useSocket();

  const { navigateTo, user } = useCart();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'orders' | 'messages' | 'status'
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        if (isOpen && onClose) onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Format relative time
  const formatTime = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffSec = Math.floor((now - date) / 1000);

      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  const handleNotificationClick = (notif) => {
    markAsRead(notif.id);
    if (onClose) onClose();

    const isSeller = user?.role === 'seller' || user?.is_seller == 1;

    if (notif.type === 'message') {
      if (isSeller) {
        navigateTo('seller-dashboard');
      } else {
        navigateTo('messages');
      }
    } else if (notif.type === 'order_placed' || notif.type === 'new_order' || notif.type === 'order_status') {
      if (isSeller) {
        navigateTo('seller-dashboard');
      } else {
        navigateTo('orders');
      }
    } else {
      navigateTo('home');
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (activeTab === 'orders') return notif.type === 'order_placed' || notif.type === 'new_order';
    if (activeTab === 'messages') return notif.type === 'message';
    if (activeTab === 'status') return notif.type === 'order_status';
    return true;
  });

  const getNotifIcon = (notif) => {
    if (notif.type === 'order_placed' || notif.type === 'new_order') {
      return <Package size={18} className="icon-order" />;
    }
    if (notif.type === 'message') {
      return <MessageSquare size={18} className="icon-msg" />;
    }
    if (notif.type === 'order_status') {
      if (notif.status === 'SHIPPED') return <Truck size={18} className="icon-ship" />;
      if (notif.status === 'DELIVERED') return <CheckCircle2 size={18} className="icon-deliver" />;
      return <Sparkles size={18} className="icon-status" />;
    }
    return <Bell size={18} className="icon-default" />;
  };

  return (
    <>
      {/* ─── 1. REAL-TIME FLOATING TOAST BANNER (SLIDES IN ON SOCKET EVENT) ─── */}
      {toastAlert && (
        <div className="socket-toast-floating-banner animate-slide-in-right">
          <div className="socket-toast-icon-wrap">
            {getNotifIcon(toastAlert)}
          </div>

          <div className="socket-toast-body" onClick={() => handleNotificationClick(toastAlert)}>
            <div className="socket-toast-header">
              <span className="socket-toast-badge">{toastAlert.type?.replace('_', ' ').toUpperCase()}</span>
              <span className="socket-toast-time">Just now</span>
            </div>
            <h4 className="socket-toast-title">{toastAlert.title}</h4>
            <p className="socket-toast-msg">{toastAlert.message}</p>
          </div>

          <button
            className="socket-toast-close"
            onClick={(e) => {
              e.stopPropagation();
              dismissToastAlert();
            }}
            title="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ─── 2. NOTIFICATION DROPDOWN POPUP ─── */}
      {isOpen && (
        <div className="notif-dropdown-wrapper animate-fade-in" ref={dropdownRef}>
          {/* Header */}
          <div className="notif-header">
            <div className="notif-header-title">
              <h3>Notifications</h3>
              {unreadNotifCount > 0 && (
                <span className="notif-count-badge">{unreadNotifCount} new</span>
              )}
            </div>

            <div className="notif-header-actions">
              <button
                className="notif-icon-toggle"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Mute Chimes' : 'Unmute Chimes'}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>

              {notifications.length > 0 && (
                <button
                  className="notif-text-btn"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                >
                  Mark all read
                </button>
              )}

              {onClose && (
                <button className="notif-close-btn" onClick={onClose}>
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="notif-tabs-bar">
            <button
              className={`notif-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All ({notifications.length})
            </button>
            <button
              className={`notif-tab ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              Orders
            </button>
            <button
              className={`notif-tab ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              Messages
            </button>
            <button
              className={`notif-tab ${activeTab === 'status' ? 'active' : ''}`}
              onClick={() => setActiveTab('status')}
            >
              Status
            </button>
          </div>

          {/* List Body */}
          <div className="notif-list-body">
            {filteredNotifications.length === 0 ? (
              <div className="notif-empty-state">
                <div className="empty-icon-wrap">
                  <Inbox size={32} />
                </div>
                <p className="empty-title">No notifications yet</p>
                <span className="empty-sub">
                  Real-time updates on orders and messages will appear here.
                </span>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`notif-item-row ${!n.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="notif-item-icon">{getNotifIcon(n)}</div>

                  <div className="notif-item-content">
                    <div className="notif-item-top">
                      <strong className="notif-item-title">{n.title}</strong>
                      <span className="notif-item-time">
                        <Clock size={12} /> {formatTime(n.createdAt)}
                      </span>
                    </div>

                    <p className="notif-item-desc">{n.message}</p>

                    {n.orderId && (
                      <span className="notif-order-tag">{n.orderId}</span>
                    )}
                  </div>

                  {!n.read && <div className="notif-unread-dot" />}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="notif-footer">
              <button className="notif-clear-btn" onClick={clearNotifications}>
                Clear All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

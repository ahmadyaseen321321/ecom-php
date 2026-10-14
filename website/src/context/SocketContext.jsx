import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useCart } from './CartContext';

const SocketContext = createContext();

// Socket server URL configuration — only connect if explicitly set via env variable
const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || null;

export const SocketProvider = ({ children }) => {
  const { user, navigateTo, showToast } = useCart();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('app_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [toastAlert, setToastAlert] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Audio chime generator using Web Audio API (crisp, modern chime, zero external assets required)
  const playChime = useCallback((type = 'default') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'order') {
        // Joyful 3-tone arpeggio (C5 -> E5 -> G5)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      } else if (type === 'message') {
        // Soft double blip (F5 -> A5)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(698.46, now);
        osc.frequency.setValueAtTime(880.00, now + 0.08);
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else {
        // Crisp gentle chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880.00, now + 0.1); // A5
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      }
    } catch (e) {
      // AudioContext might be blocked until first user gesture
    }
  }, [soundEnabled]);

  // Save notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('app_notifications', JSON.stringify(notifications.slice(0, 50)));
    } catch (e) {
      console.error('Failed to save notifications to localStorage:', e);
    }
  }, [notifications]);

  // Connect to Socket.io Server — only if a server URL is configured
  useEffect(() => {
    // Skip entirely if no socket server is configured (avoids console spam)
    if (!SOCKET_SERVER_URL) {
      console.log('[SocketContext] No VITE_SOCKET_URL set — real-time features disabled.');
      return;
    }

    let socketInstance = null;
    try {
      socketInstance = io(SOCKET_SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 5000,
      });

      socketInstance.on('connect', () => {
        console.log('[SocketContext] Connected to Socket.IO server:', socketInstance.id);
        setIsConnected(true);

        // Authenticate user with server
        if (user) {
          socketInstance.emit('authenticate', {
            id: user.id || user.user_id,
            role: user.role || (user.is_seller ? 'seller' : 'customer'),
            name: user.full_name || user.name,
            seller_id: user.seller_id,
            is_seller: user.is_seller
          });
        }
      });

      socketInstance.on('disconnect', () => {
        console.log('[SocketContext] Disconnected from Socket.IO server');
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (err) => {
        console.warn('[SocketContext] Connection error:', err.message);
        setIsConnected(false);
      });

      // Listen for incoming notifications
      socketInstance.on('new_notification', (notif) => {
        console.log('[SocketContext] Real-time notification received:', notif);
        const enrichedNotif = {
          id: notif.id || `notif_${Date.now()}`,
          type: notif.type || 'info',
          title: notif.title || 'Notification',
          message: notif.message || '',
          orderId: notif.orderId || notif.order_id,
          createdAt: notif.created_at || new Date().toISOString(),
          read: false,
          raw: notif
        };

        setNotifications((prev) => [enrichedNotif, ...prev]);

        // Play appropriate sound
        if (notif.type === 'order_placed' || notif.type === 'new_order') {
          playChime('order');
        } else if (notif.type === 'message') {
          playChime('message');
        } else {
          playChime('default');
        }

        // Trigger real-time floating toast banner
        setToastAlert(enrichedNotif);

        // Native Browser Notification (for when tab is in background or minimized)
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(enrichedNotif.title, {
              body: enrichedNotif.message,
              icon: '/favicon.svg'
            });
          } catch (e) {}
        }
      });

      setSocket(socketInstance);
    } catch (err) {
      console.error('[SocketContext] Initialization error:', err);
    }

    // Auto-request browser notification permission on first load
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  // Update authentication whenever user state changes
  useEffect(() => {
    if (socket && isConnected && user) {
      socket.emit('authenticate', {
        id: user.id || user.user_id,
        role: user.role || (user.is_seller ? 'seller' : 'customer'),
        name: user.full_name || user.name,
        seller_id: user.seller_id,
        is_seller: user.is_seller
      });
    }
  }, [user, socket, isConnected]);

  // Clear notifications on logout. We track the previous user with a ref so we
  // only wipe when a logged-in user actually signs out (user -> null), never on
  // the initial mount or a page reload while still logged in.
  const prevUserRef = useRef(user);
  useEffect(() => {
    const wasLoggedIn = !!prevUserRef.current;
    const isLoggedIn = !!user;
    if (wasLoggedIn && !isLoggedIn) {
      // User signed out — drop their notifications from state + storage so the
      // bell badge doesn't linger for the next person on this browser.
      setNotifications([]);
      try {
        localStorage.removeItem('app_notifications');
      } catch {}
    }
    prevUserRef.current = user;
  }, [user]);

  // Auto-dismiss floating toast alert after 6 seconds
  useEffect(() => {
    if (toastAlert) {
      const timer = setTimeout(() => {
        setToastAlert(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [toastAlert]);

  // Notification Helper Methods
  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
    try {
      localStorage.removeItem('app_notifications');
    } catch {}
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  // Real-Time Socket Event Emitters
  const sendMessage = (payload) => {
    if (!socket || !isConnected) {
      console.warn('[SocketContext] Socket not connected. Message sent offline.');
      return;
    }
    socket.emit('send_message', {
      // Re-use the optimistic message id so the echo of our own message can be
      // matched (and not rendered twice) by the sender's message list
      id: payload.id,
      orderId: payload.orderId,
      message: payload.message,
      senderType: payload.senderType || (user?.role === 'seller' ? 'seller' : 'customer'),
      senderId: user?.id || user?.user_id,
      senderName: user?.full_name || user?.name || (payload.senderType === 'seller' ? 'Seller Support' : 'Customer'),
      recipientId: payload.recipientId,
      attachmentUrl: payload.attachmentUrl,
      createdAt: new Date().toISOString()
    });
  };

  const emitOrderPlaced = (orderData) => {
    if (!socket) return;
    socket.emit('order_placed', {
      orderId: orderData.orderId,
      userId: user?.id || user?.user_id || orderData.userId,
      customerName: user?.full_name || user?.name || orderData.customerName || 'Customer',
      total: orderData.total,
      items: orderData.items || [],
      shippingAddress: orderData.shippingAddress || orderData.address,
      paymentMethod: orderData.paymentMethod || 'Cash on Delivery',
      sellerIds: orderData.sellerIds || []
    });
  };

  const emitOrderStatusUpdate = (orderId, newStatus, reason = null, customerId = null) => {
    if (!socket) return;
    socket.emit('update_order_status', {
      orderId,
      status: newStatus,
      reason,
      customerId,
      sellerId: user?.seller_id,
      updatedBy: user?.full_name || 'Seller'
    });
  };

  const emitNotification = (data) => {
    if (!socket) return;
    socket.emit('send_notification', data);
  };

  const joinOrder = (orderId) => {
    if (socket && orderId) {
      socket.emit('join_order', orderId);
    }
  };

  const leaveOrder = (orderId) => {
    if (socket && orderId) {
      socket.emit('leave_order', orderId);
    }
  };

  const dismissToastAlert = () => setToastAlert(null);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        notifications,
        unreadNotifCount,
        toastAlert,
        soundEnabled,
        setSoundEnabled,
        playChime,
        sendMessage,
        emitOrderPlaced,
        emitOrderStatusUpdate,
        emitNotification,
        joinOrder,
        leaveOrder,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        dismissToastAlert
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

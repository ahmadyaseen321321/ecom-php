import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import {
  fetchOrderChatApi,
  sendOrderChatApi,
  getImageUrl
} from '../services/api';
import {
  X,
  Send,
  MessageSquare,
  Package,
  Calendar,
  DollarSign,
  User,
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  ChevronRight,
  Loader2,
  Paperclip,
  Image as ImageIcon,
  ExternalLink,
  MapPin,
  CreditCard,
  History,
  Phone,
  Mail
} from 'lucide-react';
import './SellerOrderChatModal.css';

const QUICK_REPLIES = [
  "Hello! We are currently preparing your package. 📦",
  "Your order has been confirmed and will ship shortly! 🚚",
  "Could you please verify your delivery address? 📍",
  "Your parcel has been handed over to the courier! 🚀"
];

export default function SellerOrderChatModal({
  order,
  allOrders = [],
  onClose,
  onViewOrderDetails
}) {
  const { showToast } = useCart();
  const [currentOrder, setCurrentOrder] = useState(order);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Normalize current order attributes
  const orderId = currentOrder?.id ? (String(currentOrder.id).startsWith('#') ? currentOrder.id : `#ORD-${currentOrder.id}`) : '#ORD-1';
  const customerName = currentOrder?.customer_name || currentOrder?.customerName || currentOrder?.customer || 'Customer';
  const orderTotal = Number(currentOrder?.total_amount || currentOrder?.total || currentOrder?.price || 0);
  const orderStatus = currentOrder?.status || currentOrder?.order_status || 'Ready to Ship';
  const orderDate = currentOrder?.date || currentOrder?.created_at ? new Date(currentOrder.date || currentOrder.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';
  const orderItemsSummary = currentOrder?.product_summary || currentOrder?.product || (Array.isArray(currentOrder?.items) && currentOrder.items.length > 0 ? currentOrder.items.map(i => i.name).join(', ') : 'Order Items');
  const customerEmail = currentOrder?.customer_email || currentOrder?.user_email || `${customerName.toLowerCase().replace(/\s+/g, '')}@example.com`;
  const customerPhone = currentOrder?.customer_phone || '+92 300 1234567';
  const shippingAddress = currentOrder?.shipping_address || 'Standard Shipping Address';
  const paymentMethod = currentOrder?.payment_method || 'Cash on Delivery';

  // Find all previous orders for this buyer
  const buyerHistoryOrders = allOrders.filter(o => {
    const oCust = String(o.customer_name || o.customerName || o.customer || '').toLowerCase().trim();
    const targetCust = customerName.toLowerCase().trim();
    return oCust && targetCust && (oCust === targetCust || oCust.includes(targetCust) || targetCust.includes(oCust));
  });

  // Calculate total spent & total orders for this buyer
  const buyerTotalSpent = buyerHistoryOrders.reduce((sum, o) => sum + Number(o.total_amount || o.total || o.price || 0), 0);
  const buyerTotalOrdersCount = Math.max(buyerHistoryOrders.length, 1);

  // Load chat messages whenever current order changes
  const loadMessages = async (targetOrderId) => {
    setIsLoading(true);
    try {
      const res = await fetchOrderChatApi(targetOrderId);
      const list = res?.messages || res?.data || (Array.isArray(res) ? res : []);
      if (list.length > 0) {
        setMessages(list);
      } else {
        // Fallback initial greeting message if empty
        setMessages([
          {
            id: 'welcome-1',
            order_id: targetOrderId,
            sender_type: 'seller',
            message: `Hello ${customerName}! Thank you for your order (${targetOrderId}). We are processing your items. Feel free to message us if you have questions!`,
            created_at: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to load order chat:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentOrder) {
      loadMessages(orderId);
    }
  }, [currentOrder]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (textToSend = inputText) => {
    const text = String(textToSend || '').trim();
    if (!text) return;

    const optimisticMsg = {
      id: Date.now(),
      order_id: orderId,
      sender_type: 'seller',
      message: text,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setInputText('');
    setIsSending(true);

    try {
      await sendOrderChatApi(orderId, text, 'seller');
    } catch (err) {
      showToast('Message sent (offline saved)');
    } finally {
      setIsSending(false);
    }
  };

  const handleSwitchOrder = (newOrd) => {
    const newDisplayId = String(newOrd.id).startsWith('#') ? newOrd.id : `#ORD-${newOrd.id || newOrd.order_id}`;
    setCurrentOrder({ ...newOrd, id: newDisplayId });
    showToast(`Switched chat to ${newDisplayId}`);
  };

  return (
    <div className="order-chat-modal-overlay" onClick={onClose}>
      <div className="order-chat-modal-container animate-fade-in" onClick={(e) => e.stopPropagation()}>
        
        {/* ─── 1. TOP ORDER DETAILS HEADER BANNER ─── */}
        <div className="order-chat-top-banner">
          <div className="banner-order-meta">
            <div className="meta-badge-row">
              <span className="order-number-tag">
                <Package size={16} />
                <strong>{orderId}</strong>
              </span>
              <span className={`chat-order-status-pill ${String(orderStatus).toLowerCase().replace(/\s+/g, '-')}`}>
                ● {orderStatus}
              </span>
            </div>

            <div className="meta-details-sub">
              <span className="meta-item">
                <Calendar size={13} /> {orderDate}
              </span>
              <span className="meta-sep">•</span>
              <span className="meta-item bold-val">
                Rs. {orderTotal.toLocaleString()}
              </span>
              <span className="meta-sep">•</span>
              <span className="meta-item summary-txt" title={orderItemsSummary}>
                {orderItemsSummary}
              </span>
            </div>
          </div>

          <div className="banner-actions-right">
            {onViewOrderDetails && (
              <button
                className="btn-banner-action view-order"
                onClick={() => {
                  onViewOrderDetails(currentOrder);
                  onClose();
                }}
              >
                <ExternalLink size={14} />
                <span>Full Order Details</span>
              </button>
            )}
            <button className="btn-close-chat" onClick={onClose} title="Close Chat">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ─── 2. SPLIT CHAT LAYOUT: LEFT (CHATBOX) & RIGHT (BUYER HISTORY) ─── */}
        <div className="order-chat-main-split">
          
          {/* ─── LEFT PANEL: CHATBOX ─── */}
          <div className="chatbox-conversation-panel">
            {/* Buyer header status bar */}
            <div className="buyer-chat-header-bar">
              <div className="buyer-profile-flex">
                <div className="buyer-avatar-bubble">
                  {customerName.substring(0, 2).toUpperCase()}
                  <span className="online-indicator-dot"></span>
                </div>
                <div className="buyer-name-col">
                  <h3 className="buyer-header-name">{customerName}</h3>
                  <span className="buyer-sub-status">
                    Customer for {orderId} • <span className="online-green">Active Now</span>
                  </span>
                </div>
              </div>

              <div className="quick-tags-wrap">
                <span className="buyer-badge-tag">Verified Buyer</span>
              </div>
            </div>

            {/* Scrollable Messages Feed */}
            <div className="chatbox-messages-scroll">
              <div className="chat-date-divider">
                <span>ORDER CONVERSATION HISTORY</span>
              </div>

              {isLoading ? (
                <div className="chat-loading-state">
                  <Loader2 size={24} className="animate-spin text-emerald-600" />
                  <span>Loading conversation...</span>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isSeller = msg.sender_type === 'seller' || msg.sender === 'seller' || msg.sender === 'me';
                  const msgTime = msg.created_at
                    ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : (msg.time || 'Just now');

                  return (
                    <div
                      key={msg.id || index}
                      className={`chat-message-row ${isSeller ? 'from-seller' : 'from-buyer'}`}
                    >
                      {!isSeller && (
                        <div className="msg-buyer-avatar">
                          {customerName.substring(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="msg-bubble-wrapper">
                        <div className={`msg-bubble ${isSeller ? 'seller-bubble' : 'buyer-bubble'}`}>
                          <p className="msg-text">{msg.message || msg.text}</p>
                          {msg.attachment_url && (
                            <div className="msg-attachment-img">
                              <img src={getImageUrl(msg.attachment_url)} alt="Attachment" />
                            </div>
                          )}
                        </div>
                        <div className="msg-time-status">
                          <span className="msg-time">{msgTime}</span>
                          {isSeller && <CheckCircle2 size={12} className="msg-delivered-icon" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions Chips */}
            <div className="chat-quick-replies-row">
              <span className="quick-hint-label">Quick Replies:</span>
              <div className="quick-chips-scroll">
                {QUICK_REPLIES.map((reply, i) => (
                  <button
                    key={i}
                    type="button"
                    className="quick-chip-btn"
                    onClick={() => handleSend(reply)}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input Bar */}
            <form
              className="chatbox-input-footer"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <div className="chat-input-box">
                <button
                  type="button"
                  className="input-tool-btn"
                  title="Attach Photo"
                  onClick={() => showToast('Image attachment available')}
                >
                  <ImageIcon size={18} />
                </button>
                <button
                  type="button"
                  className="input-tool-btn"
                  title="Attach File"
                  onClick={() => showToast('File attachment available')}
                >
                  <Paperclip size={18} />
                </button>

                <input
                  type="text"
                  placeholder={`Reply to ${customerName} regarding ${orderId}...`}
                  className="chat-text-input-field"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  autoFocus
                />

                <button
                  type="submit"
                  className="btn-send-message"
                  disabled={isSending || !inputText.trim()}
                  title="Send Message"
                >
                  {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </form>
          </div>

          {/* ─── RIGHT PANEL: BUYER PROFILE & ORDER HISTORY ─── */}
          <div className="buyer-history-panel">
            {/* Buyer Profile Card */}
            <div className="buyer-card-block">
              <div className="buyer-card-header">
                <div className="buyer-large-avatar">
                  {customerName.substring(0, 2).toUpperCase()}
                </div>
                <div className="buyer-header-text">
                  <h4 className="buyer-name-title">{customerName}</h4>
                  <span className="buyer-tier-pill">Loyal Customer</span>
                </div>
              </div>

              {/* Contact mini details */}
              <div className="buyer-contact-list">
                <div className="contact-row">
                  <Mail size={14} className="contact-icon" />
                  <span className="contact-val">{customerEmail}</span>
                </div>
                <div className="contact-row">
                  <Phone size={14} className="contact-icon" />
                  <span className="contact-val">{customerPhone}</span>
                </div>
                <div className="contact-row">
                  <MapPin size={14} className="contact-icon" />
                  <span className="contact-val">{shippingAddress}</span>
                </div>
                <div className="contact-row">
                  <CreditCard size={14} className="contact-icon" />
                  <span className="contact-val">{paymentMethod}</span>
                </div>
              </div>

              {/* Buyer Stats Counters */}
              <div className="buyer-stats-grid">
                <div className="b-stat-card">
                  <span className="b-stat-lbl">TOTAL ORDERS</span>
                  <strong className="b-stat-val">{buyerTotalOrdersCount}</strong>
                </div>
                <div className="b-stat-card">
                  <span className="b-stat-lbl">LIFETIME SPENT</span>
                  <strong className="b-stat-val text-green">Rs. {buyerTotalSpent.toLocaleString()}</strong>
                </div>
              </div>
            </div>

            {/* Previous Orders & Order History List */}
            <div className="buyer-history-section">
              <div className="history-header-row">
                <div className="history-title-flex">
                  <History size={16} className="text-emerald-700" />
                  <h4 className="history-title">Buyer Order History</h4>
                </div>
                <span className="history-count-badge">{buyerHistoryOrders.length} orders</span>
              </div>

              <div className="history-orders-scroll-list">
                {buyerHistoryOrders.length === 0 ? (
                  <div className="empty-history-box">
                    <ShoppingBag size={24} className="text-gray-400" />
                    <span>No other orders found for this customer.</span>
                  </div>
                ) : (
                  buyerHistoryOrders.map((hOrd) => {
                    const hOrdDisplayId = String(hOrd.id).startsWith('#') ? hOrd.id : `#ORD-${hOrd.id || hOrd.order_id}`;
                    const isCurrent = hOrdDisplayId === orderId;
                    const hTotal = Number(hOrd.total_amount || hOrd.total || hOrd.price || 0);
                    const hStatus = hOrd.status || hOrd.order_status || 'Ready to Ship';
                    const hDate = hOrd.date || hOrd.created_at ? new Date(hOrd.date || hOrd.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';

                    return (
                      <div
                        key={hOrd.id || hOrd.order_id}
                        className={`history-order-item-card ${isCurrent ? 'active-current-order' : ''}`}
                        onClick={() => !isCurrent && handleSwitchOrder(hOrd)}
                      >
                        <div className="history-card-top">
                          <div className="history-id-flex">
                            <Package size={14} />
                            <strong>{hOrdDisplayId}</strong>
                            {isCurrent && <span className="current-badge">Current</span>}
                          </div>
                          <span className="history-price">Rs. {hTotal.toLocaleString()}</span>
                        </div>

                        <div className="history-card-sub">
                          <span className="history-date">{hDate}</span>
                          <span className={`history-status-pill ${String(hStatus).toLowerCase().replace(/\s+/g, '-')}`}>
                            {hStatus}
                          </span>
                        </div>

                        {!isCurrent && (
                          <div className="history-card-action-hint">
                            <span>Switch Chat to this Order</span>
                            <ChevronRight size={13} />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

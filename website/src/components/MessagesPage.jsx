import React, { useState, useEffect } from 'react';
import {
  Search,
  ShoppingBag,
  Bell,
  User,
  Paperclip,
  Image as ImageIcon,
  Send,
  FileText,
  MessageSquare,
  Loader,
  MessageCircle,
  Package,
  ArrowRight
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { fetchConversationsApi, fetchOrderChatApi, sendOrderChatApi, fetchOrdersApi, getImageUrl } from '../services/api';
import './MessagesPage.css';

export default function MessagesPage() {
  const { navigateTo, user, openLoginModal, openSignupModal } = useCart();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (user) {
      loadConversations();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      // Load user's real orders to build 1 unified store conversation
      const ordersRes = await fetchOrdersApi();
      const ordersList = Array.isArray(ordersRes) ? ordersRes : (ordersRes?.data || []);
      
      if (ordersList.length > 0) {
        const latestOrder = ordersList[0];
        const latestOrderId = `#ORD-${latestOrder.id}`;
        const totalAmount = Number(latestOrder.total || latestOrder.total_amount || 0).toLocaleString();
        
        const singleStoreConv = {
          id: 'store_support',
          orderId: latestOrderId,
          name: 'Novanest Store Support',
          avatarText: 'NS',
          avatarImg: null,
          online: true,
          time: latestOrder.created_at ? new Date(latestOrder.created_at).toLocaleDateString() : 'Recent',
          preview: ordersList.length > 1 
            ? `${ordersList.length} Orders • Latest ${latestOrderId} (Rs. ${totalAmount})`
            : `Order ${latestOrderId} • Rs. ${totalAmount}`,
          unread: false,
          orders: ordersList,
          messages: []
        };

        setConversations([singleStoreConv]);
        setActiveId(singleStoreConv.id);
        loadAllUserChatMessages(ordersList, latestOrderId);
      } else {
        const defaultConv = {
          id: 'store_support',
          orderId: 'GENERAL',
          name: 'Novanest Customer Support',
          avatarText: 'NS',
          avatarImg: null,
          online: true,
          time: 'Active',
          preview: 'Chat with our seller & store support team',
          unread: false,
          orders: [],
          messages: []
        };
        setConversations([defaultConv]);
        setActiveId(defaultConv.id);
        loadChatMessages('GENERAL');
      }
    } catch (err) {
      console.warn('Could not load conversations:', err);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllUserChatMessages = async (ordersList, fallbackOrderId) => {
    try {
      const orderIds = (ordersList && ordersList.length > 0)
        ? ordersList.map(o => String(o.id).startsWith('#') ? o.id : `#ORD-${o.id}`)
        : [fallbackOrderId];

      const uniqueOrderIds = [...new Set(orderIds)];
      const results = await Promise.all(uniqueOrderIds.map(oid => fetchOrderChatApi(oid).catch(() => null)));

      const allRaw = [];
      results.forEach(res => {
        const list = res?.messages || res?.data || [];
        if (Array.isArray(list)) {
          list.forEach(m => {
            if (!allRaw.some(existing => existing.id === m.id)) {
              allRaw.push(m);
            }
          });
        }
      });

      allRaw.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());

      if (allRaw.length > 0) {
        setChatMessages(allRaw.map(m => ({
          id: m.id,
          sender: m.sender_type === 'customer' ? 'me' : 'them',
          text: m.message || m.text || '',
          time: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'
        })));
      } else {
        setChatMessages([]);
      }
    } catch (err) {
      console.warn('Error loading all user chat messages:', err);
      setChatMessages([]);
    }
  };

  const loadChatMessages = async (orderId) => {
    if (!orderId) return;
    try {
      const res = await fetchOrderChatApi(orderId);
      const msgs = res?.messages || res?.data || [];
      if (Array.isArray(msgs) && msgs.length > 0) {
        setChatMessages(msgs.map(m => ({
          id: m.id,
          sender: m.sender_type === 'customer' ? 'me' : 'them',
          text: m.message || m.text || '',
          time: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'
        })));
      } else {
        setChatMessages([]);
      }
    } catch (err) {
      console.warn('Error loading chat messages:', err);
      setChatMessages([]);
    }
  };

  const handleSelectConversation = (conv) => {
    const selectedId = conv.id || conv.orderId;
    setActiveId(selectedId);
    loadChatMessages(conv.orderId || conv.id);
  };

  const activeConv = conversations.find(
    (c) => String(c.id) === String(activeId) || String(c.orderId) === String(activeId)
  ) || conversations[0] || null;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    const orderIdentifier = activeConv?.orderId || (activeId ? `#ORD-${activeId}` : 'GENERAL');

    const newMsg = {
      id: Date.now(),
      sender: 'me',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, newMsg]);
    setInputText('');
    setIsSending(true);

    try {
      await sendOrderChatApi(orderIdentifier, textToSend, 'customer');
    } catch (err) {
      console.warn('Failed to post message online:', err);
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (activeTab === 'Unread' && !c.unread) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.orderId && c.orderId.toLowerCase().includes(q)) ||
        (c.preview && c.preview.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // 1. Unauthenticated Prompt
  if (!user) {
    return (
      <div className="messages-layout-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 160px)', padding: '40px 20px' }}>
        <div 
          className="animate-fade-in"
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '48px 36px',
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb'
          }}
        >
          <div style={{ width: '72px', height: '72px', borderRadius: '22px', background: 'linear-gradient(135deg, #2d5a27 0%, #1e3d1a 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 10px 25px -5px rgba(45, 90, 39, 0.4)' }}>
            <MessageSquare size={32} />
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', margin: '0 0 10px' }}>
            Log in to start messaging
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#6b7280', margin: '0 0 32px', lineHeight: 1.5 }}>
            Sign in to your account to view order conversations, receive shipping updates, and chat with store sellers.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
            <button
              onClick={openLoginModal}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '14px',
                border: 'none',
                background: '#2d5a27',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(45, 90, 39, 0.25)'
              }}
            >
              <Send size={16} />
              <span>Log In</span>
            </button>

            <button
              onClick={openSignupModal}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '14px',
                border: '1.5px solid #d1d5db',
                background: '#fff',
                color: '#111827',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>Sign Up</span>
            </button>
          </div>

          <button
            onClick={() => navigateTo('shop')}
            style={{
              background: 'none',
              border: 'none',
              color: '#2d5a27',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Explore Shop
          </button>
        </div>
      </div>
    );
  }

  // 2. Loading State
  if (isLoading) {
    return (
      <div className="messages-layout-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <Loader size={36} className="animate-spin" style={{ margin: '0 auto 12px', color: '#2d5a27' }} />
          <p style={{ fontWeight: 600, fontSize: '1rem' }}>Loading messages...</p>
        </div>
      </div>
    );
  }

  // 3. Logged-in with No Conversations
  if (conversations.length === 0) {
    return (
      <div className="messages-layout-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 160px)', padding: '40px 20px' }}>
        <div 
          className="animate-fade-in"
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '48px 36px',
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb'
          }}
        >
          <div style={{ width: '72px', height: '72px', borderRadius: '22px', background: '#f0fdf4', color: '#2d5a27', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid #dcfce7' }}>
            <MessageCircle size={36} />
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', margin: '0 0 10px' }}>
            No Conversations Yet
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#6b7280', margin: '0 0 32px', lineHeight: 1.6 }}>
            When you place an order, you will be able to message sellers directly here for order updates, custom requests, and tracking support.
          </p>

          <button
            onClick={() => navigateTo('shop')}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: '14px',
              border: 'none',
              background: '#2d5a27',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(45, 90, 39, 0.25)'
            }}
          >
            <span>Explore Products</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  const effectiveChatList = chatMessages && chatMessages.length > 0 
    ? chatMessages 
    : (activeConv?.messages || []);

  return (
    <div className="messages-layout-page">
      {/* Main Split Layout */}
      <div className="messages-split-body">
        {/* Left Sidebar */}
        <aside className="messages-sidebar">
          <div className="sidebar-title-area">
            <h2>Order Messages</h2>
            <div className="filter-pills-row">
              <button
                className={`filter-pill-btn ${activeTab === 'All' ? 'active' : ''}`}
                onClick={() => setActiveTab('All')}
              >
                All
              </button>
              <button
                className={`filter-pill-btn ${activeTab === 'Unread' ? 'active' : ''}`}
                onClick={() => setActiveTab('Unread')}
              >
                Unread
              </button>
            </div>
          </div>

          <div className="sidebar-conversations-list">
            {filteredConversations.map((c) => {
              const itemKey = c.id || c.orderId;
              const isActive = String(itemKey) === String(activeId) || String(c.orderId) === String(activeId);
              return (
                <div
                  key={itemKey}
                  className={`sidebar-conv-card ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectConversation(c)}
                >
                  <div className="conv-thumb">
                    {c.avatarImg ? (
                      <img src={c.avatarImg} alt={c.name || 'Store'} />
                    ) : (
                      <div className="conv-icon-placeholder">
                        <FileText size={20} color="#6b7280" />
                      </div>
                    )}
                  </div>

                  <div className="conv-info font-family">
                    <div className="conv-name-row">
                      <span className="conv-name">{c.name || 'Order'}</span>
                      <span className="conv-time">{c.time || ''}</span>
                    </div>
                    {c.orderId && <span className="conv-order-id">{c.orderId.startsWith('#') ? c.orderId : `ORDER #${c.orderId}`}</span>}
                    <p className="conv-preview">{c.preview || 'Click to view conversation'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Right Chat Main Section */}
        <main className="messages-chat-area">
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="chat-header-bar">
                <div className="chat-user-profile">
                  <div className="chat-avatar-circle">
                    <span>{activeConv.avatarText || 'OD'}</span>
                    {activeConv.online && <span className="online-green-dot"></span>}
                  </div>
                  <div>
                    <h3>{activeConv.name || 'Order Chat'}</h3>
                    <span className="status-online-text">{activeConv.online ? 'Online' : 'Offline'}</span>
                  </div>
                </div>

                {activeConv.orderId && (
                  <button
                    className="view-order-btn"
                    onClick={() => navigateTo('orders')}
                  >
                    <FileText size={16} />
                    <span>View Order {activeConv.orderId.startsWith('#') ? activeConv.orderId : `#${activeConv.orderId}`}</span>
                  </button>
                )}
              </div>

              {/* Chat Thread Messages */}
              <div className="chat-messages-container">
                <div className="today-badge-row">
                  <span className="today-badge">TODAY</span>
                </div>

                {effectiveChatList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                    <MessageSquare size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                    <p style={{ margin: '0 0 6px', fontWeight: 600, color: '#4b5563' }}>No messages in this order yet</p>
                    <p style={{ fontSize: '0.85rem', margin: 0 }}>Type your question or request below to chat with the seller.</p>
                  </div>
                ) : (
                  effectiveChatList.map((msg, index) => {
                    const isMe = msg.sender === 'me' || msg.sender === 'customer';
                    return (
                      <div
                        key={msg.id || index}
                        className={`chat-msg-row ${isMe ? 'msg-me' : 'msg-them'}`}
                      >
                        {!isMe && (
                          <div className="msg-avatar-small">
                            <span>{activeConv.avatarText || 'ST'}</span>
                          </div>
                        )}

                        <div className="msg-bubble-group">
                          <div className="msg-bubble">
                            <p>{msg.text}</p>
                          </div>
                          {msg.time && <span className="msg-time">{msg.time}</span>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="chat-input-wrapper">
                <form className="chat-input-box" onSubmit={handleSendMessage}>
                  <div className="input-attachments">
                    <button type="button" className="attachment-btn" title="Add Image">
                      <ImageIcon size={18} />
                    </button>
                    <button type="button" className="attachment-btn" title="Attach File">
                      <Paperclip size={18} />
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />

                  <button type="submit" className="send-circle-btn" title="Send message" disabled={isSending}>
                    <Send size={16} />
                  </button>
                </form>
                <span className="chat-input-hint">Press Enter to send</span>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>
              <p>Select a conversation to view messages</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

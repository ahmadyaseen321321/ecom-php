import React, { useState, useEffect, useRef } from 'react';
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
  ArrowRight,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSocket } from '../context/SocketContext';
import { fetchConversationsApi, fetchOrderChatApi, sendOrderChatApi, sendOrderChatFilesApi, validateChatFiles, fetchOrdersApi, getImageUrl } from '../services/api';
import ChatAttachment from './ChatAttachment';
import './MessagesPage.css';

export default function MessagesPage() {
  const { navigateTo, user, openLoginModal, openSignupModal, showToast } = useCart();
  const { socket, isConnected, sendMessage: sendSocketMessage, joinOrder, leaveOrder } = useSocket();
  const [conversations, setConversations] = useState(() => {
    try {
      const cached = localStorage.getItem('conversations_cache');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [activeId, setActiveId] = useState(() => {
    try {
      const cached = localStorage.getItem('conversations_cache');
      if (cached) {
        const convs = JSON.parse(cached);
        return convs[0]?.id || null;
      }
    } catch {}
    return null;
  });
  const [activeTab, setActiveTab] = useState('All');
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  // Restore cached messages instantly so screen isn't blank on return
  const [chatMessages, setChatMessages] = useState(() => {
    try {
      const cached = localStorage.getItem('chat_messages_cache');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  // Start as false if we already have cached data — no spinner needed
  const [isLoading, setIsLoading] = useState(() => {
    try {
      const hasCachedConvs = !!localStorage.getItem('conversations_cache');
      return !hasCachedConvs;
    } catch { return true; }
  });
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // ─── Attachments (image / video) ─────────────────────────────
  const openFilePicker = (accept) => {
    if (!fileInputRef.current) return;
    fileInputRef.current.setAttribute('accept', accept);
    fileInputRef.current.value = '';
    fileInputRef.current.click();
  };

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length || !activeConv) return;

    const sizeProblem = validateChatFiles(files);
    if (sizeProblem) {
      showToast(sizeProblem);
      return;
    }

    const rawOrderId = activeConv.orderId || 'GENERAL';
    const orderIdentifier = rawOrderId === 'GENERAL'
      ? 'GENERAL'
      : rawOrderId.replace(/[^0-9]/g, '') || rawOrderId;

    // Same id is sent with the socket payload and to the API, so the echo of
    // this message matches the optimistic bubble instead of duplicating it
    const clientId = `client_${Date.now()}`;
    const localPreview = files.map((f) => URL.createObjectURL(f)).join(',');
    const mimeTypes = files.map((f) => f.type || '').join(',');

    setChatMessages((prev) => [...prev, {
      id: clientId,
      sender: 'me',
      text: '',
      attachment: localPreview,
      attachment_mime: mimeTypes,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    setIsUploading(true);
    try {
      const res = await sendOrderChatFilesApi(orderIdentifier, '', 'customer', files, clientId);
      const savedUrl = res?.attachment_url || res?.data?.attachment_url;

      if (!savedUrl) {
        // Nothing was stored server-side. Drop the bubble rather than
        // broadcasting a blob: URL that only exists in this browser tab.
        setChatMessages((prev) => prev.filter((m) => m.id !== clientId));
        showToast('Attachment upload failed — please try again');
        return;
      }

      // Replace the local blob preview with the persisted URL
      setChatMessages((prev) => prev.map((m) => (
        m.id === clientId ? { ...m, attachment: savedUrl, attachment_mime: null } : m
      )));

      // Real-time delivery to the seller (identical id → receiver dedupes)
      sendSocketMessage({
        id: clientId,
        orderId: orderIdentifier,
        message: '',
        senderType: 'customer',
        senderName: user?.full_name || user?.name || 'Customer',
        attachmentUrl: savedUrl
      });
    } catch (err) {
      console.warn('[Chat] Attachment upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    try {
      if (chatMessages.length > 0) {
        localStorage.setItem('chat_messages_cache', JSON.stringify(chatMessages.slice(-100)));
      }
    } catch {}
  }, [chatMessages]);

  useEffect(() => {
    if (user) {
      loadConversations();
    } else {
      // Clear cached messages when user logs out
      try {
        localStorage.removeItem('chat_messages_cache');
        localStorage.removeItem('conversations_cache');
      } catch {}
      setIsLoading(false);
    }
  }, [user]);

  const loadConversations = async () => {
    const hasCached = conversations.length > 0;
    if (!hasCached) setIsLoading(true);
    try {
      // Only fetch the latest order for the messages screen — passing limit=1 avoids
      // loading all 100+ orders just to display one conversation entry
      const ordersRes = await fetchOrdersApi(1);
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
          preview: `Latest Order ${latestOrderId} • Rs. ${totalAmount}`,
          unread: false,
          orders: ordersList,
          messages: []
        };

        setConversations([singleStoreConv]);
        setActiveId(singleStoreConv.id);
        try { localStorage.setItem('conversations_cache', JSON.stringify([singleStoreConv])); } catch {}
        // Don't await — let the UI render immediately, messages load in background
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
        try { localStorage.setItem('conversations_cache', JSON.stringify([defaultConv])); } catch {}
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
      // Only fetch the latest order's messages on initial load — fetching all orders
      // causes N parallel API calls (e.g. 115 orders = 115 requests) which is very slow.
      // Additional order chats can be loaded on demand when the user selects them.
      const latestId = ordersList && ordersList.length > 0
        ? String(ordersList[0].id).replace(/[^0-9]/g, '') || String(ordersList[0].id)
        : (fallbackOrderId.replace(/[^0-9]/g, '') || fallbackOrderId);

      const res = await fetchOrderChatApi(latestId).catch(() => null);
      const list = res?.messages || res?.data || [];

      if (Array.isArray(list) && list.length > 0) {
        const sorted = [...list].sort((a, b) =>
          new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
        );
        setChatMessages(sorted.map(m => ({
          id: m.id,
          sender: m.sender_type === 'customer' ? 'me' : 'them',
          text: m.message || m.text || '',
          attachment: m.attachment_url || null,
          attachment_mime: m.attachment_mime || null,
          time: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'
        })));
      } else {
        setChatMessages([]);
      }
    } catch (err) {
      console.warn('Error loading user chat messages:', err);
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
          attachment: m.attachment_url || null,
          attachment_mime: m.attachment_mime || null,
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

  const activeConv = conversations.find(
    (c) => String(c.id) === String(activeId) || String(c.orderId) === String(activeId)
  ) || conversations[0] || null;

  const activeConvRef = useRef(null);
  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);

  // Single stable socket listener — uses ref so no stale closure issues
  useEffect(() => {
    if (!socket) return;
    const handler = (msg) => {
      console.log('[MSG] received', msg);
      setChatMessages(prev => {
        const id = msg.id || `live_${Date.now()}`;
        if (prev.some(m => m.id === id)) return prev;
        const senderType = msg.sender_type || msg.senderType || '';
        return [...prev, {
          id,
          sender: senderType === 'seller' ? 'them' : 'me',
          text: msg.message || msg.text || '',
          attachment: msg.attachment_url || msg.attachmentUrl || null,
          attachment_mime: msg.attachment_mime || null,
          time: msg.created_at
            ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Just now',
        }];
      });
    };
    socket.on('receive_message', handler);
    return () => socket.off('receive_message', handler);
  }, [socket]);

  // Join socket room whenever the active conversation changes
  // Always use the clean numeric ID so we land in the same room as the seller.
  // Keyed on the ROOM ID (a stable string) instead of the conversation object,
  // otherwise every conversations reload tears the room down and re-creates it.
  const activeRoomId = (() => {
    const rawId = activeConv?.orderId || 'GENERAL';
    return rawId === 'GENERAL' ? 'GENERAL' : rawId.replace(/[^0-9]/g, '') || rawId;
  })();

  useEffect(() => {
    if (!activeRoomId || !socket) return;
    if (joinOrder) joinOrder(activeRoomId);
    return () => {
      if (leaveOrder) leaveOrder(activeRoomId);
    };
  }, [activeRoomId, socket]);

  const handleSelectConversation = (conv) => {
    const selectedId = conv.id || conv.orderId;
    setActiveId(selectedId);
    loadChatMessages(conv.orderId || conv.id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    const rawOrderId     = activeConv?.orderId || 'GENERAL';
    // Store with numeric ID for DB, emit with same for socket room matching
    const orderIdentifier = rawOrderId === 'GENERAL'
      ? 'GENERAL'
      : rawOrderId.replace(/[^0-9]/g, '') || rawOrderId;

    const newMsg = {
      id:     `client_${Date.now()}`,
      sender: 'me',
      text:   textToSend,
      time:   new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Instant optimistic add + clear input
    setChatMessages((prev) => {
      const updated = [...prev, newMsg];
      try { localStorage.setItem('chat_messages_cache', JSON.stringify(updated.slice(-100))); } catch {}
      return updated;
    });
    setInputText('');

    // Emit via Socket.IO — server broadcasts to the order room instantly
    sendSocketMessage({
      id:         newMsg.id,
      orderId:    orderIdentifier,
      message:    textToSend,
      senderType: 'customer',
      senderName: user?.full_name || user?.name || 'Customer',
    });

    // Persist to DB in background
    sendOrderChatApi(orderIdentifier, textToSend, 'customer', newMsg.id).catch((err) => {
      console.warn('[Chat] DB persist failed:', err);
    });
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
                            {msg.text ? <p>{msg.text}</p> : null}
                            <ChatAttachment url={msg.attachment} mimes={msg.attachment_mime} />
                          </div>
                          {msg.time && <span className="msg-time">{msg.time}</span>}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="chat-input-wrapper">
                <form className="chat-input-box" onSubmit={handleSendMessage}>
                  <div className="input-attachments">
                    <button
                      type="button"
                      className="attachment-btn"
                      title="Add Image or Video"
                      onClick={() => openFilePicker('image/*,video/*')}
                      disabled={isUploading}
                    >
                      <ImageIcon size={18} />
                    </button>
                    <button
                      type="button"
                      className="attachment-btn"
                      title="Attach File"
                      onClick={() => openFilePicker('image/*,video/*,.pdf,.doc,.docx,.txt,.zip')}
                      disabled={isUploading}
                    >
                      <Paperclip size={18} />
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFilesSelected}
                  />

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
                <span className="chat-input-hint">
                  {isUploading ? 'Uploading attachment…' : 'Press Enter to send'}
                </span>
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

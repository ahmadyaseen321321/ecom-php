import React, { useState } from 'react';
import {
  Search,
  ShoppingBag,
  Bell,
  User,
  Paperclip,
  Image as ImageIcon,
  Send,
  FileText
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import './MessagesPage.css';

const CONVERSATIONS_DATA = [
  {
    id: 1,
    name: 'Artisan Ceramics',
    orderId: 'NVN-8842',
    avatarText: 'AC',
    avatarImg: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=200&q=80',
    online: true,
    time: 'Just now',
    preview: 'Yes, the Forest Green is finally back in stock!',
    unread: false,
    messages: [
      {
        id: 101,
        sender: 'me',
        text: 'Hi there! I ordered the Forest Green Ceramic Mug a while back but it was out of stock. Just checking if you have any updates on when it might be available again?',
        time: '10:24 AM'
      },
      {
        id: 102,
        sender: 'them',
        text: 'Hello Alex! Thank you for following up.',
        time: '10:31 AM'
      },
      {
        id: 103,
        sender: 'them',
        text: 'Good news - Yes, the Forest Green is finally back in stock! We just finished unloading the kiln this morning. Your order is being packed right now and will ship out this afternoon.',
        time: '10:31 AM'
      }
    ]
  },
  {
    id: 2,
    name: 'EcoWeave Textiles',
    orderId: 'NVN-8119',
    avatarText: 'ET',
    avatarImg: null,
    online: false,
    time: 'Yesterday',
    preview: 'Your tracking number is TRK-992-LW',
    unread: true,
    messages: [
      {
        id: 201,
        sender: 'them',
        text: 'Your tracking number is TRK-992-LW',
        time: 'Yesterday'
      }
    ]
  },
  {
    id: 3,
    name: 'Zenith Woodworks',
    orderId: 'NVN-7540',
    avatarText: 'ZW',
    avatarImg: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=200&q=80',
    online: false,
    time: 'Oct 12',
    preview: 'We are processing your return now.',
    unread: false,
    messages: [
      {
        id: 301,
        sender: 'them',
        text: 'We are processing your return now.',
        time: 'Oct 12'
      }
    ]
  }
];

export default function MessagesPage() {
  const { navigateTo, totalCartCount, setIsAuthModalOpen, user } = useCart();
  const [conversations, setConversations] = useState(CONVERSATIONS_DATA);
  const [activeId, setActiveId] = useState(1);
  const [activeTab, setActiveTab] = useState('All');
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const activeConv = conversations.find((c) => c.id === activeId) || conversations[0];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'me',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeId) {
          return {
            ...c,
            time: 'Just now',
            preview: newMsg.text,
            messages: [...c.messages, newMsg]
          };
        }
        return c;
      })
    );

    setInputText('');

    // Simulate auto reply
    setTimeout(() => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeId) {
            return {
              ...c,
              time: 'Just now',
              messages: [
                ...c.messages,
                {
                  id: Date.now() + 1,
                  sender: 'them',
                  text: 'Thanks for reaching out! We will reply to your inquiry shortly.',
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              ]
            };
          }
          return c;
        })
      );
    }, 1200);
  };

  const filteredConversations = conversations.filter((c) => {
    if (activeTab === 'Unread' && !c.unread) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.orderId.toLowerCase().includes(q) ||
        c.preview.toLowerCase().includes(q)
      );
    }
    return true;
  });

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
            {filteredConversations.map((c) => (
              <div
                key={c.id}
                className={`sidebar-conv-card ${c.id === activeId ? 'active' : ''}`}
                onClick={() => setActiveId(c.id)}
              >
                <div className="conv-thumb">
                  {c.avatarImg ? (
                    <img src={c.avatarImg} alt={c.name} />
                  ) : (
                    <div className="conv-icon-placeholder">
                      <FileText size={20} color="#6b7280" />
                    </div>
                  )}
                </div>

                <div className="conv-info font-family">
                  <div className="conv-name-row">
                    <span className="conv-name">{c.name}</span>
                    <span className="conv-time">{c.time}</span>
                  </div>
                  <span className="conv-order-id">ORDER #{c.orderId}</span>
                  <p className="conv-preview">{c.preview}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Right Chat Main Section */}
        <main className="messages-chat-area">
          {/* Chat Header */}
          <div className="chat-header-bar">
            <div className="chat-user-profile">
              <div className="chat-avatar-circle">
                <span>{activeConv.avatarText}</span>
                {activeConv.online && <span className="online-green-dot"></span>}
              </div>
              <div>
                <h3>{activeConv.name}</h3>
                <span className="status-online-text">{activeConv.online ? 'Online' : 'Offline'}</span>
              </div>
            </div>

            <button
              className="view-order-btn"
              onClick={() => navigateTo('orders')}
            >
              <FileText size={16} />
              <span>View Order #{activeConv.orderId}</span>
            </button>
          </div>

          {/* Chat Thread Messages */}
          <div className="chat-messages-container">
            <div className="today-badge-row">
              <span className="today-badge">TODAY</span>
            </div>

            {activeConv.messages.map((msg, index) => {
              const isMe = msg.sender === 'me';
              return (
                <div
                  key={msg.id || index}
                  className={`chat-msg-row ${isMe ? 'msg-me' : 'msg-them'}`}
                >
                  {!isMe && (
                    <div className="msg-avatar-small">
                      <span>{activeConv.avatarText}</span>
                    </div>
                  )}

                  <div className="msg-bubble-group">
                    <div className="msg-bubble">
                      <p>{msg.text}</p>
                    </div>
                    <span className="msg-time">{msg.time}</span>
                  </div>
                </div>
              );
            })}
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

              <button type="submit" className="send-circle-btn" title="Send message">
                <Send size={16} />
              </button>
            </form>
            <span className="chat-input-hint">Press Enter to send, Shift+Enter for new line</span>
          </div>
        </main>
      </div>
    </div>
  );
}

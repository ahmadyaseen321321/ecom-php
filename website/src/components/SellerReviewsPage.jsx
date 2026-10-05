import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import {
  Star,
  Download,
  Package,
  Store,
  ChevronLeft,
  ChevronRight,
  Send
} from 'lucide-react';
import './SellerReviewsPage.css';

const DEMO_REVIEWS = [
  {
    id: 'rev-1',
    author: 'Eleanor Vance',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    rating: 4,
    date: 'Oct 24, 2023',
    product: 'Bamboo Fiber Bed Sheets - Queen',
    comment: 'The quality of these sheets is phenomenal. They are incredibly soft and sleep very cool, which is exactly what I was looking for. My only minor gripe is that the fitted sheet is a bit loose on my mattress, but it\'s not a dealbreaker. Would definitely recommend!',
    hasResponse: false,
    placeholder: 'Write a public response to Eleanor...',
    accent: true
  },
  {
    id: 'rev-2',
    author: 'Marcus Thorne',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    rating: 5,
    date: 'Oct 22, 2023',
    product: 'Ceramic Minimalist Planter Set',
    comment: 'Absolutely stunning planters! They arrived perfectly packaged with zero damage. The matte finish is exactly as described and they fit my aesthetic perfectly. The drainage hole mechanism is also very clever. 10/10.',
    hasResponse: true,
    reply: {
      author: 'Novanest Support',
      date: 'Oct 23, 2023',
      text: 'Hi Marcus, thank you so much for the glowing review! We are thrilled to hear that the planters arrived safely and fit your aesthetic. We put a lot of thought into the packaging and design, so your feedback means the world to us. Enjoy your new setup!'
    }
  },
  {
    id: 'rev-3',
    author: 'Sarah Jenkins',
    initials: 'SJ',
    rating: 2,
    date: 'Oct 20, 2023',
    product: 'Recycled Glass Carafe',
    comment: 'The design is nice, but it arrived with a slight scratch on the side. It\'s usable, but for the price point, I expected better quality control. Delivery was fast though.',
    hasResponse: false,
    placeholder: 'Draft a resolution or apology to Sarah...',
    secondaryBtnText: 'Mark as Resolved',
    accent: true
  }
];

export default function SellerReviewsPage() {
  const { showToast } = useCart();
  const [reviewsList, setReviewsList] = useState(DEMO_REVIEWS);
  const [replyInputMap, setReplyInputMap] = useState({});
  const [filterTab, setFilterTab] = useState('All Status');
  const [sortOption, setSortOption] = useState('Most Recent');

  const handleReplyChange = (id, text) => {
    setReplyInputMap((prev) => ({ ...prev, [id]: text }));
  };

  const handleSubmitReply = (id, author) => {
    const text = replyInputMap[id] || '';
    if (!text.trim()) {
      showToast('Please type a response before submitting');
      return;
    }

    setReviewsList((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            hasResponse: true,
            reply: {
              author: 'Novanest Support',
              date: 'Just now',
              text: text
            }
          };
        }
        return r;
      })
    );

    showToast(`Response published to ${author}`);
    setReplyInputMap((prev) => ({ ...prev, [id]: '' }));
  };

  const handleIgnoreOrResolve = (id, actionName) => {
    showToast(`Review marked as ${actionName}`);
  };

  return (
    <div className="seller-reviews-page animate-fade-in">
      {/* Top Title & Overall Rating Header */}
      <div className="reviews-main-header">
        <div>
          <h1 className="page-title">Customer Reviews</h1>
          <div className="overall-score-row">
            <div className="stars-flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={18}
                  fill={star <= 4 ? '#283A2E' : '#d1d5db'}
                  color={star <= 4 ? '#283A2E' : '#d1d5db'}
                />
              ))}
            </div>
            <span className="score-num font-extrabold">4.8</span>
            <span className="score-subtext">out of 5.0 based on 1.2k reviews</span>
          </div>
        </div>

        <button className="export-report-btn" onClick={() => showToast('Reviews report exported')}>
          <Download size={16} />
          <span>Export Report</span>
        </button>
      </div>

      {/* Filter & Sort Bar */}
      <div className="reviews-toolbar-card">
        <div className="filter-left-pills">
          <span className="filter-label">Filter by:</span>
          {['All Status', 'Needs Response', '5 Stars Only'].map((tab) => (
            <button
              key={tab}
              className={`rev-filter-pill ${filterTab === tab ? 'active' : ''}`}
              onClick={() => setFilterTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="sort-right-select">
          <span className="filter-label">Sort by:</span>
          <select
            className="rev-sort-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="Most Recent">Most Recent</option>
            <option value="Highest Rating">Highest Rating</option>
            <option value="Lowest Rating">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* Reviews Cards List */}
      <div className="reviews-cards-stack">
        {reviewsList.map((rev) => (
          <div
            key={rev.id}
            className={`review-item-card ${rev.accent ? 'accent-border' : ''}`}
          >
            {/* Card Header */}
            <div className="rev-card-top">
              <div className="rev-author-box">
                {rev.avatar ? (
                  <img src={rev.avatar} alt={rev.author} className="rev-avatar-img" />
                ) : (
                  <div className="rev-avatar-initials">{rev.initials}</div>
                )}
                <div>
                  <h3 className="rev-author-name">{rev.author}</h3>
                  <div className="rev-stars-date-row">
                    <div className="stars-mini-row">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          fill={s <= rev.rating ? '#283A2E' : '#d1d5db'}
                          color={s <= rev.rating ? '#283A2E' : '#d1d5db'}
                        />
                      ))}
                    </div>
                    <span className="rev-dot-sep">•</span>
                    <span className="rev-date-str">{rev.date}</span>
                  </div>
                </div>
              </div>

              <div className="product-tag-badge">
                <Package size={14} />
                <span>{rev.product}</span>
              </div>
            </div>

            {/* Review Comment Content */}
            <p className="rev-comment-body">{rev.comment}</p>

            {/* Existing Seller Reply (if published) */}
            {rev.hasResponse && rev.reply && (
              <div className="existing-reply-box">
                <div className="reply-header">
                  <Store size={15} className="store-icon" />
                  <strong>{rev.reply.author}</strong>
                  <span className="rev-date-str">{rev.reply.date}</span>
                </div>
                <p className="reply-text-content">{rev.reply.text}</p>
              </div>
            )}

            {/* Reply Input Form (if no response published yet) */}
            {!rev.hasResponse && (
              <div className="reply-input-section">
                <textarea
                  rows="3"
                  className="rev-reply-textarea"
                  placeholder={rev.placeholder}
                  value={replyInputMap[rev.id] || ''}
                  onChange={(e) => handleReplyChange(rev.id, e.target.value)}
                />
                <div className="reply-actions-row">
                  <button
                    className="flat-action-btn"
                    onClick={() => handleIgnoreOrResolve(rev.id, rev.secondaryBtnText || 'Ignored')}
                  >
                    {rev.secondaryBtnText || 'Ignore'}
                  </button>
                  <button
                    className="submit-reply-btn"
                    onClick={() => handleSubmitReply(rev.id, rev.author)}
                  >
                    Submit Response
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination Footer */}
      <div className="products-table-pagination mt-24">
        <span className="entries-count-text">Showing 1 to 3 of 124 reviews</span>
        <div className="pagination-pills-row">
          <button className="pagi-arrow"><ChevronLeft size={16} /></button>
          <button className="pagi-num active">1</button>
          <button className="pagi-num">2</button>
          <button className="pagi-num">3</button>
          <span className="pagi-dots">...</span>
          <button className="pagi-arrow"><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}

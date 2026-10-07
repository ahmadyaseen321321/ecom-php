import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { fetchSellerReviewsApi, replySellerReviewApi } from '../services/api';
import {
  Star,
  Download,
  Package,
  Store,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  MessageSquare
} from 'lucide-react';
import './SellerReviewsPage.css';

export default function SellerReviewsPage() {
  const { showToast } = useCart();
  const [reviewsList, setReviewsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyInputMap, setReplyInputMap] = useState({});
  const [filterTab, setFilterTab] = useState('All Status');
  const [sortOption, setSortOption] = useState('Most Recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [submittingReplyId, setSubmittingReplyId] = useState(null);
  const REVIEWS_PER_PAGE = 5;

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const res = await fetchSellerReviewsApi();
      const list = res?.data || (Array.isArray(res) ? res : []);
      
      const formatted = list.map((r) => {
        const authorName = r.user_name || r.full_name || 'Customer';
        const dateStr = r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';
        const hasResp = Boolean(r.reply);

        return {
          id: r.id,
          author: authorName,
          initials: authorName.substring(0, 2).toUpperCase(),
          avatar: null,
          rating: parseInt(r.rating) || 5,
          date: dateStr,
          rawDate: r.created_at || '',
          product: r.product_name || 'Product',
          comment: r.comment || 'No written comment provided.',
          hasResponse: hasResp,
          reply: hasResp ? {
            author: 'Store Response',
            date: r.replied_at ? new Date(r.replied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently',
            text: r.reply
          } : null,
          placeholder: `Write a public response to ${authorName}...`,
          accent: !hasResp
        };
      });

      setReviewsList(formatted);
    } catch (err) {
      console.error('Failed to load seller reviews:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplyChange = (id, text) => {
    setReplyInputMap((prev) => ({ ...prev, [id]: text }));
  };

  const handleSubmitReply = async (id, author) => {
    const text = replyInputMap[id] || '';
    if (!text.trim()) {
      showToast('Please type a response before submitting');
      return;
    }

    setSubmittingReplyId(id);
    try {
      await replySellerReviewApi(id, text.trim());
      
      setReviewsList((prev) =>
        prev.map((r) => {
          if (r.id === id) {
            return {
              ...r,
              hasResponse: true,
              reply: {
                author: 'Store Response',
                date: 'Just now',
                text: text.trim()
              }
            };
          }
          return r;
        })
      );

      showToast(`Response published to ${author}`);
      setReplyInputMap((prev) => ({ ...prev, [id]: '' }));
    } catch (err) {
      showToast('Failed to post reply. Please try again.');
    } finally {
      setSubmittingReplyId(null);
    }
  };

  const handleIgnoreOrResolve = (id, actionName) => {
    showToast(`Review marked as ${actionName}`);
  };

  const handleExportCSV = () => {
    if (reviewsList.length === 0) {
      showToast('No reviews to export');
      return;
    }
    const headers = ['Review ID', 'Product', 'Author', 'Rating', 'Comment', 'Reply', 'Date'];
    const rows = reviewsList.map(r => [
      r.id,
      `"${r.product.replace(/"/g, '""')}"`,
      `"${r.author.replace(/"/g, '""')}"`,
      r.rating,
      `"${r.comment.replace(/"/g, '""')}"`,
      `"${(r.reply?.text || '').replace(/"/g, '""')}"`,
      r.date
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customer_reviews.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Reviews report exported');
  };

  // Compute live rating stats
  const totalReviewsCount = reviewsList.length;
  const avgRating = totalReviewsCount > 0 
    ? (reviewsList.reduce((acc, r) => acc + r.rating, 0) / totalReviewsCount).toFixed(1)
    : '5.0';

  // Filter and sort reviews
  const filteredAndSortedReviews = useMemo(() => {
    let list = [...reviewsList];

    if (filterTab === 'Needs Response') {
      list = list.filter(r => !r.hasResponse);
    } else if (filterTab === '5 Stars Only') {
      list = list.filter(r => r.rating === 5);
    }

    if (sortOption === 'Highest Rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortOption === 'Lowest Rating') {
      list.sort((a, b) => a.rating - b.rating);
    } else {
      // Most Recent
      list.sort((a, b) => new Date(b.rawDate || 0) - new Date(a.rawDate || 0));
    }

    return list;
  }, [reviewsList, filterTab, sortOption]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedReviews.length / REVIEWS_PER_PAGE));
  const paginatedReviews = filteredAndSortedReviews.slice(
    (currentPage - 1) * REVIEWS_PER_PAGE,
    currentPage * REVIEWS_PER_PAGE
  );

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
                  fill={star <= Math.round(Number(avgRating)) ? '#283A2E' : '#d1d5db'}
                  color={star <= Math.round(Number(avgRating)) ? '#283A2E' : '#d1d5db'}
                />
              ))}
            </div>
            <span className="score-num font-extrabold">{avgRating}</span>
            <span className="score-subtext">out of 5.0 based on {totalReviewsCount} live {totalReviewsCount === 1 ? 'review' : 'reviews'}</span>
          </div>
        </div>

        <button className="export-report-btn" onClick={handleExportCSV}>
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
              onClick={() => { setFilterTab(tab); setCurrentPage(1); }}
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
            onChange={(e) => { setSortOption(e.target.value); setCurrentPage(1); }}
          >
            <option value="Most Recent">Most Recent</option>
            <option value="Highest Rating">Highest Rating</option>
            <option value="Lowest Rating">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* Reviews Cards List */}
      <div className="reviews-cards-stack">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
            <Loader2 size={28} className="admin-spin" style={{ margin: '0 auto 10px', display: 'block' }} />
            Loading customer reviews...
          </div>
        ) : paginatedReviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af', background: '#fff', borderRadius: '16px' }}>
            <MessageSquare size={36} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
            <h3 style={{ margin: '0 0 6px', color: '#374151' }}>No reviews found</h3>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>Customer reviews for your store products will appear here.</p>
          </div>
        ) : (
          paginatedReviews.map((rev) => (
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
                      onClick={() => handleIgnoreOrResolve(rev.id, 'Resolved')}
                    >
                      Mark as Resolved
                    </button>
                    <button
                      className="submit-reply-btn"
                      disabled={submittingReplyId === rev.id}
                      onClick={() => handleSubmitReply(rev.id, rev.author)}
                    >
                      {submittingReplyId === rev.id ? 'Submitting...' : 'Submit Response'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination Footer */}
      {filteredAndSortedReviews.length > 0 && (
        <div className="products-table-pagination mt-24">
          <span className="entries-count-text">
            Showing {(currentPage - 1) * REVIEWS_PER_PAGE + 1} to {Math.min(currentPage * REVIEWS_PER_PAGE, filteredAndSortedReviews.length)} of {filteredAndSortedReviews.length} reviews
          </span>
          <div className="pagination-pills-row">
            <button className="pagi-arrow" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}><ChevronLeft size={16} /></button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(num => (
              <button key={num} className={`pagi-num ${currentPage === num ? 'active' : ''}`} onClick={() => setCurrentPage(num)}>{num}</button>
            ))}
            {totalPages > 5 && <span className="pagi-dots">...</span>}
            <button className="pagi-arrow" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { fetchSellerOrdersApi, getImageUrl } from '../services/api';
import {
  Search,
  Download,
  Printer,
  Eye,
  Truck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  MessageSquare
} from 'lucide-react';
import './SellerOrdersPage.css';

export default function SellerOrdersPage({ orders: propOrders, onSelectOrder, onExportCSV, onOpenOrderChat }) {
  const { showToast } = useCart();
  const [orders, setOrders] = useState(propOrders || []);
  const [isLoading, setIsLoading] = useState(!propOrders || propOrders.length === 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const ORDERS_PER_PAGE = 10;

  useEffect(() => {
    if (propOrders && propOrders.length > 0) {
      setOrders(propOrders);
      setIsLoading(false);
    } else {
      loadOrders();
    }
  }, [propOrders]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetchSellerOrdersApi(90);
      if (res) {
        const list = Array.isArray(res) ? res : (res.data || []);
        setOrders(list);
      }
    } catch (err) {
      console.error('Failed to load seller orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getNormalizedStatus = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('deliver')) return { label: 'Delivered', type: 'delivered' };
    if (s.includes('ship')) return { label: 'Shipped', type: 'shipped' };
    if (s.includes('ready') || s.includes('pend')) return { label: 'Ready to Ship', type: 'ready' };
    if (s.includes('progress') || s.includes('process') || s.includes('confirm')) return { label: 'In Progress', type: 'progress' };
    if (s.includes('cancel')) return { label: 'Cancelled', type: 'cancelled' };
    return { label: status || 'Pending', type: 'ready' };
  };

  const filteredOrders = orders.filter((ord) => {
    const idStr = String(ord.id || ord.order_id || '');
    const custStr = String(ord.customer_name || ord.customerName || ord.customer || '');
    const matchesSearch =
      !searchQuery ||
      idStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      custStr.toLowerCase().includes(searchQuery.toLowerCase());

    const norm = getNormalizedStatus(ord.status || ord.order_status);
    const matchesStatus =
      statusFilter === 'ALL' ||
      norm.label.toLowerCase() === statusFilter.toLowerCase() ||
      String(ord.status || '').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE);

  return (
    <div className="seller-orders-management-view animate-fade-in">
      {/* Top Header Row */}
      <div className="management-header-row">
        <div className="header-text-block">
          <h1 className="page-title">Orders Management</h1>
          <p className="page-subtitle">Review and process your store's live database orders.</p>
        </div>
        <div className="header-btn-actions">
          <button className="export-csv-btn" onClick={onExportCSV || (() => showToast('Orders CSV downloaded'))}>
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button className="print-labels-btn" onClick={() => showToast('Printing label batch...')}>
            <Printer size={15} />
            <span>Print Labels</span>
          </button>
        </div>
      </div>

      {/* Main Card Wrapper */}
      <div className="dashboard-widget-card orders-table-card">
        {/* Search & Status Filter Bar */}
        <div className="orders-filter-toolbar">
          <div className="orders-search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by Order ID, Customer, or Product..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div className="status-filter-pills-row">
            {['All Orders', 'Ready to Ship', 'In Progress', 'Shipped', 'Delivered'].map((pill, idx) => (
              <button
                key={idx}
                className={`status-tab-pill ${statusFilter === pill || (idx === 0 && statusFilter === 'ALL') ? 'active' : ''}`}
                onClick={() => { setStatusFilter(idx === 0 ? 'ALL' : pill); setCurrentPage(1); }}
              >
                {pill}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="table-scroll-container">
          <table className="seller-orders-table">
            <thead>
              <tr>
                <th className="check-col"><input type="checkbox" /></th>
                <th>Order ID</th>
                <th>Customer Name</th>
                <th>Date</th>
                <th>Total Price</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <Loader2 size={20} className="admin-spin" /> Loading orders...
                    </div>
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    <Package size={36} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.5 }} />
                    No orders found
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((ord) => {
                  const statusInfo = getNormalizedStatus(ord.status || ord.order_status);
                  const orderDisplayId = String(ord.id).startsWith('#') ? ord.id : `#ORD-${ord.id || ord.order_id}`;
                  const customerName = ord.customer_name || ord.customerName || ord.customer || 'Customer';
                  const dateStr = ord.date || ord.created_at ? new Date(ord.date || ord.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';
                  const totalVal = Number(ord.total || ord.total_amount || 0).toLocaleString();
                  const firstItem = Array.isArray(ord.items) && ord.items.length > 0 ? ord.items[0] : null;
                  const itemImg = firstItem?.main_image ? getImageUrl(firstItem.main_image) : (ord.image || 'https://placehold.co/60x60?text=Order');

                  return (
                    <tr key={ord.id || ord.order_id} onClick={() => onSelectOrder && onSelectOrder({ ...ord, id: orderDisplayId, customer: customerName, total: totalVal, status: statusInfo.label, date: dateStr })} style={{ cursor: 'pointer' }}>
                      <td className="check-col" onClick={(e) => e.stopPropagation()}><input type="checkbox" /></td>
                      <td>
                        <div className="order-id-cell">
                          <img src={itemImg} alt="" className="order-prod-thumb" onError={(e) => { e.target.style.display = 'none'; }} />
                          <strong className="order-id-text">{orderDisplayId}</strong>
                        </div>
                      </td>
                      <td>
                        <div className="customer-cell">
                          <div className="admin-user-avatar" style={{ width: 28, height: 28, fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#e0e7ff', color: '#3730a3', fontWeight: 700, marginRight: 8 }}>
                            {customerName.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="customer-name-txt">{customerName}</span>
                        </div>
                      </td>
                      <td className="date-cell">{dateStr}</td>
                      <td className="total-price-cell">Rs. {totalVal}</td>
                      <td>
                        <span className={`s-status-badge ${statusInfo.type}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="table-action-icons-row">
                          <button
                            className="act-icon-btn chat-icon-btn"
                            title="Chat with Buyer"
                            onClick={() => onOpenOrderChat && onOpenOrderChat({ ...ord, id: orderDisplayId, customer: customerName, total: totalVal, status: statusInfo.label, date: dateStr })}
                          >
                            <MessageSquare size={16} />
                          </button>
                          <button className="act-icon-btn" title="View Details" onClick={() => onSelectOrder && onSelectOrder({ ...ord, id: orderDisplayId, customer: customerName, total: totalVal, status: statusInfo.label, date: dateStr })}>
                            <Eye size={16} />
                          </button>
                          <button className="act-icon-btn" title="Print Label" onClick={() => showToast(`Printing label for ${orderDisplayId}`)}>
                            <Printer size={16} />
                          </button>
                          <button className="act-icon-btn" title="Track Order" onClick={() => showToast(`Tracking order ${orderDisplayId}`)}>
                            <Truck size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="products-table-pagination">
          <span className="entries-count-text">
            Showing {filteredOrders.length === 0 ? 0 : (currentPage - 1) * ORDERS_PER_PAGE + 1} to {Math.min(currentPage * ORDERS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length} orders
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
      </div>
    </div>
  );
}

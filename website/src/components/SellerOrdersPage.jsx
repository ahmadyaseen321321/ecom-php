import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import {
  Search,
  Download,
  Printer,
  Eye,
  Truck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import './SellerOrdersPage.css';

const DEMO_SELLER_ORDERS = [
  { id: '#ORD-2023-0892', customer: 'Elena Jenkins', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', date: 'Oct 24, 2023', total: '124.50', status: 'Ready to Ship', statusType: 'ready', image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=100&auto=format&fit=crop&q=80' },
  { id: '#ORD-2023-0891', customer: 'Marcus Reed', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', date: 'Oct 24, 2023', total: '89.99', status: 'In Progress', statusType: 'progress', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=100&auto=format&fit=crop&q=80' },
  { id: '#ORD-2023-0885', customer: 'Sarah Williams', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80', date: 'Oct 22, 2023', total: '342.00', status: 'Shipped', statusType: 'shipped', image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=100&auto=format&fit=crop&q=80' },
  { id: '#ORD-2023-0870', customer: 'Thomas Chen', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', date: 'Oct 20, 2023', total: '45.00', status: 'Delivered', statusType: 'delivered', image: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=100&auto=format&fit=crop&q=80' },
  { id: '#ORD-2023-0865', customer: 'James Wilson', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80', date: 'Oct 19, 2023', total: '210.00', status: 'Ready to Ship', statusType: 'ready', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=100&auto=format&fit=crop&q=80' },
  { id: '#ORD-2023-0860', customer: 'Robert Fox', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80', date: 'Oct 18, 2023', total: '55.20', status: 'Shipped', statusType: 'shipped', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&auto=format&fit=crop&q=80' },
  { id: '#ORD-2023-0855', customer: 'Linda May', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80', date: 'Oct 17, 2023', total: '12.99', status: 'Delivered', statusType: 'delivered', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100&auto=format&fit=crop&q=80' },
  { id: '#ORD-2023-0850', customer: 'Emily Davis', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80', date: 'Oct 16, 2023', total: '320.00', status: 'In Progress', statusType: 'progress', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80' }
];

export default function SellerOrdersPage({ onSelectOrder, onExportCSV }) {
  const { showToast } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredOrders = DEMO_SELLER_ORDERS.filter((ord) => {
    const matchesSearch =
      ord.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || ord.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="seller-orders-management-view animate-fade-in">
      {/* Top Header Row */}
      <div className="management-header-row">
        <div className="header-text-block">
          <h1 className="page-title">Orders Management</h1>
          <p className="page-subtitle">Review and process your store's orders.</p>
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
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="status-filter-pills-row">
            {['All Orders', 'Ready to Ship', 'In Progress', 'Shipped', 'Delivered'].map((pill, idx) => (
              <button
                key={idx}
                className={`status-tab-pill ${statusFilter === pill || (idx === 0 && statusFilter === 'ALL') ? 'active' : ''}`}
                onClick={() => setStatusFilter(idx === 0 ? 'ALL' : pill)}
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
              {filteredOrders.map((ord) => (
                <tr key={ord.id} onClick={() => onSelectOrder && onSelectOrder(ord)} style={{ cursor: 'pointer' }}>
                  <td className="check-col" onClick={(e) => e.stopPropagation()}><input type="checkbox" /></td>
                  <td>
                    <div className="order-id-cell">
                      <img src={ord.image} alt="" className="order-prod-thumb" />
                      <strong className="order-id-text">{ord.id}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="customer-cell">
                      <img src={ord.avatar} alt={ord.customer} className="customer-avatar-thumb" />
                      <span className="customer-name-txt">{ord.customer}</span>
                    </div>
                  </td>
                  <td className="date-cell">{ord.date}</td>
                  <td className="total-price-cell">${ord.total}</td>
                  <td>
                    <span className={`s-status-badge ${ord.statusType}`}>
                      {ord.status}
                    </span>
                  </td>
                  <td className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="table-action-icons-row">
                      <button className="act-icon-btn" title="View Details" onClick={() => onSelectOrder && onSelectOrder(ord)}>
                        <Eye size={16} />
                      </button>
                      {ord.statusType === 'ready' && (
                        <button className="act-icon-btn" title="Print Label" onClick={() => showToast(`Printing label for ${ord.id}`)}>
                          <Printer size={16} />
                        </button>
                      )}
                      {ord.statusType === 'shipped' && (
                        <button className="act-icon-btn" title="Track Order" onClick={() => showToast(`Tracking order ${ord.id}`)}>
                          <Truck size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="products-table-pagination">
          <span className="entries-count-text">Showing 1 to {filteredOrders.length} of 124 orders</span>
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
    </div>
  );
}

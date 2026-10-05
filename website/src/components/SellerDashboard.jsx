import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import SellerOrdersPage from './SellerOrdersPage';
import SellerOrderDetailPage from './SellerOrderDetailPage';
import SellerReviewsPage from './SellerReviewsPage';
import SellerShipmentPage from './SellerShipmentPage';
import SellerSettingsPage from './SellerSettingsPage';
import SellerBannersNotificationsPage from './SellerBannersNotificationsPage';
import {
  fetchSellerStatsApi,
  fetchSellerOrdersApi,
  updateSellerOrderStatusApi,
  fetchSellerReviewsApi,
  replySellerReviewApi,
  fetchSellerProductsApi,
  addSellerProductApi,
  deleteSellerProductApi,
  getImageUrl
} from '../services/api';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Star,
  Plus,
  Filter,
  Search,
  MessageSquare,
  Trash2,
  Pencil,
  Eye,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Store,
  Settings,
  User,
  Truck,
  Users2,
  HelpCircle,
  MoreHorizontal,
  Mic,
  DollarSign,
  Lock,
  Grid,
  Lightbulb,
  X,
  Image,
  Paperclip,
  Send,
  Printer,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  Calendar,
  ArrowLeft,
  Download,
  CreditCard,
  Bell,
  LogOut
} from 'lucide-react';
import './SellerDashboard.css';

export default function SellerDashboard() {
  const { user, logout, showToast } = useCart();

  // Active Tab: 'overview' | 'products' | 'orders' | 'reviews'
  const [activeTab, setActiveTab] = useState('overview');

  // Stats & Timeframe
  const [timeframeDays, setTimeframeDays] = useState(30);
  const [stats, setStats] = useState(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // Orders State
  const [sellerOrders, setSellerOrders] = useState([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');

  // Products State
  const [sellerProducts, setSellerProducts] = useState([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // Reviews State
  const [sellerReviews, setSellerReviews] = useState([]);
  const [replyInputMap, setReplyInputMap] = useState({});

  // Selected Order for Full Screen Detail
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedSellerOrder, setSelectedSellerOrder] = useState(null);

  // Edit Product State
  const [editingProduct, setEditingProduct] = useState(null);

  // Add Product State
  const [showAddProductView, setShowAddProductView] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    discount_price: '',
    stock: '10',
    category_id: '1',
    image: '',
    sku: '',
  });

  // Settings Drawer State
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);

  // Load Dashboard Stats
  const loadStats = async (days = timeframeDays) => {
    setIsStatsLoading(true);
    try {
      const res = await fetchSellerStatsApi(days);
      if (res && (res.status === 'success' || res.data)) {
        setStats(res.data || res);
      }
    } catch (err) {
      console.error('Failed to load seller stats:', err);
    } finally {
      setIsStatsLoading(false);
    }
  };

  // Load Seller Orders
  const loadOrders = async (days = timeframeDays) => {
    setIsOrdersLoading(true);
    try {
      const res = await fetchSellerOrdersApi(days);
      if (res) {
        const list = Array.isArray(res) ? res : (res.data || []);
        setSellerOrders(list);
      }
    } catch (err) {
      console.error('Failed to load seller orders:', err);
    } finally {
      setIsOrdersLoading(false);
    }
  };

  // Load Seller Products
  const loadProducts = async () => {
    setIsProductsLoading(true);
    try {
      const res = await fetchSellerProductsApi();
      if (res) {
        const list = Array.isArray(res) ? res : (res.data || []);
        setSellerProducts(list);
      }
    } catch (err) {
      console.error('Failed to load seller products:', err);
    } finally {
      setIsProductsLoading(false);
    }
  };

  // Load Seller Reviews
  const loadReviews = async () => {
    try {
      const res = await fetchSellerReviewsApi();
      if (res) {
        const list = Array.isArray(res) ? res : (res.data || []);
        setSellerReviews(list);
      }
    } catch (err) {
      console.error('Failed to load seller reviews:', err);
    }
  };

  useEffect(() => {
    loadStats(timeframeDays);
    loadOrders(timeframeDays);
    loadProducts();
    loadReviews();
  }, [timeframeDays]);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateSellerOrderStatusApi(orderId, newStatus);
      showToast(`Order #${orderId} set to ${newStatus}`);
      loadOrders(timeframeDays);
      loadStats(timeframeDays);
    } catch (err) {
      showToast('Failed to update order status');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await deleteSellerProductApi(productId);
      showToast('Product removed');
      loadProducts();
      loadStats(timeframeDays);
    } catch (err) {
      showToast('Failed to delete product');
    }
  };

  const handleExportCSV = () => {
    if (!sellerOrders || sellerOrders.length === 0) {
      showToast('No orders to export');
      return;
    }
    const headers = ['Order ID', 'Date', 'Customer Name', 'Total (PKR)', 'Status'];
    const rows = sellerOrders.map((o) => [
      o.id || o.order_id,
      o.created_at || o.date || '',
      `"${o.customer_name || o.full_name || 'Customer'}"`,
      o.total_amount || o.total || 0,
      o.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `seller_orders.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Orders CSV downloaded');
  };

  // Sidebar Menu Items matching the provided design
  const sidebarNavItems = [
    { id: 'overview', label: 'Overview', icon: Grid },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'messages', label: 'messages', icon: MessageSquare },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'shipment', label: 'Shipment', icon: Truck },
    { id: 'settings', label: 'Store Setting', icon: Settings },
    { id: 'banners', label: 'Banner & Notifications', icon: Bell },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'support', label: 'Help & Support', icon: HelpCircle },
  ];

  const handleNavClick = (id) => {
    setShowAddProductView(false);
    setEditingProduct(null);
    setSelectedSellerOrder(null);
    if (['overview', 'products', 'orders', 'reviews', 'messages', 'shipment', 'settings', 'banners'].includes(id)) {
      setActiveTab(id);
    } else {
      showToast(`${id} screen coming soon!`);
    }
  };

  // Top Selling Products Fallback Data matching design mockup
  const topSellingMock = [
    {
      id: 'ts1',
      name: 'Red Tape ...',
      sales: '12,429 Sales',
      stock: '138 Stocks Remaining',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&auto=format&fit=crop&q=80',
      status: 'Available'
    },
    {
      id: 'ts2',
      name: 'Fastrack FS...',
      sales: '1,343 Sales',
      stock: '76 Stocks Remaining',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80',
      status: 'Available'
    },
    {
      id: 'ts3',
      name: 'Leriya...',
      sales: '7,222 Sales',
      stock: '463 Stocks Remaining',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=80',
      status: 'Available'
    }
  ];

  const topProductsToDisplay = sellerProducts.length > 0
    ? sellerProducts.slice(0, 3).map((p) => ({
        id: p.id,
        name: p.name,
        sales: `${p.sold_count || '1,240'} Sales`,
        stock: `${p.stock || '120'} Stocks Remaining`,
        image: p.image || getImageUrl(p.main_image),
        status: 'Available'
      }))
    : topSellingMock;

  // Daily Sales chart bars
  const dailySalesBars = [
    { day: 'Mon', val: 35 },
    { day: 'Tue', val: 55 },
    { day: 'Wed', val: 28 },
    { day: 'Thu', val: 75, highlight: true },
    { day: 'Fri', val: 45 },
    { day: 'Sat', val: 68 },
    { day: 'Sun', val: 85 }
  ];

  // Age group bars data
  const ageGroupData = [
    { label: '<19', val: 80, color: '#3B82F6' },
    { label: '10-19', val: 85, color: '#F59E0B' },
    { label: '20-29', val: 95, color: '#EF4444' },
    { label: '30-39', val: 82, color: '#06B6D4' },
    { label: '40-49', val: 88, color: '#10B981' },
    { label: '50-59', val: 92, color: '#EC4899' },
    { label: '60-69', val: 65, color: '#A855F7' },
    { label: '70-79', val: 40, color: '#60A5FA' },
    { label: '≥80', val: 25, color: '#9CA3AF' }
  ];

  return (
    <div className="seller-dashboard-layout">
      {/* ─── LEFT SIDEBAR ────────────────────────────────────────────── */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo-icon">
            <div className="play-triangle"></div>
          </div>
          <span className="brand-name">Novanest</span>
        </div>

        <nav className="sidebar-nav">
          {sidebarNavItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="sidebar-logout-section">
          <button className="nav-item logout-btn" onClick={logout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>

        {/* Store Insights Bottom Card */}
        <div className="store-insights-sidebar-card">
          <div className="insights-icon-row">
            <div className="insights-icon-circle">
              <Lightbulb size={18} className="bulb-icon" />
            </div>
          </div>
          <h4 className="insights-title">Store Insights</h4>
          <p className="insights-text">Your store activity is up 12% this week. View detailed reports.</p>
          <button className="insights-view-btn" onClick={() => showToast('Store insights generated!')}>
            View Reports
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ────────────────────────────────────────────── */}
      <div className="dashboard-main-area">
        {/* Top Header Bar */}
        <header className="dashboard-topbar">
          <div className="topbar-search-box">
            <Search size={16} className="search-icon" />
            <input type="text" placeholder="Search ..." />
            <Mic size={16} className="mic-icon" />
          </div>

          <div className="topbar-user-profile">
            <img
              src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop"}
              alt="User Avatar"
              className="user-avatar-img"
            />
            <div className="user-text-info">
              <span className="user-name">{user?.full_name || 'Bishop Heahmund'}</span>
              <span className="user-email">{user?.email || 'bishophea024@gmail.com'}</span>
            </div>
            <ChevronDown size={16} className="user-dropdown-arrow" />
          </div>
        </header>

        {/* Dashboard Scrollable Body */}
        <main className="dashboard-body">
          {activeTab === 'overview' && (
            <div className="overview-page-wrapper animate-fade-in">
              {/* Welcome Banner */}
              <div className="welcome-header">
                <h1 className="welcome-title">Welcome back, <span>Bishop!</span></h1>
                <p className="welcome-subtitle">Here's Your Current Sales Overview</p>
              </div>

              {/* 3 Metric Cards Row */}
              <div className="metrics-row-cards">
                {/* Metric 1: Avg Order Value (Dark Green) */}
                <div className="metric-card dark-green-card">
                  <div className="metric-header-row">
                    <span className="metric-label">AVG . Order Value</span>
                    <div className="metric-badge-icon">
                      <DollarSign size={16} />
                    </div>
                  </div>
                  <div className="metric-value-num">$77.21</div>
                  <div className="metric-trend-pill positive">
                    + 3.16% <span>From last month</span>
                  </div>
                </div>

                {/* Metric 2: Total Orders (White) */}
                <div className="metric-card white-card">
                  <div className="metric-header-row">
                    <span className="metric-label">Total Orders</span>
                    <div className="metric-badge-icon muted">
                      <Lock size={16} />
                    </div>
                  </div>
                  <div className="metric-value-num">2,107</div>
                  <div className="metric-trend-pill negative">
                    - 1.18% <span>From last month</span>
                  </div>
                </div>

                {/* Metric 3: Lifetime Value (White) */}
                <div className="metric-card white-card">
                  <div className="metric-header-row">
                    <span className="metric-label">Lifetime Value</span>
                    <div className="metric-badge-icon muted">
                      <DollarSign size={16} />
                    </div>
                  </div>
                  <div className="metric-value-num">$ 653</div>
                  <div className="metric-trend-pill positive">
                    + 2.24% <span>From last month</span>
                  </div>
                </div>
              </div>

              {/* Grid Layout Section */}
              <div className="dashboard-charts-grid">
                {/* Column 1 & 2 Left Block */}
                <div className="charts-left-col">
                  {/* Row 1: Daily Sales & Demographics */}
                  <div className="charts-row-two">
                    {/* Daily Sales Card */}
                    <div className="dashboard-widget-card">
                      <h3 className="widget-card-title">Daily Sales</h3>
                      <div className="daily-sales-chart">
                        <div className="y-axis-labels">
                          <span>20k</span>
                          <span>15k</span>
                          <span>10k</span>
                          <span>5k</span>
                          <span>0</span>
                        </div>
                        <div className="bars-container">
                          {dailySalesBars.map((b, i) => (
                            <div key={i} className="bar-column">
                              <div
                                className={`bar-fill ${b.highlight ? 'dark-green' : ''}`}
                                style={{ height: `${b.val}%` }}
                              ></div>
                              <span className="x-day-label">{b.day}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Customer Demographics Card */}
                    <div className="dashboard-widget-card">
                      <h3 className="widget-card-title">Customer Demographics</h3>
                      <div className="pie-chart-wrapper">
                        <div className="pie-chart-circle"></div>
                      </div>
                      <div className="pie-legend-grid">
                        <div className="legend-item"><span className="dot blue"></span> ≤9</div>
                        <div className="legend-item"><span className="dot yellow"></span> 10–19</div>
                        <div className="legend-item"><span className="dot red"></span> 20–29</div>
                        <div className="legend-item"><span className="dot green"></span> 30–39</div>
                        <div className="legend-item"><span className="dot teal"></span> 40–49</div>
                        <div className="legend-item"><span className="dot pink"></span> 50+</div>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Sales by Age Group & Monthly Goal */}
                  <div className="charts-row-two mt-20">
                    {/* Sales by Age Group Card */}
                    <div className="dashboard-widget-card">
                      <h3 className="widget-card-title">Sales by Age Group</h3>
                      <div className="age-group-bars-wrap">
                        {ageGroupData.map((item, idx) => (
                          <div key={idx} className="age-bar-col">
                            <span className="percent-label">{item.val}%</span>
                            <div className="age-bar-track">
                              <div
                                className="age-bar-fill"
                                style={{ height: `${item.val}%`, backgroundColor: item.color }}
                              ></div>
                            </div>
                            <span className="age-x-label">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Monthly Goal Card */}
                    <div className="dashboard-widget-card">
                      <h3 className="widget-card-title">Monthly Goal</h3>
                      <div className="monthly-goal-content">
                        {/* Goal item 1 */}
                        <div className="goal-row-item">
                          <div className="goal-text-flex">
                            <span className="goal-label">Revenue($45k / $60k)</span>
                            <span className="goal-percent">75%</span>
                          </div>
                          <div className="goal-progress-bar">
                            <div className="progress-fill dark-green" style={{ width: '75%' }}></div>
                          </div>
                        </div>

                        {/* Goal item 2 */}
                        <div className="goal-row-item">
                          <div className="goal-text-flex">
                            <span className="goal-label">New Customers (135 / 300)</span>
                            <span className="goal-percent">45%</span>
                          </div>
                          <div className="goal-progress-bar">
                            <div className="progress-fill light-green" style={{ width: '45%' }}></div>
                          </div>
                        </div>

                        {/* Legend */}
                        <div className="goal-legend-row">
                          <div className="legend-item"><span className="dot dark-green"></span> Current</div>
                          <div className="legend-item"><span className="dot grey"></span> Remaining</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 3 Right Card: Top Selling Product */}
                <div className="charts-right-col">
                  <div className="dashboard-widget-card tall-product-card">
                    <div className="widget-header-flex">
                      <h3 className="widget-card-title">Top Selling<br />Product</h3>
                      <button className="see-all-btn" onClick={() => setActiveTab('products')}>
                        See All Product
                      </button>
                    </div>

                    <div className="top-selling-list">
                      {topProductsToDisplay.map((item) => (
                        <div key={item.id} className="top-product-row">
                          <div className="product-thumb-box">
                            <img src={item.image} alt={item.name} />
                          </div>
                          <div className="product-info-column">
                            <div className="title-and-status">
                              <h4 className="top-product-name">{item.name}</h4>
                              <span className="available-pill">• Available</span>
                            </div>
                            <span className="sales-count">{item.sales}</span>
                            <span className="stocks-count">{item.stock}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Table Section: Latest Orders */}
              <div className="dashboard-widget-card latest-orders-card mt-24">
                <div className="table-header-flex">
                  <h3 className="widget-card-title">Latest Orders</h3>
                  <div className="table-controls-pills">
                    <button className="control-pill-btn">Customize</button>
                    <button className="control-pill-btn">Filter</button>
                    <button className="control-pill-btn export" onClick={handleExportCSV}>
                      Export <ChevronDown size={14} />
                    </button>
                  </div>
                </div>

                <div className="table-scroll-wrap">
                  <table className="seller-dashboard-table">
                    <thead>
                      <tr>
                        <th>ORDER ID</th>
                        <th>PRODUCT</th>
                        <th>ORDER DATE</th>
                        <th>PRICE</th>
                        <th>PAYMENT</th>
                        <th>STATUS</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellerOrders.length > 0 ? (
                        sellerOrders.slice(0, 5).map((ord) => (
                          <tr key={ord.id || ord.order_id} onClick={() => { setSelectedSellerOrder({ id: `#ORD-2023-${ord.id || '0892'}`, customer: ord.customer_name || 'Elena Jenkins', total: ord.total_amount || '124.50', status: ord.status || 'Ready to Ship', date: ord.created_at || 'Oct 24, 2023' }); setActiveTab('orders'); }} style={{ cursor: 'pointer' }}>
                            <td className="bold-id">#{ord.id || ord.order_id}</td>
                            <td>{ord.product_summary?.split(',')[0] || 'Premium Silk Shirt'}</td>
                            <td>{ord.created_at || ord.date || 'Oct 24, 2023'}</td>
                            <td className="bold-price">Rs. {Number(ord.total_amount || ord.total || 142.5).toLocaleString()}</td>
                            <td>{ord.payment_method || 'Credit Card'}</td>
                            <td>
                              <span className={`order-status-badge ${String(ord.status || 'delivered').toLowerCase()}`}>
                                {ord.status || 'Delivered'}
                              </span>
                            </td>
                            <td>
                              <button className="table-action-dots">
                                <MoreHorizontal size={18} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        [
                          { id: '#ORD-2023-0892', customer: 'Elena Jenkins', date: 'Oct 24, 2023', price: '124.50', payment: 'Credit Card', status: 'Ready to Ship' },
                          { id: '#ORD-2023-0891', customer: 'Marcus Reed', date: 'Oct 24, 2023', price: '89.99', payment: 'Cash on Delivery', status: 'In Progress' },
                          { id: '#ORD-2023-0885', customer: 'Sarah Williams', date: 'Oct 22, 2023', price: '342.00', payment: 'Credit Card', status: 'Shipped' }
                        ].map((ord) => (
                          <tr key={ord.id} onClick={() => { setSelectedSellerOrder({ id: ord.id, customer: ord.customer, total: ord.price, status: ord.status, date: ord.date }); setActiveTab('orders'); }} style={{ cursor: 'pointer' }}>
                            <td className="bold-id">{ord.id}</td>
                            <td>{ord.customer}</td>
                            <td>{ord.date}</td>
                            <td className="bold-price">${ord.price}</td>
                            <td>{ord.payment}</td>
                            <td>
                              <span className={`order-status-badge ${ord.status.toLowerCase()}`}>
                                {ord.status}
                              </span>
                            </td>
                            <td>
                              <button className="table-action-dots">
                                <MoreHorizontal size={18} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PRODUCTS TAB VIEW (`seller products.png`) */}
          {activeTab === 'products' && (
            <div className="products-management-view animate-fade-in">
              {/* Header */}
              <div className="management-header-row">
                <div className="header-text-block">
                  <h1 className="page-title">Product Management</h1>
                  <p className="page-subtitle">Manage your inventory, pricing, and product details.</p>
                </div>
                <button className="add-product-btn-green" onClick={() => setShowAddProductView(true)}>
                  <Plus size={18} />
                  <span>Add New Product</span>
                </button>
              </div>

              {/* 3 Summary KPI Cards */}
              <div className="product-kpi-row">
                <div className="kpi-card">
                  <span className="kpi-label">TOTAL PRODUCTS</span>
                  <div className="kpi-value-num">1,248</div>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">LOW STOCK ITEMS</span>
                  <div className="kpi-value-num orange">12</div>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">ACTIVE CATEGORIES</span>
                  <div className="kpi-value-num">18</div>
                </div>
              </div>

              {/* Main Card Wrapper */}
              <div className="dashboard-widget-card products-table-card">
                {/* Search & Filter Toolbar */}
                <div className="table-filter-toolbar">
                  <div className="search-sku-input-wrap">
                    <Search size={16} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search products by name or SKU..."
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="filter-actions-group">
                    <select className="filter-dropdown">
                      <option>All Categories</option>
                      <option>Yoga & Fitness</option>
                      <option>Drinkware</option>
                      <option>Apparel</option>
                      <option>Home Decor</option>
                    </select>

                    <select className="filter-dropdown">
                      <option>All Status</option>
                      <option>In Stock</option>
                      <option>Low Stock</option>
                      <option>Out of Stock</option>
                    </select>

                    <button className="more-filters-btn">
                      <Filter size={15} />
                      <span>More Filters</span>
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="table-scroll-container">
                  <table className="seller-products-table">
                    <thead>
                      <tr>
                        <th className="check-col"><input type="checkbox" /></th>
                        <th>PRODUCT</th>
                        <th>SKU</th>
                        <th>PRICE</th>
                        <th>STOCK</th>
                        <th>SALES</th>
                        <th>STATUS</th>
                        <th className="text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          id: 'p1',
                          name: 'Eco-Friendly Cork Yoga Mat',
                          category: 'Yoga & Fitness',
                          sku: 'YOG-CRK-001',
                          price: '$45.00',
                          stockLabel: 'In Stock (124)',
                          stockType: 'in-stock',
                          sales: '342',
                          active: true,
                          image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&auto=format&fit=crop&q=80'
                        },
                        {
                          id: 'p2',
                          name: 'Bamboo Water Bottle 500ml',
                          category: 'Drinkware',
                          sku: 'BAM-WB-500',
                          price: '$24.99',
                          stockLabel: 'Low Stock (8)',
                          stockType: 'low-stock',
                          sales: '891',
                          active: true,
                          image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=200&auto=format&fit=crop&q=80'
                        },
                        {
                          id: 'p3',
                          name: 'Organic Cotton Tote Bag',
                          category: 'Apparel',
                          sku: 'ORG-TOT-BEG',
                          price: '$18.50',
                          stockLabel: 'Out of Stock (0)',
                          stockType: 'out-of-stock',
                          sales: '412',
                          active: false,
                          image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&auto=format&fit=crop&q=80'
                        },
                        {
                          id: 'p4',
                          name: 'Recycled Glass Vase',
                          category: 'Home Decor',
                          sku: 'HOM-GLS-042',
                          price: '$32.00',
                          stockLabel: 'In Stock (45)',
                          stockType: 'in-stock',
                          sales: '128',
                          active: true,
                          image: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=200&auto=format&fit=crop&q=80'
                        },
                        {
                          id: 'p5',
                          name: 'Hemp Yoga Strap',
                          category: 'Yoga & Fitness',
                          sku: 'YOG-HMP-009',
                          price: '$12.50',
                          stockLabel: 'In Stock (210)',
                          stockType: 'in-stock',
                          sales: '56',
                          active: true,
                          image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=200&auto=format&fit=crop&q=80'
                        }
                      ].map((prod) => (
                        <tr key={prod.id}>
                          <td className="check-col"><input type="checkbox" /></td>
                          <td>
                            <div className="table-product-cell">
                              <div className="product-img-wrap">
                                <img src={prod.image} alt={prod.name} />
                              </div>
                              <div className="product-title-sub">
                                <h4 className="prod-title-name">{prod.name}</h4>
                                <span className="prod-cat-text">{prod.category}</span>
                              </div>
                            </div>
                          </td>
                          <td className="sku-cell">{prod.sku}</td>
                          <td className="price-cell">{prod.price}</td>
                          <td>
                            <span className={`stock-pill ${prod.stockType}`}>
                              • {prod.stockLabel}
                            </span>
                          </td>
                          <td>{prod.sales}</td>
                          <td>
                            <label className="toggle-switch-wrap">
                              <input type="checkbox" defaultChecked={prod.active} />
                              <span className="toggle-slider"></span>
                            </label>
                          </td>
                          <td className="text-right">
                            <div className="row-action-icons">
                              <button className="icon-act-btn" title="Edit"><Pencil size={15} /></button>
                              <button className="icon-act-btn" title="View"><Eye size={15} /></button>
                              <button className="icon-act-btn" title="Delete" onClick={() => handleDeleteProduct(prod.id)}><Trash2 size={15} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                <div className="products-table-pagination">
                  <span className="entries-count-text">Showing 1 to 5 of 45 entries</span>
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
          )}

          {/* MESSAGES TAB VIEW (`messages.png`) */}
          {activeTab === 'messages' && (
            <div className="seller-messages-split-view animate-fade-in">
              {/* Left Conversations Sidebar */}
              <div className="messages-sidebar-panel">
                <div className="messages-header-top">
                  <h2 className="messages-title">Order Messages</h2>
                  <div className="messages-filter-tabs">
                    <button className="msg-tab-btn active">All</button>
                    <button className="msg-tab-btn">Unread</button>
                  </div>
                </div>

                <div className="conversations-list-scroll">
                  {[
                    {
                      id: 'conv1',
                      name: 'Artisan Ceramics',
                      orderId: 'ORDER #NVN-8842',
                      preview: 'Yes, the Forest Green is finally back in stock!',
                      time: 'Just now',
                      image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=200&auto=format&fit=crop&q=80',
                      active: true
                    },
                    {
                      id: 'conv2',
                      name: 'EcoWeave Textiles',
                      orderId: 'ORDER #NVN-8119',
                      preview: 'Your tracking number is TRK-992-LW',
                      time: 'Yesterday',
                      image: null,
                      active: false
                    },
                    {
                      id: 'conv3',
                      name: 'Zenith Woodworks',
                      orderId: 'ORDER #NVN-7540',
                      preview: 'We are processing your return now.',
                      time: 'Oct 12',
                      image: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=200&auto=format&fit=crop&q=80',
                      active: false
                    }
                  ].map((conv) => (
                    <div
                      key={conv.id}
                      className={`conversation-item-card ${conv.active ? 'selected' : ''}`}
                    >
                      <div className="conv-avatar-box">
                        {conv.image ? (
                          <img src={conv.image} alt={conv.name} />
                        ) : (
                          <div className="conv-icon-placeholder">
                            <Package size={20} color="#6b7280" />
                          </div>
                        )}
                      </div>

                      <div className="conv-info-content">
                        <div className="conv-name-row">
                          <h4 className="conv-name">{conv.name}</h4>
                          <span className="conv-time">{conv.time}</span>
                        </div>
                        <span className="conv-order-id">{conv.orderId}</span>
                        <p className="conv-preview-text">{conv.preview}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Chat Panel */}
              <div className="messages-chat-panel">
                {/* Chat Top Header */}
                <div className="chat-top-header">
                  <div className="chat-user-status">
                    <div className="chat-avatar-circle">
                      <span>AC</span>
                      <span className="online-indicator-dot"></span>
                    </div>
                    <div className="chat-name-sub">
                      <h3>Artisan Ceramics</h3>
                      <span className="online-text">Online</span>
                    </div>
                  </div>

                  <button className="view-order-btn" onClick={() => showToast('Order #NVN-8842 details opened')}>
                    <Package size={15} />
                    <span>View Order #NVN-8842</span>
                  </button>
                </div>

                {/* Messages Body Scroll */}
                <div className="chat-messages-body">
                  <div className="chat-date-pill">TODAY</div>

                  {/* Customer Question Bubble (Right Green) */}
                  <div className="chat-bubble-row user-row">
                    <div className="bubble-box green-bubble">
                      Hi there! I ordered the Forest Green Ceramic Mug a while back but it was out of stock. Just checking if you have any updates on when it might be available again?
                    </div>
                    <span className="chat-time-stamp">10:24 AM</span>
                  </div>

                  {/* Seller Reply Bubble 1 (Left Grey) */}
                  <div className="chat-bubble-row seller-row">
                    <div className="seller-avatar">AC</div>
                    <div className="bubble-box grey-bubble">
                      Hello Alex! Thank you for following up.
                    </div>
                  </div>

                  {/* Seller Reply Bubble 2 (Left Grey) */}
                  <div className="chat-bubble-row seller-row">
                    <div className="seller-avatar invisible">AC</div>
                    <div className="bubble-box grey-bubble">
                      Good news - Yes, the Forest Green is finally back in stock! We just finished unloading the kiln this morning. Your order is being packed right now and will ship out this afternoon.
                    </div>
                  </div>
                  <div className="seller-time-stamp">10:31 AM</div>
                </div>

                {/* Chat Input Bar */}
                <div className="chat-input-footer">
                  <div className="input-card-box">
                    <button className="attach-icon-btn" title="Add Image">
                      <Image size={18} />
                    </button>
                    <button className="attach-icon-btn" title="Attach File">
                      <Paperclip size={18} />
                    </button>

                    <input
                      type="text"
                      placeholder="Type a message..."
                      className="chat-text-input"
                    />

                    <button className="send-msg-btn">
                      <Send size={16} />
                    </button>
                  </div>
                  <span className="input-help-subtext">Press Enter to send, Shift+Enter for new line</span>
                </div>
              </div>
            </div>
          )}

          {/* ORDERS TAB VIEW (`seller orders.png` & `seller order detail.png`) */}
          {activeTab === 'orders' && (
            <div className="seller-orders-tab-wrapper animate-fade-in">
              {selectedSellerOrder ? (
                <SellerOrderDetailPage
                  order={selectedSellerOrder}
                  onBack={() => setSelectedSellerOrder(null)}
                />
              ) : (
                <SellerOrdersPage
                  onSelectOrder={(ord) => setSelectedSellerOrder(ord)}
                  onExportCSV={handleExportCSV}
                />
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <SellerReviewsPage />
          )}

          {/* Shipment Tab */}
          {activeTab === 'shipment' && (
            <SellerShipmentPage />
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <SellerSettingsPage />
          )}

          {/* Banner & Notifications Tab */}
          {activeTab === 'banners' && (
            <SellerBannersNotificationsPage />
          )}
        </main>
      </div>

      {/* Settings Drawer Overlay */}
      {isSettingsDrawerOpen && (
        <div className="drawer-overlay" onClick={() => setIsSettingsDrawerOpen(false)}>
          <div className="drawer-panel animate-slide-left" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Store Settings</h3>
              <button onClick={() => setIsSettingsDrawerOpen(false)}><X size={20}/></button>
            </div>
            <div className="drawer-body" style={{ padding: 20 }}>
              <p>Store profile settings are active.</p>
              <button onClick={logout} className="insights-view-btn" style={{ marginTop: 20, background: '#ef4444', color: '#fff' }}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

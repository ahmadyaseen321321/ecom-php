import React, { useState, useEffect, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import {
  fetchAdminStatsApi,
  fetchAdminUsersApi,
  fetchAdminOrdersApi,
  updateAdminOrderApi,
  fetchAdminSellersApi,
  updateAdminSellerApi,
  fetchAdminCouponsApi,
  createAdminCouponApi,
  deleteAdminCouponApi,
  fetchAdminCategoriesApi,
  deleteAdminCategoryApi,
  fetchProducts,
  fetchCategories,
  getImageUrl,
} from '../services/api';
import {
  LayoutGrid,
  Users,
  ShoppingBag,
  Package,
  Tag,
  Layers,
  Store,
  HelpCircle,
  LogOut,
  Lightbulb,
  Search,
  Mic,
  ChevronDown,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Loader2,
  Trash2,
  Filter,
  Download,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  AlertCircle,
} from 'lucide-react';
import './AdminDashboard.css';

// ─── Helpers ─────────────────────────────────────────────────────
function getInitials(name) {
  if (!name) return 'AD';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

function statusClass(status) {
  const s = (status || '').toLowerCase();
  if (s === 'delivered' || s === 'completed') return 'delivered';
  if (s === 'pending') return 'pending';
  if (s === 'shipped' || s === 'shipping') return 'shipped';
  if (s === 'cancelled' || s === 'canceled') return 'cancelled';
  return 'processing';
}

function StatusBadge({ status }) {
  const cls = statusClass(status);
  return (
    <span className={`admin-status-badge ${cls}`}>
      <span className="admin-status-dot" />
      {status || '—'}
    </span>
  );
}

// Simple SVG donut chart
function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let offset = 0;
  const r = 52;
  const circ = 2 * Math.PI * r;
  const segments = data.map((d) => {
    const pct = d.value / total;
    const dash = pct * circ;
    const seg = { ...d, dash, offset: offset * circ };
    offset += pct;
    return seg;
  });

  return (
    <div className="admin-donut-wrap">
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={r} fill="none" stroke="#f3f4f6" strokeWidth="18" />
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx="65"
            cy="65"
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="18"
            strokeDasharray={`${seg.dash} ${circ - seg.dash}`}
            strokeDashoffset={circ / 4 - seg.offset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '65px 65px' }}
          />
        ))}
      </svg>
      <div className="admin-donut-legend">
        {data.map((d, i) => (
          <div className="admin-legend-item" key={i}>
            <span className="admin-legend-dot" style={{ background: d.color }} />
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Mock / fallback data matching the screenshot ────────────────
const DEMO_ORDERS = [
  { id: '#ORD-7821', product: 'Red Tape Shoes', product_img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=80&auto=format', date: 'Jun 10, 2026', price: '$87.00', payment: 'Credit Card', status: 'Delivered' },
  { id: '#ORD-7820', product: 'Fastrack FS Watch', product_img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&auto=format', date: 'Jun 9, 2026', price: '$129.00', payment: 'PayPal', status: 'Shipped' },
  { id: '#ORD-7819', product: 'Leriya Skincare Set', product_img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=80&auto=format', date: 'Jun 9, 2026', price: '$55.00', payment: 'SafePay', status: 'Pending' },
  { id: '#ORD-7818', product: 'Nike Air Max 270', product_img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80&auto=format', date: 'Jun 8, 2026', price: '$210.00', payment: 'Credit Card', status: 'Processing' },
  { id: '#ORD-7817', product: 'Samsung Galaxy S25', product_img: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=80&auto=format', date: 'Jun 7, 2026', price: '$999.00', payment: 'Wire', status: 'Cancelled' },
];

const DEMO_USERS = [
  { id: 1, full_name: 'Bishop Heahmund', email: 'bishophea024@gmail.com', role: 'admin', status: 'active' },
  { id: 2, full_name: 'Jane Smith', email: 'jane.smith@email.com', role: 'seller', status: 'active' },
  { id: 3, full_name: 'Alex Johnson', email: 'alex.j@example.com', role: 'user', status: 'active' },
  { id: 4, full_name: 'Maria Garcia', email: 'maria.g@example.com', role: 'user', status: 'blocked' },
  { id: 5, full_name: 'Tom Wilson', email: 'tom.w@business.com', role: 'seller', status: 'active' },
  { id: 6, full_name: 'Sarah Lee', email: 'sarah.lee@shop.com', role: 'user', status: 'active' },
];

const DEMO_SELLERS = [
  { id: 1, name: 'Jane Smith', email: 'jane.smith@email.com', store: 'StyleZone', orders: 128, revenue: '$14,320', status: 'approved' },
  { id: 2, name: 'Tom Wilson', email: 'tom.w@business.com', store: 'TechHub', orders: 74, revenue: '$8,900', status: 'approved' },
  { id: 3, name: 'Nina Patel', email: 'nina.patel@shop.com', store: 'BeautyBar', orders: 0, revenue: '$0', status: 'pending' },
];

const DEMO_COUPONS = [
  { id: 1, code: 'SUMMER20', discount: '20%', type: 'percentage', expires: 'Aug 31, 2026', uses: 142 },
  { id: 2, code: 'FLAT50', discount: '$50', type: 'flat', expires: 'Jul 15, 2026', uses: 38 },
  { id: 3, code: 'NEWUSER10', discount: '10%', type: 'percentage', expires: 'Dec 31, 2026', uses: 510 },
];

const DEMOGRAPHICS_DATA = [
  { label: '<9', value: 5, color: '#3B82F6' },
  { label: '10–19', value: 12, color: '#F59E0B' },
  { label: '20–29', value: 32, color: '#EF4444' },
  { label: '30–39', value: 25, color: '#10B981' },
  { label: '40–49', value: 15, color: '#8B5CF6' },
  { label: '50+', value: 11, color: '#EC4899' },
];

const DAILY_BARS = [
  { day: 'Mon', val: 35 },
  { day: 'Tue', val: 55 },
  { day: 'Wed', val: 28 },
  { day: 'Thu', val: 75, highlight: true },
  { day: 'Fri', val: 45 },
  { day: 'Sat', val: 68 },
  { day: 'Sun', val: 85 },
];

const AGE_GROUP_BARS = [
  { label: '<19', val: 80, color: '#3B82F6' },
  { label: '10-19', val: 85, color: '#F59E0B' },
  { label: '20-29', val: 95, color: '#EF4444' },
  { label: '30-39', val: 82, color: '#06B6D4' },
  { label: '40-49', val: 88, color: '#10B981' },
  { label: '50-59', val: 92, color: '#EC4899' },
  { label: '60-69', val: 65, color: '#A855F7' },
  { label: '70-79', val: 40, color: '#60A5FA' },
  { label: '≥80',  val: 25, color: '#9CA3AF' },
];

const TOP_SELLING_MOCK = [
  { id: 1, name: 'Red Tape ...', sales: '12,429 Sales', stock: '138 Stocks Remaining', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&auto=format', status: 'Available' },
  { id: 2, name: 'Fastrack FS...', sales: '1,343 Sales', stock: '76 Stocks Remaining', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format', status: 'Available' },
  { id: 3, name: 'Leriya...', sales: '7,222 Sales', stock: '463 Stocks Remaining', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&auto=format', status: 'Available' },
];

// ─── SIDEBAR NAV CONFIG ──────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: null,
    items: [{ id: 'overview', label: 'Overview', icon: LayoutGrid }],
  },
  {
    label: 'Management',
    items: [
      { id: 'users',      label: 'Users',       icon: Users },
      { id: 'orders',     label: 'Orders',      icon: ShoppingBag },
      { id: 'products',   label: 'Products',    icon: Package },
      { id: 'sellers',    label: 'Sellers',     icon: Store },
      { id: 'categories', label: 'Categories',  icon: Layers },
      { id: 'coupons',    label: 'Coupons',     icon: Tag },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'support', label: 'Help & Support', icon: HelpCircle },
    ],
  },
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, logout, showToast } = useCart();

  const [activeTab, setActiveTab] = useState('overview');

  // Overview data
  const [stats, setStats]           = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [orders, setOrders]         = useState(DEMO_ORDERS);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Users
  const [users, setUsers]           = useState(DEMO_USERS);
  const [usersLoading, setUsersLoading] = useState(false);

  // Products
  const [products, setProducts]     = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Sellers
  const [sellers, setSellers]       = useState(DEMO_SELLERS);
  const [sellersLoading, setSellersLoading] = useState(false);

  // Coupons
  const [coupons, setCoupons]       = useState(DEMO_COUPONS);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [newCoupon, setNewCoupon]   = useState({ code: '', discount: '', type: 'percentage', expires: '' });

  // Categories
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Search / filter
  const [orderSearch, setOrderSearch]   = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [userSearch, setUserSearch]     = useState('');

  // ─── Load overview stats ──────────────────────────────────────
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetchAdminStatsApi();
      if (res && (res.total_orders !== undefined || res.data)) {
        setStats(res.data || res);
      }
    } catch (_) {}
    finally { setStatsLoading(false); }
  }, []);

  // ─── Load orders ──────────────────────────────────────────────
  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await fetchAdminOrdersApi();
      if (res && Array.isArray(res) && res.length > 0) setOrders(res);
    } catch (_) {}
    finally { setOrdersLoading(false); }
  }, []);

  // ─── Load users ───────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetchAdminUsersApi();
      if (res && Array.isArray(res) && res.length > 0) setUsers(res);
    } catch (_) {}
    finally { setUsersLoading(false); }
  }, []);

  // ─── Load products ────────────────────────────────────────────
  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const res = await fetchProducts();
      if (res && Array.isArray(res) && res.length > 0) setProducts(res);
    } catch (_) {}
    finally { setProductsLoading(false); }
  }, []);

  // ─── Load sellers ─────────────────────────────────────────────
  const loadSellers = useCallback(async () => {
    setSellersLoading(true);
    try {
      const res = await fetchAdminSellersApi();
      if (res && Array.isArray(res) && res.length > 0) setSellers(res);
    } catch (_) {}
    finally { setSellersLoading(false); }
  }, []);

  // ─── Load coupons ─────────────────────────────────────────────
  const loadCoupons = useCallback(async () => {
    setCouponsLoading(true);
    try {
      const res = await fetchAdminCouponsApi();
      if (res && Array.isArray(res) && res.length > 0) setCoupons(res);
    } catch (_) {}
    finally { setCouponsLoading(false); }
  }, []);

  // ─── Load categories ──────────────────────────────────────────
  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const res = await fetchAdminCategoriesApi();
      if (!res || !Array.isArray(res) || res.length === 0) {
        // fallback to public categories
        const pub = await fetchCategories();
        if (pub && pub.length > 0) setCategories(pub);
      } else {
        setCategories(res);
      }
    } catch (_) {}
    finally { setCategoriesLoading(false); }
  }, []);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'overview') { loadStats(); loadOrders(); }
    if (activeTab === 'orders')     loadOrders();
    if (activeTab === 'users')      loadUsers();
    if (activeTab === 'products')   loadProducts();
    if (activeTab === 'sellers')    loadSellers();
    if (activeTab === 'coupons')    loadCoupons();
    if (activeTab === 'categories') loadCategories();
  }, [activeTab]);

  // ─── Derived stats ────────────────────────────────────────────
  const avgOrderValue   = stats?.avg_order_value   ?? 77.21;
  const totalOrders     = stats?.total_orders       ?? 2107;
  const lifetimeValue   = stats?.lifetime_value     ?? 653;
  const totalUsers      = stats?.total_users        ?? users.length;

  // ─── Filtered orders ──────────────────────────────────────────
  const filteredOrders = orders.filter((o) => {
    const matchSearch = !orderSearch || (o.id || '').toLowerCase().includes(orderSearch.toLowerCase()) || (o.product || '').toLowerCase().includes(orderSearch.toLowerCase());
    const matchStatus = orderStatusFilter === 'ALL' || (o.status || '').toLowerCase() === orderStatusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  // ─── Filtered users ───────────────────────────────────────────
  const filteredUsers = users.filter((u) =>
    !userSearch ||
    (u.full_name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  // ─── Top products ─────────────────────────────────────────────
  const topProducts = products.length > 0
    ? products.slice(0, 3).map((p) => ({
        id: p.id,
        name: p.name,
        sales: `${p.sold_count || '1,240'} Sales`,
        stock: `${p.stock || '120'} Stocks Remaining`,
        image: p.image || getImageUrl(p.main_image),
        status: 'Available',
      }))
    : TOP_SELLING_MOCK;

  // ─── Handle coupon create ─────────────────────────────────────
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!newCoupon.code.trim()) return;
    try {
      const res = await createAdminCouponApi(newCoupon);
      if (res) {
        setCoupons((prev) => [...prev, { ...newCoupon, id: Date.now(), uses: 0 }]);
        setNewCoupon({ code: '', discount: '', type: 'percentage', expires: '' });
        showToast('Coupon created!');
      } else {
        // Optimistic insert anyway for demo
        setCoupons((prev) => [...prev, { ...newCoupon, id: Date.now(), uses: 0 }]);
        setNewCoupon({ code: '', discount: '', type: 'percentage', expires: '' });
        showToast('Coupon created!');
      }
    } catch (_) {
      setCoupons((prev) => [...prev, { ...newCoupon, id: Date.now(), uses: 0 }]);
      setNewCoupon({ code: '', discount: '', type: 'percentage', expires: '' });
      showToast('Coupon created!');
    }
  };

  // ─── Handle coupon delete ─────────────────────────────────────
  const handleDeleteCoupon = async (id) => {
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    try { await deleteAdminCouponApi(id); } catch (_) {}
    showToast('Coupon removed');
  };

  // ─── Handle order status update ───────────────────────────────
  const handleOrderStatusChange = async (orderId, newStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    try { await updateAdminOrderApi(orderId, newStatus); } catch (_) {}
    showToast(`Order ${orderId} updated to ${newStatus}`);
  };

  // ─── Handle seller approve/reject ────────────────────────────
  const handleSellerAction = async (sellerId, status) => {
    setSellers((prev) => prev.map((s) => (s.id === sellerId ? { ...s, status } : s)));
    try { await updateAdminSellerApi(sellerId, status); } catch (_) {}
    showToast(`Seller ${status}`);
  };

  // ─── Handle category delete ───────────────────────────────────
  const handleDeleteCategory = async (id) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    try { await deleteAdminCategoryApi(id); } catch (_) {}
    showToast('Category removed');
  };

  // ─── Render tab content ───────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {

      // ── OVERVIEW ─────────────────────────────────────────────
      case 'overview':
        return (
          <>
            {/* Welcome */}
            <div className="admin-page-title">
              <h2>Welcome back, <strong>{(user?.full_name || user?.name || 'Admin').split(' ')[0]}!</strong></h2>
              <p>Here's your platform overview for today.</p>
            </div>

            {/* Metric cards */}
            <div className="admin-metrics-row">
              <div className="admin-metric-card highlighted">
                <div className="admin-metric-top">
                  <span className="admin-metric-label">AVG. Order Value</span>
                  <div className="admin-metric-icon"><DollarSign size={16} color="#fff" /></div>
                </div>
                <div className="admin-metric-value">${Number(avgOrderValue).toFixed(2)}</div>
                <div className="admin-metric-change"><span className="up">+3.16%</span> From last month</div>
              </div>

              <div className="admin-metric-card">
                <div className="admin-metric-top">
                  <span className="admin-metric-label">Total Orders</span>
                  <div className="admin-metric-icon"><ShoppingBag size={16} /></div>
                </div>
                <div className="admin-metric-value">{Number(totalOrders).toLocaleString()}</div>
                <div className="admin-metric-change"><span className="down">-1.18%</span> From last month</div>
              </div>

              <div className="admin-metric-card">
                <div className="admin-metric-top">
                  <span className="admin-metric-label">Lifetime Value</span>
                  <div className="admin-metric-icon"><TrendingUp size={16} /></div>
                </div>
                <div className="admin-metric-value">${Number(lifetimeValue).toLocaleString()}</div>
                <div className="admin-metric-change"><span className="up">+2.24%</span> From last month</div>
              </div>
            </div>

            {/* Charts row */}
            <div className="admin-charts-row">
              {/* Daily sales bar chart */}
              <div className="admin-chart-card">
                <h3>Daily Sales</h3>
                <div className="admin-bar-chart">
                  {DAILY_BARS.map((b) => (
                    <div className="admin-bar-col" key={b.day}>
                      <div
                        className={`admin-bar${b.highlight ? ' highlight' : ''}`}
                        style={{ height: `${b.val}%` }}
                      />
                      <span className="admin-bar-label">{b.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer demographics donut */}
              <div className="admin-chart-card">
                <h3>Customer Demographics</h3>
                <DonutChart data={DEMOGRAPHICS_DATA} />
              </div>

              {/* Top selling products */}
              <div className="admin-chart-card">
                <div className="admin-top-selling-header">
                  <h3>Top Selling Product</h3>
                  <button className="admin-see-all-btn" onClick={() => setActiveTab('products')}>See All</button>
                </div>
                <div className="admin-top-selling-list">
                  {topProducts.map((p) => (
                    <div className="admin-top-product-row" key={p.id}>
                      <img className="admin-top-product-img" src={p.image} alt={p.name} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format'; }} />
                      <div className="admin-top-product-info">
                        <div className="admin-top-product-name">{p.name}</div>
                        <div className="admin-top-product-sales">{p.sales} · {p.stock}</div>
                      </div>
                      <span className="admin-top-product-badge">• {p.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Secondary row */}
            <div className="admin-secondary-row">
              {/* Sales by age group */}
              <div className="admin-chart-card">
                <h3>Sales by Age Group</h3>
                <div className="admin-age-bars">
                  {AGE_GROUP_BARS.map((b) => (
                    <div className="admin-age-bar-col" key={b.label}>
                      <span className="admin-age-bar-pct">{b.val}%</span>
                      <div
                        className="admin-age-bar-fill"
                        style={{ height: `${b.val}%`, background: b.color }}
                      />
                      <span className="admin-age-bar-label">{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly goal */}
              <div className="admin-chart-card">
                <h3>Monthly Goal</h3>
                <div className="admin-goal-list">
                  <div className="admin-goal-item">
                    <div className="admin-goal-header">
                      <span className="admin-goal-label">Revenue ($45k / $60k)</span>
                      <span className="admin-goal-pct">75%</span>
                    </div>
                    <div className="admin-goal-bar-track">
                      <div className="admin-goal-bar-fill" style={{ width: '75%' }} />
                    </div>
                  </div>
                  <div className="admin-goal-item">
                    <div className="admin-goal-header">
                      <span className="admin-goal-label">New Customers (135 / 300)</span>
                      <span className="admin-goal-pct">45%</span>
                    </div>
                    <div className="admin-goal-bar-track">
                      <div className="admin-goal-bar-fill" style={{ width: '45%' }} />
                    </div>
                  </div>
                  <div className="admin-goal-legend">
                    <div className="admin-goal-legend-item">
                      <div className="admin-goal-dot" style={{ background: '#1a3c34' }} />
                      Current
                    </div>
                    <div className="admin-goal-legend-item">
                      <div className="admin-goal-dot" style={{ background: '#d1d5db' }} />
                      Remaining
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Latest orders table */}
            <div className="admin-orders-section">
              <div className="admin-orders-header">
                <h3>Latest Orders</h3>
                <div className="admin-orders-actions">
                  <button className="admin-action-btn"><Filter size={14} /> Filter</button>
                  <button className="admin-action-btn"><Download size={14} /> Export</button>
                </div>
              </div>
              <OrdersTable orders={filteredOrders.slice(0, 5)} onStatusChange={handleOrderStatusChange} compact />
            </div>
          </>
        );

      // ── ORDERS ───────────────────────────────────────────────
      case 'orders':
        return (
          <>
            <div className="admin-page-header-row">
              <div className="admin-page-title" style={{ margin: 0 }}>
                <h2>All Orders</h2>
                <p>{orders.length} total orders</p>
              </div>
              <div className="admin-orders-actions">
                <button className="admin-action-btn" onClick={loadOrders}>
                  <RefreshCw size={14} className={ordersLoading ? 'admin-spin' : ''} /> Refresh
                </button>
                <button className="admin-action-btn"><Download size={14} /> Export CSV</button>
              </div>
            </div>

            {/* Search + filter bar */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div className="admin-topbar-search" style={{ maxWidth: 320, flex: 1 }}>
                <Search size={14} />
                <input placeholder="Search by order ID or product..." value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} />
              </div>
              {['ALL', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((s) => (
                <button
                  key={s}
                  className={`admin-action-btn${orderStatusFilter === s ? ' primary' : ''}`}
                  onClick={() => setOrderStatusFilter(s)}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="admin-orders-section">
              {ordersLoading ? (
                <div className="admin-loading-state"><Loader2 size={28} className="admin-spin" />Loading orders…</div>
              ) : (
                <OrdersTable orders={filteredOrders} onStatusChange={handleOrderStatusChange} />
              )}
            </div>
          </>
        );

      // ── USERS ────────────────────────────────────────────────
      case 'users':
        return (
          <>
            <div className="admin-page-header-row">
              <div className="admin-page-title" style={{ margin: 0 }}>
                <h2>All Users</h2>
                <p>{users.length} registered accounts</p>
              </div>
              <button className="admin-action-btn" onClick={loadUsers}>
                <RefreshCw size={14} className={usersLoading ? 'admin-spin' : ''} /> Refresh
              </button>
            </div>
            <div className="admin-topbar-search" style={{ maxWidth: 360, marginBottom: 18 }}>
              <Search size={14} />
              <input placeholder="Search by name or email…" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
            </div>
            {usersLoading ? (
              <div className="admin-loading-state"><Loader2 size={28} className="admin-spin" />Loading users…</div>
            ) : (
              <div className="admin-users-grid">
                {filteredUsers.map((u) => (
                  <div className="admin-user-card" key={u.id}>
                    <div className="admin-user-card-top">
                      <div className="admin-user-avatar">{getInitials(u.full_name)}</div>
                      <div className="admin-user-info">
                        <h4>{u.full_name || '—'}</h4>
                        <p>{u.email}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`admin-user-role-badge ${u.role}`}>{u.role}</span>
                      {u.status === 'blocked' && (
                        <span style={{ fontSize: '0.68rem', color: '#dc2626', fontWeight: 700 }}>• Blocked</span>
                      )}
                    </div>
                    <div className="admin-user-card-actions">
                      <button className="admin-user-action-btn">View</button>
                      <button
                        className="admin-user-action-btn danger"
                        onClick={() => showToast(`Action on ${u.full_name}`)}
                      >
                        {u.status === 'blocked' ? 'Unblock' : 'Block'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        );

      // ── PRODUCTS ─────────────────────────────────────────────
      case 'products':
        return (
          <>
            <div className="admin-page-header-row">
              <div className="admin-page-title" style={{ margin: 0 }}>
                <h2>All Products</h2>
                <p>{products.length} products in catalog</p>
              </div>
              <button className="admin-action-btn" onClick={loadProducts}>
                <RefreshCw size={14} className={productsLoading ? 'admin-spin' : ''} /> Refresh
              </button>
            </div>
            {productsLoading ? (
              <div className="admin-loading-state"><Loader2 size={28} className="admin-spin" />Loading products…</div>
            ) : products.length === 0 ? (
              <div className="admin-empty-state"><Package size={40} />No products found</div>
            ) : (
              <div className="admin-products-grid">
                {products.map((p) => {
                  const price = parseFloat(p.discount_price || p.price || 0);
                  const img = p.main_image ? getImageUrl(p.main_image) : (p.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format');
                  return (
                    <div className="admin-product-card" key={p.id}>
                      <img className="admin-product-card-img" src={img} alt={p.name} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format'; }} />
                      <div className="admin-product-card-body">
                        <div className="admin-product-card-name">{p.name}</div>
                        <div className="admin-product-card-meta">{p.category_name || 'Uncategorized'} · {p.stock ?? '—'} in stock</div>
                        <div className="admin-product-card-footer">
                          <span className="admin-product-price">${price.toFixed(2)}</span>
                          <StatusBadge status={parseInt(p.stock) > 0 ? 'Available' : 'Out of Stock'} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        );

      // ── SELLERS ──────────────────────────────────────────────
      case 'sellers':
        return (
          <>
            <div className="admin-page-header-row">
              <div className="admin-page-title" style={{ margin: 0 }}>
                <h2>Sellers</h2>
                <p>{sellers.length} registered sellers</p>
              </div>
              <button className="admin-action-btn" onClick={loadSellers}>
                <RefreshCw size={14} className={sellersLoading ? 'admin-spin' : ''} /> Refresh
              </button>
            </div>
            {sellersLoading ? (
              <div className="admin-loading-state"><Loader2 size={28} className="admin-spin" />Loading sellers…</div>
            ) : (
              <div className="admin-orders-section admin-sellers-table-wrap">
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Seller</th>
                        <th>Store</th>
                        <th>Orders</th>
                        <th>Revenue</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellers.map((s) => (
                        <tr key={s.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="admin-user-avatar" style={{ width: 34, height: 34, fontSize: '0.75rem' }}>{getInitials(s.name)}</div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{s.name}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>{s.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontWeight: 600 }}>{s.store}</td>
                          <td>{s.orders}</td>
                          <td style={{ fontWeight: 700 }}>{s.revenue}</td>
                          <td><StatusBadge status={s.status === 'approved' ? 'Delivered' : s.status === 'pending' ? 'Pending' : 'Cancelled'} /></td>
                          <td>
                            <div style={{ display: 'flex', gap: 8 }}>
                              {s.status === 'pending' && (
                                <>
                                  <button className="admin-action-btn primary" style={{ padding: '5px 10px', fontSize: '0.75rem' }} onClick={() => handleSellerAction(s.id, 'approved')}>Approve</button>
                                  <button className="admin-action-btn" style={{ padding: '5px 10px', fontSize: '0.75rem', color: '#dc2626' }} onClick={() => handleSellerAction(s.id, 'rejected')}>Reject</button>
                                </>
                              )}
                              {s.status === 'approved' && (
                                <button className="admin-action-btn" style={{ padding: '5px 10px', fontSize: '0.75rem' }} onClick={() => showToast('View seller details')}>View</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        );

      // ── CATEGORIES ───────────────────────────────────────────
      case 'categories':
        return (
          <>
            <div className="admin-page-header-row">
              <div className="admin-page-title" style={{ margin: 0 }}>
                <h2>Categories</h2>
                <p>{categories.length} categories</p>
              </div>
              <button className="admin-action-btn" onClick={loadCategories}>
                <RefreshCw size={14} className={categoriesLoading ? 'admin-spin' : ''} /> Refresh
              </button>
            </div>
            {categoriesLoading ? (
              <div className="admin-loading-state"><Loader2 size={28} className="admin-spin" />Loading categories…</div>
            ) : categories.length === 0 ? (
              <div className="admin-empty-state"><Layers size={40} />No categories found</div>
            ) : (
              <div className="admin-categories-grid">
                {categories.map((c) => {
                  const img = c.image_url ? getImageUrl(c.image_url) : (c.image || 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&auto=format');
                  return (
                    <div className="admin-category-card" key={c.id}>
                      <img className="admin-category-img" src={img} alt={c.name} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&auto=format'; }} />
                      <div className="admin-category-body">
                        <div className="admin-category-name">{c.name}</div>
                        <button className="admin-category-del-btn" onClick={() => handleDeleteCategory(c.id)}>Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        );

      // ── COUPONS ──────────────────────────────────────────────
      case 'coupons':
        return (
          <>
            <div className="admin-page-header-row">
              <div className="admin-page-title" style={{ margin: 0 }}>
                <h2>Coupons</h2>
                <p>Manage discount codes</p>
              </div>
            </div>

            {/* Create coupon form */}
            <div className="admin-orders-section" style={{ marginBottom: 20 }}>
              <div className="admin-orders-header"><h3>Create New Coupon</h3></div>
              <form onSubmit={handleCreateCoupon} style={{ padding: '20px 24px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-text-muted)' }}>CODE</label>
                  <input
                    className="admin-topbar-search"
                    style={{ maxWidth: 160, padding: '8px 14px' }}
                    placeholder="e.g. SAVE20"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-text-muted)' }}>DISCOUNT</label>
                  <input
                    className="admin-topbar-search"
                    style={{ maxWidth: 120, padding: '8px 14px' }}
                    placeholder="e.g. 20 or 50"
                    value={newCoupon.discount}
                    onChange={(e) => setNewCoupon((p) => ({ ...p, discount: e.target.value }))}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-text-muted)' }}>TYPE</label>
                  <select
                    style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid var(--admin-card-border)', background: 'var(--admin-light-bg)', fontSize: '0.85rem', fontFamily: 'inherit', cursor: 'pointer' }}
                    value={newCoupon.type}
                    onChange={(e) => setNewCoupon((p) => ({ ...p, type: e.target.value }))}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat ($)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-text-muted)' }}>EXPIRES</label>
                  <input
                    type="date"
                    style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--admin-card-border)', background: 'var(--admin-light-bg)', fontSize: '0.85rem', fontFamily: 'inherit' }}
                    value={newCoupon.expires}
                    onChange={(e) => setNewCoupon((p) => ({ ...p, expires: e.target.value }))}
                  />
                </div>
                <button type="submit" className="admin-action-btn primary" style={{ alignSelf: 'flex-end' }}>+ Add Coupon</button>
              </form>
            </div>

            {couponsLoading ? (
              <div className="admin-loading-state"><Loader2 size={28} className="admin-spin" />Loading coupons…</div>
            ) : (
              <div className="admin-coupons-list">
                {coupons.map((c) => (
                  <div className="admin-coupon-card" key={c.id}>
                    <span className="admin-coupon-code">{c.code}</span>
                    <div className="admin-coupon-info">
                      <strong>{c.discount}{c.type === 'percentage' ? '%' : ''} off</strong>
                      {' · '}{c.type === 'percentage' ? 'Percentage' : 'Flat'} discount
                      {c.expires && <> · Expires {c.expires}</>}
                      {' · '}{c.uses ?? 0} uses
                    </div>
                    <button className="admin-coupon-delete-btn" onClick={() => handleDeleteCoupon(c.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        );

      // ── SUPPORT ──────────────────────────────────────────────
      case 'support':
        return (
          <div className="admin-empty-state" style={{ paddingTop: 80 }}>
            <HelpCircle size={48} />
            <h3 style={{ margin: '8px 0 4px', color: 'var(--admin-text-main)' }}>Help & Support</h3>
            <p style={{ fontWeight: 400 }}>Support ticket management coming soon.</p>
          </div>
        );

      default:
        return null;
    }
  };

  // ─── JSX ────────────────────────────────────────────────────
  return (
    <div className="admin-dashboard-layout">
      {/* ── SIDEBAR ── */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div className="admin-brand-icon">
            <div className="admin-brand-triangle" />
          </div>
          <span className="admin-brand-name">Novanest</span>
        </div>

        <nav className="admin-sidebar-nav">
          {NAV_SECTIONS.map((section, si) => (
            <React.Fragment key={si}>
              {section.label && (
                <div className="admin-sidebar-section-label">{section.label}</div>
              )}
              {section.items.map((item) => (
                <button
                  key={item.id}
                  className={`admin-nav-item${activeTab === item.id ? ' active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <item.icon size={17} />
                  <span>{item.label}</span>
                </button>
              ))}
            </React.Fragment>
          ))}

          <hr className="admin-sidebar-divider" />
          <button className="admin-nav-item logout-item" onClick={logout}>
            <LogOut size={17} />
            <span>Logout</span>
          </button>
        </nav>

        {/* Insights card */}
        <div className="admin-insights-card">
          <div className="admin-insights-bulb">
            <Lightbulb size={17} />
          </div>
          <h4>Platform Insights</h4>
          <p>Your store activity is up 12% this week. View detailed reports.</p>
          <button className="admin-insights-btn" onClick={() => showToast('Insights report generated!')}>
            View Reports
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="admin-main-area">
        {/* Topbar */}
        <header className="admin-topbar">
          <div className="admin-topbar-search">
            <Search size={15} />
            <input placeholder="Search..." />
            <Mic size={15} />
          </div>
          <div className="admin-topbar-right">
            <div className="admin-topbar-profile">
              <div className="admin-avatar">
                {user?.avatar ? (
                  <img src={user.avatar} alt="admin" />
                ) : (
                  getInitials(user?.full_name || user?.name)
                )}
              </div>
              <div className="admin-profile-info">
                <span className="admin-profile-name">{user?.full_name || user?.name || 'Admin'}</span>
                <span className="admin-profile-email">{user?.email || ''}</span>
              </div>
              <ChevronDown size={14} style={{ color: 'var(--admin-text-muted)' }} />
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="admin-body">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

// ─── ORDERS TABLE sub-component ──────────────────────────────────
function OrdersTable({ orders, onStatusChange, compact = false }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="admin-empty-state">
        <ShoppingBag size={36} />
        No orders found
      </div>
    );
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Product</th>
            {!compact && <th>Order Date</th>}
            <th>Price</th>
            <th>Payment</th>
            <th>Status</th>
            {!compact && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {orders.map((o, i) => (
            <tr key={o.id || i}>
              <td><span className="admin-order-id">{o.id || `#ORD-${i + 1}`}</span></td>
              <td>
                <div className="admin-order-product">
                  {o.product_img && (
                    <img
                      className="admin-order-product-img"
                      src={o.product_img || o.main_image}
                      alt={o.product}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <span style={{ fontWeight: 600, fontSize: '0.83rem' }}>{o.product || o.product_name || '—'}</span>
                </div>
              </td>
              {!compact && <td style={{ color: 'var(--admin-text-muted)', fontSize: '0.8rem' }}>{o.date || o.created_at || '—'}</td>}
              <td style={{ fontWeight: 700 }}>{o.price || (o.total_price ? `$${o.total_price}` : '—')}</td>
              <td style={{ color: 'var(--admin-text-muted)', fontSize: '0.8rem' }}>{o.payment || o.payment_method || '—'}</td>
              <td><StatusBadge status={o.status} /></td>
              {!compact && (
                <td>
                  <select
                    style={{ padding: '5px 8px', borderRadius: 8, border: '1px solid var(--admin-card-border)', fontSize: '0.75rem', fontFamily: 'inherit', cursor: 'pointer', background: '#fff' }}
                    value={o.status || ''}
                    onChange={(e) => onStatusChange(o.id, e.target.value)}
                  >
                    {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

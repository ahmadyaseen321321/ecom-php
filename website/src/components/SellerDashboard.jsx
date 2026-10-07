import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import SellerOrdersPage from './SellerOrdersPage';
import SellerOrderDetailPage from './SellerOrderDetailPage';
import SellerReviewsPage from './SellerReviewsPage';
import SellerShipmentPage from './SellerShipmentPage';
import SellerSettingsPage from './SellerSettingsPage';
import SellerBannersNotificationsPage from './SellerBannersNotificationsPage';
import SellerProductFormPage from './SellerProductFormPage';
import {
  fetchSellerStatsApi,
  fetchSellerOrdersApi,
  updateSellerOrderStatusApi,
  fetchSellerReviewsApi,
  replySellerReviewApi,
  fetchSellerProductsApi,
  addSellerProductApi,
  deleteSellerProductApi,
  updateSellerProductApi,
  toggleProductStatusApi,
  fetchCategories,
  getImageUrl,
  fetchConversationsApi,
  fetchOrderChatApi,
  sendOrderChatApi
} from '../services/api';
import {
  Loader2,
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

  // Selected Order for Full Screen Detail & Chat
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedSellerOrder, setSelectedSellerOrder] = useState(null);
  const [activeChatOrder, setActiveChatOrder] = useState(null);

  // Edit Product State
  const [editingProduct, setEditingProduct] = useState(null);

  // Categories from API
  const [categories, setCategories] = useState([]);

  // Product search/filter state
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 10;

  // Add/Edit Product State
  const [showAddProductView, setShowAddProductView] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  // Settings Drawer State
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);

  // Chat & Messages State
  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInputText, setChatInputText] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [chatFilter, setChatFilter] = useState('all');

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

  // Load categories from API
  const loadCategories = async () => {
    try {
      const res = await fetchCategories();
      if (res && Array.isArray(res)) {
        setCategories(res);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  // Sync conversations from seller orders — Grouped 1 chatbox per customer/user
  useEffect(() => {
    if (sellerOrders && sellerOrders.length > 0) {
      const customerMap = {};

      sellerOrders.forEach((o) => {
        const custName = (
          o.customer_name ||
          o.customerName ||
          o.customer ||
          (o.shipping_address ? (o.shipping_address.name || o.shipping_address.full_name) : 'Customer')
        ).trim();
        const custEmail = (o.customer_email || o.user_email || o.email || '').trim().toLowerCase();
        const userId = o.user_id ? String(o.user_id) : '';
        // Group key by user_id > email > name
        const custKey = userId ? `user_${userId}` : (custEmail ? `email_${custEmail}` : `name_${custName.toLowerCase()}`);

        const rawId = String(o.id || o.order_id || '');
        const fullOrderId = rawId.startsWith('#') ? rawId : `#ORD-${rawId}`;

        if (!customerMap[custKey]) {
          customerMap[custKey] = {
            id: custKey,
            userId,
            name: custName,
            email: custEmail,
            avatarText: custName.substring(0, 2).toUpperCase(),
            online: true,
            orders: [o],
            latestOrder: o,
            orderId: fullOrderId,
            time: o.date || o.created_at ? new Date(o.date || o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent'
          };
        } else {
          customerMap[custKey].orders.push(o);
          const prevTime = new Date(customerMap[custKey].latestOrder.date || customerMap[custKey].latestOrder.created_at || 0).getTime();
          const currTime = new Date(o.date || o.created_at || 0).getTime();
          if (currTime >= prevTime) {
            customerMap[custKey].latestOrder = o;
            customerMap[custKey].orderId = fullOrderId;
            customerMap[custKey].time = o.date || o.created_at ? new Date(o.date || o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent';
          }
        }
      });

      const userConvs = Object.values(customerMap).map((c) => {
        const orderCount = c.orders.length;
        const latestTotal = Number(c.latestOrder.total || c.latestOrder.total_amount || 0).toLocaleString();
        const latestItems = c.latestOrder.items && Array.isArray(c.latestOrder.items) && c.latestOrder.items.length > 0
          ? c.latestOrder.items.map((i) => i.name || i.product_name || 'Item').join(', ')
          : (c.latestOrder.product_name || c.latestOrder.product || 'Items');

        return {
          ...c,
          preview: orderCount > 1 
            ? `${orderCount} Orders • Latest ${c.orderId} (Rs. ${latestTotal})`
            : `${latestItems} • Rs. ${latestTotal}`,
          status: c.latestOrder.status || 'Ready To Ship'
        };
      });

      setConversations(userConvs);

      if (!selectedConvId && userConvs.length > 0) {
        setSelectedConvId(userConvs[0].id);
        loadCustomerChatMessages(userConvs[0]);
      }
    }
  }, [sellerOrders]);

  // Load Conversations from API
  const loadConversations = async () => {
    try {
      const res = await fetchConversationsApi();
      const list = res?.conversations || res?.data || (Array.isArray(res) ? res : []);
      if (list.length > 0 && (!sellerOrders || sellerOrders.length === 0)) {
        setConversations(list);
        if (!selectedConvId) {
          setSelectedConvId(list[0].id || list[0].orderId);
          loadCustomerChatMessages(list[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  // Load Chat Messages for a Customer across all their orders
  const loadCustomerChatMessages = async (convOrId) => {
    let conv = typeof convOrId === 'object' && convOrId !== null
      ? convOrId 
      : conversations.find(c => String(c.id) === String(convOrId) || String(c.orderId) === String(convOrId));
    
    if (!conv) {
      if (typeof convOrId === 'string') {
        loadChatMessages(convOrId);
      }
      return;
    }

    setIsChatLoading(true);
    try {
      const orderIds = (conv.orders && conv.orders.length > 0) 
        ? conv.orders.map(o => String(o.id || o.order_id).startsWith('#') ? (o.id || o.order_id) : `#ORD-${o.id || o.order_id}`)
        : [conv.orderId];

      const uniqueOrderIds = [...new Set(orderIds)];
      const results = await Promise.all(uniqueOrderIds.map(oid => fetchOrderChatApi(oid).catch(() => null)));
      
      const allMsgs = [];
      results.forEach(res => {
        const list = res?.messages || res?.data || (Array.isArray(res) ? res : []);
        list.forEach(m => {
          if (!allMsgs.some(existing => existing.id === m.id)) {
            allMsgs.push(m);
          }
        });
      });

      allMsgs.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
      setChatMessages(allMsgs);
    } catch (err) {
      console.error('Failed to load customer chat messages:', err);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Open Chat for specific Order (finds or focuses customer conversation)
  const handleOpenOrderChat = (ord) => {
    if (!ord) return;
    const custName = (ord.customer_name || ord.customerName || ord.customer || (ord.shipping_address ? (ord.shipping_address.name || ord.shipping_address.full_name) : 'Customer')).trim();
    const custEmail = (ord.customer_email || ord.user_email || ord.email || '').trim().toLowerCase();
    const userId = ord.user_id ? String(ord.user_id) : '';
    const custKey = userId ? `user_${userId}` : (custEmail ? `email_${custEmail}` : `name_${custName.toLowerCase()}`);

    const existing = conversations.find(c => c.id === custKey || c.name.toLowerCase() === custName.toLowerCase());
    if (existing) {
      setSelectedConvId(existing.id);
      loadCustomerChatMessages(existing);
    } else {
      setSelectedConvId(custKey);
      loadChatMessages(ord.id || ord.order_id);
    }
    setActiveTab('messages');
  };

  // Load Chat Messages for a specific order
  const loadChatMessages = async (orderId) => {
    if (!orderId) return;
    setIsChatLoading(true);
    try {
      const res = await fetchOrderChatApi(orderId);
      const msgs = res?.messages || res?.data || (Array.isArray(res) ? res : []);
      setChatMessages(msgs);
    } catch (err) {
      console.error('Failed to load chat messages:', err);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Handle Send Chat Message
  const handleSendChat = async (e, customText) => {
    if (e) e.preventDefault();
    const textToSend = (customText || chatInputText || '').trim();
    if (!textToSend || !selectedConvId) return;
    
    const activeConv = conversations.find(c => String(c.id) === String(selectedConvId) || String(c.orderId) === String(selectedConvId));
    const targetOrderId = activeConv?.orderId || (String(selectedConvId).startsWith('#') ? selectedConvId : `#ORD-${selectedConvId}`);
    
    // Optimistic local add
    const optimisticMsg = {
      id: Date.now(),
      order_id: targetOrderId,
      sender_type: 'seller',
      message: textToSend,
      created_at: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, optimisticMsg]);
    setChatInputText('');
    setIsSendingChat(true);

    try {
      await sendOrderChatApi(targetOrderId, textToSend, 'seller');
      if (activeConv) {
        loadCustomerChatMessages(activeConv);
      } else {
        loadChatMessages(targetOrderId);
      }
    } catch (err) {
      showToast('Failed to send message');
    } finally {
      setIsSendingChat(false);
    }
  };

  useEffect(() => {
    loadStats(timeframeDays);
    loadOrders(timeframeDays);
    loadProducts();
    loadReviews();
    loadCategories();
    loadConversations();
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

  const handleToggleProductStatus = async (product) => {
    const newStatus = product.status === 'active' ? 'pending' : 'active';
    try {
      await toggleProductStatusApi(product.id, newStatus);
      showToast(`Product ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      loadProducts();
    } catch (err) {
      showToast('Failed to update status');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowAddProductView(true);
  };

  const handleSaveProduct = async (productData) => {
    setIsAddingProduct(true);
    try {
      if (editingProduct) {
        await updateSellerProductApi(editingProduct.id, {
          name: productData.name,
          description: productData.description,
          price: parseFloat(productData.price),
          discount_price: productData.discount_price ? parseFloat(productData.discount_price) : null,
          stock: parseInt(productData.stock),
          category_id: parseInt(productData.category_id),
          status: productData.status || 'active',
          image: productData.image || '',
          sku: productData.sku || '',
        });
        showToast('Product updated successfully');
      } else {
        await addSellerProductApi({
          name: productData.name,
          description: productData.description,
          price: parseFloat(productData.price),
          discount_price: productData.discount_price ? parseFloat(productData.discount_price) : null,
          stock: parseInt(productData.stock),
          category_id: parseInt(productData.category_id),
          status: productData.status || 'active',
          image: productData.image || '',
          sku: productData.sku || '',
        });
        showToast('Product added successfully');
      }
      setShowAddProductView(false);
      setEditingProduct(null);
      loadProducts();
      loadStats(timeframeDays);
    } catch (err) {
      showToast('Failed to save product');
      throw err;
    } finally {
      setIsAddingProduct(false);
    }
  };

  // Filtered and paginated products
  const filteredProducts = useMemo(() => {
    let list = [...sellerProducts];
    if (productSearchQuery) {
      const q = productSearchQuery.toLowerCase();
      list = list.filter(p => (p.name || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q));
    }
    if (categoryFilter !== 'all') {
      list = list.filter(p => String(p.category_id) === categoryFilter);
    }
    if (stockFilter !== 'all') {
      if (stockFilter === 'in-stock') list = list.filter(p => parseInt(p.stock) > 10);
      else if (stockFilter === 'low-stock') list = list.filter(p => parseInt(p.stock) > 0 && parseInt(p.stock) <= 10);
      else if (stockFilter === 'out-of-stock') list = list.filter(p => parseInt(p.stock) <= 0);
    }
    return list;
  }, [sellerProducts, productSearchQuery, categoryFilter, stockFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);

  const getStockInfo = (stock) => {
    const s = parseInt(stock) || 0;
    if (s <= 0) return { label: `Out of Stock (${s})`, type: 'out-of-stock' };
    if (s <= 10) return { label: `Low Stock (${s})`, type: 'low-stock' };
    return { label: `In Stock (${s})`, type: 'in-stock' };
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

  // Top Selling Products — real data from API
  const topProductsToDisplay = sellerProducts.length > 0
    ? sellerProducts.slice(0, 3).map((p) => ({
        id: p.id,
        name: p.name,
        sales: `${p.sold_count || 0} Sales`,
        stock: `${p.stock || 0} Stocks Remaining`,
        image: getImageUrl(p.main_image),
        status: parseInt(p.stock) > 0 ? 'Available' : 'Out of Stock'
      }))
    : [];

  // Daily Sales chart bars (dynamic from API or sensible defaults)
  const dailySalesBars = useMemo(() => {
    if (stats?.chart_data && Array.isArray(stats.chart_data) && stats.chart_data.length > 0) {
      const dataSlice = stats.chart_data.length > 7 ? stats.chart_data.slice(-7) : stats.chart_data;
      const maxVal = Math.max(...dataSlice.map(d => Number(d.value) || 0), 1);
      return dataSlice.map(d => {
        const raw = Number(d.value) || 0;
        return {
          day: d.label,
          val: raw > 0 ? Math.max(15, Math.round((raw / maxVal) * 90)) : 10,
          highlight: raw === maxVal && raw > 0
        };
      });
    }
    return [
      { day: 'Mon', val: 35 },
      { day: 'Tue', val: 55 },
      { day: 'Wed', val: 28 },
      { day: 'Thu', val: 75, highlight: true },
      { day: 'Fri', val: 45 },
      { day: 'Sat', val: 68 },
      { day: 'Sun', val: 85 }
    ];
  }, [stats]);

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
      </aside>

      {/* ─── MAIN CONTENT ────────────────────────────────────────────── */}
      <div className="dashboard-main-area">
        {/* Top Header Bar */}
        <header className="dashboard-topbar">
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
              {/* Welcome Banner + Timeframe Filter */}
              <div className="welcome-header">
                <div className="welcome-header-text">
                  <h1 className="welcome-title">Welcome back, <span>{user?.full_name?.split(' ')[0] || 'Seller'}!</span></h1>
                  <p className="welcome-subtitle">Here's Your Current Sales Overview</p>
                </div>
                
                {/* Timeframe Filter Box */}
                <div className="overview-filter-box">
                  <div className="timeframe-select-pill">
                    <Calendar size={16} className="timeframe-icon" />
                    <select
                      value={timeframeDays}
                      onChange={(e) => setTimeframeDays(Number(e.target.value))}
                      className="timeframe-select"
                      aria-label="Filter stats timeframe"
                    >
                      <option value={7}>Last 7 Days</option>
                      <option value={14}>Last 14 Days</option>
                      <option value={30}>Last 30 Days</option>
                      <option value={90}>Last 3 Months (90 Days)</option>
                      <option value={180}>Last 6 Months</option>
                      <option value={365}>Last 1 Year (365 Days)</option>
                      <option value={3650}>All Time</option>
                    </select>
                    <ChevronDown size={14} className="timeframe-chevron" />
                  </div>
                </div>
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
                  <div className="metric-value-num">
                    {isStatsLoading ? (
                      <Loader2 size={22} className="animate-spin" style={{ color: '#ffffff' }} />
                    ) : (
                      `Rs. ${stats ? (stats.order_count > 0 ? Math.round(stats.total_sales / stats.order_count) : 0).toLocaleString() : '0'}`
                    )}
                  </div>
                  <div className="metric-trend-pill positive">
                    {stats?.sales_percentage !== undefined ? (
                      stats.sales_percentage >= 0 ? `+ ${stats.sales_percentage}%` : `${stats.sales_percentage}%`
                    ) : '+ 3.16%'} <span>{timeframeDays === 7 ? 'From last week' : timeframeDays === 30 ? 'From last month' : timeframeDays >= 365 ? 'From last year' : 'From prev period'}</span>
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
                  <div className="metric-value-num">
                    {isStatsLoading ? (
                      <Loader2 size={22} className="animate-spin" style={{ color: 'var(--seller-dark-green)' }} />
                    ) : (
                      stats ? stats.order_count.toLocaleString() : '0'
                    )}
                  </div>
                  <div className={`metric-trend-pill ${stats?.order_count > 0 ? 'positive' : 'negative'}`}>
                    {stats?.order_count > 0 ? `+${stats.order_count}` : '0'} <span>in selected period</span>
                  </div>
                </div>

                {/* Metric 3: Total / Lifetime Value (White) */}
                <div className="metric-card white-card">
                  <div className="metric-header-row">
                    <span className="metric-label">{timeframeDays >= 3650 ? 'Lifetime Value' : 'Period Revenue'}</span>
                    <div className="metric-badge-icon muted">
                      <DollarSign size={16} />
                    </div>
                  </div>
                  <div className="metric-value-num">
                    {isStatsLoading ? (
                      <Loader2 size={22} className="animate-spin" style={{ color: 'var(--seller-dark-green)' }} />
                    ) : (
                      `Rs. ${stats ? Math.round(stats.total_sales).toLocaleString() : '0'}`
                    )}
                  </div>
                  <div className="metric-trend-pill positive">
                    {stats?.sales_percentage !== undefined ? (
                      stats.sales_percentage >= 0 ? `+ ${stats.sales_percentage}%` : `${stats.sales_percentage}%`
                    ) : '+ 2.24%'} <span>{timeframeDays === 7 ? 'From last week' : timeframeDays === 30 ? 'From last month' : timeframeDays >= 365 ? 'From last year' : 'From prev period'}</span>
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
            (showAddProductView || editingProduct) ? (
              <SellerProductFormPage
                product={editingProduct}
                categories={categories}
                onBack={() => {
                  setShowAddProductView(false);
                  setEditingProduct(null);
                }}
                onSave={handleSaveProduct}
              />
            ) : (
              <div className="products-management-view animate-fade-in">
                {/* Header */}
                <div className="management-header-row">
                  <div className="header-text-block">
                    <h1 className="page-title">Product Management</h1>
                    <p className="page-subtitle">Manage your inventory, pricing, and product details.</p>
                  </div>
                  <button className="add-product-btn-green" onClick={() => { setEditingProduct(null); setShowAddProductView(true); }}>
                    <Plus size={18} />
                    <span>Add New Product</span>
                  </button>
                </div>

              {/* 3 Summary KPI Cards — Live Data */}
              <div className="product-kpi-row">
                <div className="kpi-card">
                  <span className="kpi-label">TOTAL PRODUCTS</span>
                  <div className="kpi-value-num">{sellerProducts.length.toLocaleString()}</div>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">LOW STOCK ITEMS</span>
                  <div className="kpi-value-num orange">{sellerProducts.filter(p => parseInt(p.stock) > 0 && parseInt(p.stock) <= 10).length}</div>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">ACTIVE CATEGORIES</span>
                  <div className="kpi-value-num">{new Set(sellerProducts.map(p => p.category_id)).size || categories.length}</div>
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
                    <select className="filter-dropdown" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}>
                      <option value="all">All Categories</option>
                      {categories.map(c => (
                        <option key={c.id} value={String(c.id)}>{c.name}</option>
                      ))}
                    </select>

                    <select className="filter-dropdown" value={stockFilter} onChange={(e) => { setStockFilter(e.target.value); setCurrentPage(1); }}>
                      <option value="all">All Status</option>
                      <option value="in-stock">In Stock</option>
                      <option value="low-stock">Low Stock</option>
                      <option value="out-of-stock">Out of Stock</option>
                    </select>

                    <button className="more-filters-btn" onClick={() => { setCategoryFilter('all'); setStockFilter('all'); setProductSearchQuery(''); setCurrentPage(1); }}>
                      <Filter size={15} />
                      <span>Clear Filters</span>
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
                      {isProductsLoading ? (
                        <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>Loading products...</td></tr>
                      ) : paginatedProducts.length === 0 ? (
                        <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No products found</td></tr>
                      ) : paginatedProducts.map((prod) => {
                        const stockInfo = getStockInfo(prod.stock);
                        const imgSrc = prod.main_image ? getImageUrl(prod.main_image) : 'https://placehold.co/60x60?text=No+Img';
                        return (
                          <tr key={prod.id}>
                            <td className="check-col"><input type="checkbox" /></td>
                            <td>
                              <div className="table-product-cell">
                                <div className="product-img-wrap">
                                  <img src={imgSrc} alt={prod.name} />
                                </div>
                                <div className="product-title-sub">
                                  <h4 className="prod-title-name">{prod.name}</h4>
                                  <span className="prod-cat-text">{prod.category_name || 'Uncategorized'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="sku-cell">{prod.sku || `SKU-${prod.id}`}</td>
                            <td className="price-cell">Rs. {Number(prod.discount_price || prod.price).toLocaleString()}</td>
                            <td>
                              <span className={`stock-pill ${stockInfo.type}`}>
                                • {stockInfo.label}
                              </span>
                            </td>
                            <td>{prod.sold_count || 0}</td>
                            <td>
                              <label className="toggle-switch-wrap">
                                <input type="checkbox" checked={prod.status === 'active'} onChange={() => handleToggleProductStatus(prod)} />
                                <span className="toggle-slider"></span>
                              </label>
                            </td>
                            <td className="text-right">
                              <div className="row-action-icons">
                                <button className="icon-act-btn" title="Edit" onClick={() => handleEditProduct(prod)}><Pencil size={15} /></button>
                                <button className="icon-act-btn" title="View"><Eye size={15} /></button>
                                <button className="icon-act-btn" title="Delete" onClick={() => handleDeleteProduct(prod.id)}><Trash2 size={15} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                <div className="products-table-pagination">
                  <span className="entries-count-text">
                    Showing {filteredProducts.length === 0 ? 0 : (currentPage - 1) * PRODUCTS_PER_PAGE + 1} to {Math.min(currentPage * PRODUCTS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} entries
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
          ))}

          {/* MESSAGES TAB VIEW (`messages.png`) */}
          {activeTab === 'messages' && (
            <div className="seller-messages-split-view animate-fade-in">
              {/* Left Conversations Sidebar */}
              <div className="messages-sidebar-panel">
                <div className="messages-header-top">
                  <h2 className="messages-title">Order Messages</h2>
                  <div className="messages-filter-tabs">
                    <button 
                      className={`msg-tab-btn ${chatFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setChatFilter('all')}
                    >
                      All
                    </button>
                    <button 
                      className={`msg-tab-btn ${chatFilter === 'unread' ? 'active' : ''}`}
                      onClick={() => setChatFilter('unread')}
                    >
                      Unread
                    </button>
                  </div>
                </div>

                <div className="conversations-list-scroll">
                  {conversations.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af', fontSize: '0.85rem' }}>
                      <MessageSquare size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                      No order conversations yet
                    </div>
                  ) : (
                    conversations.map((conv) => {
                      const isSelected = String(selectedConvId) === String(conv.id) || String(selectedConvId) === String(conv.orderId);
                      const orderCount = conv.orders ? conv.orders.length : 1;
                      const orderSubText = orderCount > 1 
                        ? `${orderCount} Orders • Latest ${conv.orderId}` 
                        : (conv.orderId || 'Customer');

                      return (
                        <div
                          key={conv.id || conv.orderId}
                          className={`conversation-item-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedConvId(conv.id);
                            loadCustomerChatMessages(conv);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="conv-avatar-box">
                            {conv.image || conv.avatarImg ? (
                              <img src={conv.image || conv.avatarImg} alt={conv.name} onError={(e) => { e.target.style.display = 'none'; }} />
                            ) : (
                              <div className="conv-icon-placeholder" style={{ background: '#e0e7ff', color: '#3730a3', fontWeight: 700 }}>
                                {conv.avatarText || (conv.name ? conv.name.substring(0, 2).toUpperCase() : 'CU')}
                              </div>
                            )}
                          </div>

                          <div className="conv-info-content">
                            <div className="conv-name-row">
                              <h4 className="conv-name">{conv.name || 'Customer'}</h4>
                              <span className="conv-time">{conv.time || 'Recent'}</span>
                            </div>
                            <span className="conv-order-id">{orderSubText}</span>
                            <p className="conv-preview-text">{conv.preview || 'Click to view conversation'}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Chat Panel */}
              <div className="messages-chat-panel">
                {(() => {
                  const activeConv = conversations.find(c => String(c.id) === String(selectedConvId) || String(c.orderId) === String(selectedConvId)) || conversations[0];
                  const activeOrderObj = activeConv?.latestOrder || activeConv?.rawOrder || (activeConv?.orders?.[0]) || sellerOrders.find(o => String(o.id) === String(activeConv?.id) || `#ORD-${o.id}` === activeConv?.orderId);
                  const currentOrderId = activeOrderObj ? (String(activeOrderObj.id || activeOrderObj.order_id).startsWith('#') ? (activeOrderObj.id || activeOrderObj.order_id) : `#ORD-${activeOrderObj.id || activeOrderObj.order_id}`) : (activeConv?.orderId || '#ORD-1');
                  const currentName = activeConv?.name || (activeOrderObj?.customer_name || activeOrderObj?.customerName || 'Customer');
                  const orderStatus = activeOrderObj?.status || 'Ready To Ship';
                  const orderDateStr = activeOrderObj?.date || activeOrderObj?.created_at ? new Date(activeOrderObj?.date || activeOrderObj?.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (activeConv?.time || 'Recent');
                  const orderTotalStr = Number(activeOrderObj?.total || activeOrderObj?.total_amount || 0).toLocaleString();
                  const orderSummaryStr = activeOrderObj?.items && Array.isArray(activeOrderObj.items) && activeOrderObj.items.length > 0
                    ? activeOrderObj.items.map(i => i.name || i.product_name).join(', ')
                    : (activeOrderObj?.product_name || activeOrderObj?.product || '');

                  return (
                    <>
                      {/* Top Order Details Banner */}
                      <div className="chat-order-top-banner">
                        <div className="banner-order-meta">
                          <div className="meta-badge-row">
                            <span className="order-number-tag">
                              <Package size={17} style={{ opacity: 0.9 }} />
                              <strong>{currentOrderId}</strong>
                            </span>
                            <span className={`chat-order-status-pill ${orderStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                              • {orderStatus}
                            </span>
                          </div>
                          <div className="meta-details-sub">
                            <span className="meta-item">
                              <Calendar size={13} /> {orderDateStr}
                            </span>
                            <span className="meta-sep">•</span>
                            <span className="meta-item bold-val">
                              Rs. {orderTotalStr}
                            </span>
                            {orderSummaryStr && (
                              <>
                                <span className="meta-sep">•</span>
                                <span className="meta-item summary-txt" title={orderSummaryStr}>
                                  {orderSummaryStr}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="banner-actions-right">
                          <button 
                            className="btn-banner-action" 
                            onClick={() => {
                              if (activeOrderObj) {
                                setSelectedSellerOrder(activeOrderObj);
                                setActiveTab('orders');
                              } else {
                                const found = sellerOrders.find(o => String(o.id) === String(activeConv?.id) || `#ORD-${o.id}` === currentOrderId);
                                if (found) {
                                  setSelectedSellerOrder(found);
                                  setActiveTab('orders');
                                } else {
                                  showToast(`Order details for ${currentOrderId}`);
                                }
                              }
                            }}
                          >
                            <Eye size={14} />
                            <span>Full Order Details</span>
                          </button>
                        </div>
                      </div>

                      {/* Messages Body Scroll */}
                      <div className="chat-messages-body">
                        <div className="chat-date-pill">ORDER CONVERSATION HISTORY</div>

                        {isChatLoading ? (
                          <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                            <Loader2 size={24} className="admin-spin" style={{ margin: '0 auto 8px', display: 'block' }} />
                            Loading chat messages...
                          </div>
                        ) : chatMessages.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                            <MessageSquare size={36} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                            <p style={{ margin: 0, fontWeight: 600 }}>Start conversation for {currentOrderId}</p>
                            <span style={{ fontSize: '0.8rem' }}>Send a message to the customer below</span>
                          </div>
                        ) : (
                          chatMessages.map((msg, idx) => {
                            const isSeller = msg.sender_type === 'seller' || msg.sender === 'seller' || msg.sender === 'me';
                            const msgTime = msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (msg.time || 'Now');
                            
                            return (
                              <div key={msg.id || idx} className={`chat-bubble-row ${isSeller ? 'user-row' : 'seller-row'}`}>
                                {!isSeller && (
                                  <div className="seller-avatar">{(currentName || 'CU').substring(0, 2).toUpperCase()}</div>
                                )}
                                <div className={`bubble-box ${isSeller ? 'green-bubble' : 'grey-bubble'}`}>
                                  {msg.message || msg.text}
                                  {msg.attachment_url && (
                                    <div style={{ marginTop: 8 }}>
                                      <img src={getImageUrl(msg.attachment_url)} alt="attachment" style={{ maxWidth: 200, borderRadius: 8 }} />
                                    </div>
                                  )}
                                </div>
                                <span className={isSeller ? 'chat-time-stamp' : 'seller-time-stamp'}>{msgTime}</span>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Quick Reply Suggestions */}
                      <div className="chat-quick-replies-scroll">
                        {[
                          'Hello! We are currently preparing your package. 📦',
                          'Your order has been confirmed and will ship shortly! 🚚',
                          'Could you please verify your delivery address? 📍',
                          'Your parcel has been handed over to the courier. 📦'
                        ].map((text, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="quick-reply-pill-btn"
                            onClick={() => setChatInputText(text)}
                          >
                            {text}
                          </button>
                        ))}
                      </div>

                      {/* Chat Input Bar */}
                      <form className="chat-input-footer" onSubmit={handleSendChat}>
                        <div className="input-card-box">
                          <button type="button" className="attach-icon-btn" title="Add Image" onClick={() => showToast('Image upload available')}>
                            <Image size={18} />
                          </button>
                          <button type="button" className="attach-icon-btn" title="Attach File" onClick={() => showToast('File attachment available')}>
                            <Paperclip size={18} />
                          </button>

                          <input
                            type="text"
                            placeholder={`Reply to ${currentName} regarding ${currentOrderId}...`}
                            className="chat-text-input"
                            value={chatInputText}
                            onChange={(e) => setChatInputText(e.target.value)}
                          />

                          <button type="submit" className="send-msg-btn" disabled={isSendingChat || !chatInputText.trim()}>
                            {isSendingChat ? <Loader2 size={16} className="admin-spin" /> : <Send size={16} />}
                          </button>
                        </div>
                        <span className="input-help-subtext">Press Enter to send, Shift+Enter for new line</span>
                      </form>
                    </>
                  );
                })()}
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
                  onOpenOrderChat={handleOpenOrderChat}
                />
              ) : (
                <SellerOrdersPage
                  orders={sellerOrders}
                  onSelectOrder={(ord) => setSelectedSellerOrder(ord)}
                  onExportCSV={handleExportCSV}
                  onOpenOrderChat={handleOpenOrderChat}
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

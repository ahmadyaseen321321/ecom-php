import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { useSocket } from '../context/SocketContext';
import SellerOrdersPage from './SellerOrdersPage';
import SellerOrderDetailPage from './SellerOrderDetailPage';
import SellerAnalyticsDetail from './SellerAnalyticsDetail';
import SellerProfilePage from './SellerProfilePage';
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
  sendOrderChatApi,
  sendOrderChatFilesApi,
  validateChatFiles
} from '../services/api';
import ChatAttachment from './ChatAttachment';
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
  LogOut,
  ShieldCheck
} from 'lucide-react';
import './SellerDashboard.css';

export default function SellerDashboard() {
  const { user, logout, showToast } = useCart();
  const { socket, isConnected, emitOrderStatusUpdate, sendMessage: sendSocketMessage, joinOrder, leaveOrder } = useSocket();

  // Active Tab: 'overview' | 'products' | 'orders' | 'reviews'
  const [activeTab, setActiveTab] = useState('overview');

  // Collapsible sidebar — collapsed shows icon-only rail
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // KPI drill-down: which metric's analytics page is open ('aov' | 'orders' | 'revenue' | null)
  const [analyticsMetric, setAnalyticsMetric] = useState(null);

  // Topbar profile dropdown menu
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

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
  const [isUploadingChatFile, setIsUploadingChatFile] = useState(false);
  const chatFileInputRef = useRef(null);

  // Conversation selection keys look like `user_5`, `email_a@b.com` or `name_john`
  // — never order numbers. Resolve them to the real order IDs so the socket room
  // (`order_<id>`) always matches the room the customer joins.
  const getRoomIds = (selId) => {
    const ids = new Set();
    const add = (v) => {
      if (v === null || v === undefined || v === '') return;
      if (String(v).toUpperCase() === 'GENERAL') { ids.add('GENERAL'); return; }
      const n = String(v).replace(/[^0-9]/g, '');
      if (n) ids.add(n);
    };
    const conv = conversations.find(c => String(c.id) === String(selId) || String(c.orderId) === String(selId));
    if (conv) {
      add(conv.orderId);
      (conv.orders || []).forEach(o => add(o.id || o.order_id));
    } else {
      add(selId);
    }
    return ids;
  };

  // Join the socket order rooms whenever the selected conversation changes.
  // Keyed on a stable string of room ids so a conversations reload doesn't
  // leave/re-join every room (a message sent in that gap would be lost).
  const activeRoomKey = selectedConvId
    ? [...getRoomIds(selectedConvId)].sort().join('|')
    : '';

  useEffect(() => {
    if (!activeRoomKey || !socket) return;
    const roomIds = activeRoomKey.split('|').filter(Boolean);
    roomIds.forEach(id => { if (joinOrder) joinOrder(id); });
    return () => {
      roomIds.forEach(id => { if (leaveOrder) leaveOrder(id); });
    };
  }, [activeRoomKey, socket]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [chatFilter, setChatFilter] = useState('all');

  // Load Dashboard Stats
  const loadStats = async (days = timeframeDays) => {
    setIsStatsLoading(true);
    try {
      const res = await fetchSellerStatsApi(days);
      // apiFetch already unwraps { status, data } down to the stats object, so a
      // truthiness check is all that is needed. The old `status === 'success' ||
      // res.data` guard never matched the unwrapped object — that is why every
      // metric card stayed pinned at 0 no matter how many orders arrived.
      if (res) {
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
      // Create the conversation entry right away so the socket room join,
      // message filtering and sending all know which order this chat belongs to
      const rawId = String(ord.id || ord.order_id || '');
      const newConv = {
        id: custKey,
        userId,
        name: custName,
        email: custEmail,
        avatarText: (custName || 'CU').substring(0, 2).toUpperCase(),
        online: true,
        orders: [ord],
        latestOrder: ord,
        orderId: rawId.startsWith('#') ? rawId : `#ORD-${rawId}`,
        time: 'Recent',
        preview: `Order ${rawId.startsWith('#') ? rawId : `#ORD-${rawId}`}`,
        status: ord.status || 'Recent'
      };
      setConversations(prev => [...prev, newConv]);
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

  // Handle Send Chat Message - Instantaneous
  const handleSendChat = (e, customText) => {
    if (e) e.preventDefault();
    const textToSend = (customText || chatInputText || '').trim();
    if (!textToSend || !selectedConvId) return;
    
    const activeConv = conversations.find(c => String(c.id) === String(selectedConvId) || String(c.orderId) === String(selectedConvId));
    const targetOrderId = activeConv?.orderId || (String(selectedConvId).startsWith('#') ? selectedConvId : `#ORD-${selectedConvId}`);
    // Always use clean numeric ID for socket room matching
    const cleanOrderId = String(targetOrderId).replace(/[^0-9]/g, '') || String(targetOrderId);

    // Instant optimistic local add
    const optimisticMsg = {
      id: `seller_${Date.now()}`,
      order_id: targetOrderId,
      sender_type: 'seller',
      message: textToSend,
      created_at: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, optimisticMsg]);
    setChatInputText('');

    // 1. Instant Socket.IO emission (0ms latency) — use numeric ID so room matches
    sendSocketMessage({
      id: optimisticMsg.id,
      orderId: cleanOrderId,
      message: textToSend,
      senderType: 'seller',
      senderName: user?.full_name || 'Store Support',
      recipientId: activeConv?.userId || activeConv?.user_id || activeConv?.customerId
    });

    // 2. Persist to backend database in background (client id → receivers dedupe)
    sendOrderChatApi(targetOrderId, textToSend, 'seller', optimisticMsg.id).catch(err => {
      console.warn('Chat persistence background error:', err);
    });
  };

  // ─── Chat attachments (image / video) ─────────────────────────
  const openChatFilePicker = (accept) => {
    if (!chatFileInputRef.current) return;
    chatFileInputRef.current.setAttribute('accept', accept);
    chatFileInputRef.current.value = '';
    chatFileInputRef.current.click();
  };

  const handleChatFileSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length || !selectedConvId) return;

    const sizeProblem = validateChatFiles(files);
    if (sizeProblem) {
      showToast(sizeProblem);
      return;
    }

    const activeConv = conversations.find(c => String(c.id) === String(selectedConvId) || String(c.orderId) === String(selectedConvId));
    const targetOrderId = activeConv?.orderId || (String(selectedConvId).startsWith('#') ? selectedConvId : `#ORD-${selectedConvId}`);
    const cleanOrderId = String(targetOrderId).replace(/[^0-9]/g, '') || String(targetOrderId);

    const clientId = `seller_${Date.now()}`;
    const localPreview = files.map(f => URL.createObjectURL(f)).join(',');
    const mimeTypes = files.map(f => f.type || '').join(',');

    setChatMessages(prev => [...prev, {
      id: clientId,
      order_id: targetOrderId,
      sender_type: 'seller',
      message: '',
      attachment_url: localPreview,
      attachment_mime: mimeTypes,
      created_at: new Date().toISOString()
    }]);
    setIsUploadingChatFile(true);

    try {
      const res = await sendOrderChatFilesApi(targetOrderId, '', 'seller', files, clientId);
      const savedUrl = res?.attachment_url || res?.data?.attachment_url;

      if (!savedUrl) {
        // Nothing was stored server-side — drop the bubble instead of
        // broadcasting a blob: URL that only exists in this browser tab
        setChatMessages(prev => prev.filter(m => m.id !== clientId));
        showToast('Attachment upload failed — please try again');
        return;
      }

      setChatMessages(prev => prev.map(m => (
        m.id === clientId ? { ...m, attachment_url: savedUrl, attachment_mime: null } : m
      )));

      sendSocketMessage({
        id: clientId,
        orderId: cleanOrderId,
        message: '',
        senderType: 'seller',
        senderName: user?.full_name || 'Store Support',
        recipientId: activeConv?.userId || activeConv?.user_id,
        attachmentUrl: savedUrl
      });
    } catch (err) {
      console.warn('Attachment upload failed:', err);
    } finally {
      setIsUploadingChatFile(false);
    }
  };

  // Close the topbar profile dropdown on outside click / Escape
  useEffect(() => {
    if (!isProfileMenuOpen) return;
    const onDocClick = (e) => {
      if (!e.target.closest?.('.topbar-user-profile')) setIsProfileMenuOpen(false);
    };
    const onEsc = (e) => {
      if (e.key === 'Escape') setIsProfileMenuOpen(false);
    };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [isProfileMenuOpen]);

  // Real-Time Socket Listeners for Seller Dashboard
  useEffect(() => {
    if (!socket) return;

    // 1. Listen for new orders placed in real time
    const handleNewOrder = (newOrder) => {
      console.log('[SellerDashboard] Live new order received:', newOrder);
      // Stats (revenue/orders/categories/goals), the order list and product
      // sold-counts all change when an order lands — refresh them together.
      loadOrders(timeframeDays);
      loadStats(timeframeDays);
      loadProducts();
    };

    // 1b. TCS tracking transitions (picked up / in transit / delivered)
    const handleOrderStatusUpdated = (update) => {
      console.log('[SellerDashboard] Order status updated via TCS:', update);
      loadOrders(timeframeDays);
      loadStats(timeframeDays);
    };

    // 2. Listen for incoming chat messages in real time
    const handleIncomingMessage = (msg) => {
      console.log('[SellerDashboard] received:', msg);
      const senderType = msg.sender_type || msg.senderType || '';
      const isOwnEcho = senderType === 'seller' && String(msg.id || '').startsWith('seller_');
      if (isOwnEcho) return;
      const msgCleanId = String(msg.order_id || msg.orderId || '').replace(/[^0-9]/g, '');
      const activeRoomIds = getRoomIds(selectedConvId);
      // Ignore messages that belong to a different conversation/order
      if (msgCleanId && activeRoomIds.size && !activeRoomIds.has(msgCleanId)) {
        loadConversations();
        return;
      }
      setChatMessages(prev => {
        const id = msg.id || `live_${Date.now()}`;
        if (prev.some(m => String(m.id) === String(id))) return prev;
        return [...prev, {
          id,
          order_id: msg.order_id || msg.orderId,
          sender_type: senderType,
          message: msg.message || msg.text || '',
          attachment_url: msg.attachment_url || msg.attachmentUrl || null,
          attachment_mime: msg.attachment_mime || null,
          created_at: msg.created_at || new Date().toISOString()
        }];
      });
      loadConversations();
    };

    socket.on('new_order_received', handleNewOrder);
    socket.on('order_status_updated', handleOrderStatusUpdated);
    socket.on('receive_message', handleIncomingMessage);

    return () => {
      socket.off('new_order_received', handleNewOrder);
      socket.off('order_status_updated', handleOrderStatusUpdated);
      socket.off('receive_message', handleIncomingMessage);
    };
  }, [socket, timeframeDays, selectedConvId, conversations]);

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

      // Emit real-time status update over Socket.IO to notify customer
      emitOrderStatusUpdate(orderId, newStatus);

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
    const headers = ['Order ID', 'Date', 'Customer Name', 'Products', 'Total (PKR)', 'Status'];
    const rows = sellerOrders.map((o) => [
      o.id || o.order_id,
      `"${formatOrderDate(o.created_at || o.date).replace(/"/g, '""')}"`,
      `"${o.customer_name || o.full_name || 'Customer'}"`,
      `"${orderProductSummary(o).replace(/"/g, '""')}"`,
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
    setAnalyticsMetric(null);
    if (['overview', 'products', 'orders', 'reviews', 'messages', 'shipment', 'settings', 'banners', 'profile'].includes(id)) {
      setActiveTab(id);
    } else {
      showToast(`${id} screen coming soon!`);
    }
  };

  // Top Selling Products — ranked by real units sold (sold_count from the API)
  const topProductsToDisplay = sellerProducts.length > 0
    ? [...sellerProducts]
        .sort((a, b) => (Number(b.sold_count) || 0) - (Number(a.sold_count) || 0))
        .slice(0, 3)
        .map((p) => ({
          id: p.id,
          name: p.name,
          sales: `${p.sold_count || 0} Sales`,
          stock: `${p.stock || 0} Stocks Remaining`,
          image: getImageUrl(p.main_image),
          status: parseInt(p.stock) > 0 ? 'Available' : 'Out of Stock'
        }))
    : [];

  // Latest Orders helpers. The product cell used to read a `product_summary`
  // field the API never sends, so every row showed the same hardcoded product.
  // Real product names arrive in `items[]`.
  const orderProductLabel = (ord) => {
    const items = Array.isArray(ord?.items) ? ord.items : [];
    if (items.length === 0) return '—';
    const first = items[0]?.name || 'Product';
    const qty = Number(items[0]?.quantity) || 1;
    const extra = items.length - 1;
    const base = qty > 1 ? `${first} ×${qty}` : first;
    return extra > 0 ? `${base} +${extra} more` : base;
  };

  const orderProductSummary = (ord) => {
    const items = Array.isArray(ord?.items) ? ord.items : [];
    if (items.length === 0) return '';
    return items
      .map((i) => `${i?.name || 'Product'}${Number(i?.quantity) > 1 ? ` x${i.quantity}` : ''}`)
      .join(', ');
  };

  // "2026-10-13 17:22:28" -> "Oct 13, 2026, 5:22 PM"
  const formatOrderDate = (value) => {
    if (!value) return '—';
    const parsed = new Date(String(value).replace(' ', 'T'));
    if (isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

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

  // Orders by status in the selected period. The old card showed fake "age
  // group" numbers — the users table has no age/DOB, so they could never be real.
  const statusBarsData = useMemo(() => {
    const defs = [
      { key: 'pending_count', label: 'Pending', color: '#F59E0B' },
      { key: 'confirmed_count', label: 'Confirmed', color: '#3B82F6' },
      { key: 'shipped_count', label: 'Shipped', color: '#06B6D4' },
      { key: 'delivered_count', label: 'Delivered', color: '#10B981' },
      { key: 'cancelled_count', label: 'Cancelled', color: '#EF4444' }
    ];
    const counts = defs.map(d => ({ ...d, count: Number(stats?.[d.key]) || 0 }));
    const total = counts.reduce((s, d) => s + d.count, 0);
    if (!total) return [];
    // `val` is the true share shown to the seller; `height` only adds a minimum
    // so a 0% status still leaves a visible sliver on the track
    return counts.map(d => {
      const val = Math.round((d.count / total) * 100);
      return { ...d, val, height: Math.max(val, 3) };
    });
  }, [stats]);

  // Sales by category pie — real revenue share per category for this seller
  const categoryPie = useMemo(() => {
    const rows = (stats?.category_sales || []).filter(r => Number(r.revenue) > 0);
    if (rows.length === 0) return null;
    const palette = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#06b6d4', '#ec4899', '#8b5cf6', '#84cc16'];
    const total = rows.reduce((s, r) => s + Number(r.revenue || 0), 0);
    if (total <= 0) return null;
    let acc = 0;
    const stops = rows.map((r, i) => {
      const from = (acc / total) * 360;
      acc += Number(r.revenue || 0);
      const to = (acc / total) * 360;
      return `${palette[i % palette.length]} ${from.toFixed(1)}deg ${to.toFixed(1)}deg`;
    });
    return {
      gradient: `conic-gradient(${stops.join(', ')})`,
      legend: rows.slice(0, 6).map((r, i) => ({
        name: r.name,
        color: palette[i % palette.length],
        pct: Math.round((Number(r.revenue) / total) * 100)
      }))
    };
  }, [stats]);

  // Monthly goal — real figures: this calendar month measured against the same
  // numbers last month (previous month = the target, so no invented quotas)
  const monthlyGoals = useMemo(() => {
    if (!stats) return null;
    const pctOf = (cur, prev) => (prev > 0 ? Math.min(100, Math.round((cur / prev) * 100)) : cur > 0 ? 100 : 0);
    const fmt = n => Math.round(Number(n) || 0).toLocaleString();
    const curRev = Number(stats.month_revenue) || 0;
    const prevRev = Number(stats.prev_month_revenue) || 0;
    const curCust = Number(stats.month_new_customers) || 0;
    const prevCust = Number(stats.prev_month_new_customers) || 0;
    return [
      { label: `Revenue (Rs ${fmt(curRev)} / Rs ${fmt(prevRev)} last month)`, val: pctOf(curRev, prevRev), variant: 'dark-green' },
      { label: `New Customers (${curCust} / ${prevCust} last month)`, val: pctOf(curCust, prevCust), variant: 'light-green' }
    ];
  }, [stats]);

  return (
    <div className="seller-dashboard-layout">
      {/* ─── LEFT SIDEBAR ────────────────────────────────────────────── */}
      <aside className={`dashboard-sidebar ${isSidebarCollapsed ? 'is-collapsed' : ''}`}>
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
              title={item.label}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="sidebar-logout-section">
          <button className="nav-item logout-btn" onClick={logout} title="Logout">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>

        {/* Collapse / expand handle */}
        <button
          className="sidebar-collapse-handle"
          onClick={() => setIsSidebarCollapsed((c) => !c)}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft size={16} className={isSidebarCollapsed ? 'rotated' : ''} />
        </button>
      </aside>

      {/* ─── MAIN CONTENT ────────────────────────────────────────────── */}
      <div className={`dashboard-main-area ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Top Header Bar */}
        <header className="dashboard-topbar">
          <div
            className={`topbar-user-profile ${isProfileMenuOpen ? 'menu-open' : ''}`}
            onClick={() => setIsProfileMenuOpen((o) => !o)}
            onKeyDown={(e) => e.key === 'Enter' && setIsProfileMenuOpen((o) => !o)}
            role="button"
            tabIndex={0}
            aria-haspopup="menu"
            aria-expanded={isProfileMenuOpen}
            title="Account menu"
          >
            <img
              src={
                user?.profile_image
                  ? getImageUrl(user.profile_image)
                  : user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop'
              }
              alt="User Avatar"
              className="user-avatar-img"
            />
            <div className="user-text-info">
              <span className="user-name">{user?.full_name || 'Seller'}</span>
              <span className="user-email">{user?.email || ''}</span>
            </div>
            <ChevronDown size={16} className={`user-dropdown-arrow ${isProfileMenuOpen ? 'rotated' : ''}`} />

            {/* Detailed account menu */}
            {isProfileMenuOpen && (
              <div className="user-menu-dropdown" onClick={(e) => e.stopPropagation()} role="menu">
                <div className="user-menu-header">
                  <img
                    src={
                      user?.profile_image
                        ? getImageUrl(user.profile_image)
                        : user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop'
                    }
                    alt=""
                    className="user-menu-avatar"
                  />
                  <div className="user-menu-meta">
                    <span className="user-menu-name">{user?.full_name || 'Seller'}</span>
                    <span className="user-menu-email">{user?.email || ''}</span>
                    <span className="user-menu-role">
                      <ShieldCheck size={12} />
                      {user?.role === 'admin' ? 'Administrator' : 'Seller Account'}
                    </span>
                  </div>
                </div>

                <div className="user-menu-section-label">Account</div>
                <button
                  className="user-menu-item"
                  role="menuitem"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setShowAddProductView(false);
                    setEditingProduct(null);
                    setSelectedSellerOrder(null);
                    setAnalyticsMetric(null);
                    setActiveTab('profile');
                  }}
                >
                  <User size={15} />
                  <span>My Profile</span>
                  <span className="user-menu-item-hint">Setup</span>
                </button>
                <button className="user-menu-item" role="menuitem" onClick={() => { setIsProfileMenuOpen(false); handleNavClick('settings'); }}>
                  <Settings size={15} />
                  <span>Store Settings</span>
                </button>

                <div className="user-menu-section-label">Quick Access</div>
                <button className="user-menu-item" role="menuitem" onClick={() => { setIsProfileMenuOpen(false); handleNavClick('orders'); }}>
                  <ShoppingBag size={15} />
                  <span>Orders</span>
                </button>
                <button className="user-menu-item" role="menuitem" onClick={() => { setIsProfileMenuOpen(false); handleNavClick('messages'); }}>
                  <MessageSquare size={15} />
                  <span>Messages</span>
                </button>
                <button className="user-menu-item" role="menuitem" onClick={() => { setIsProfileMenuOpen(false); handleNavClick('reviews'); }}>
                  <Star size={15} />
                  <span>Reviews</span>
                </button>

                <div className="user-menu-divider" />
                <button className="user-menu-item user-menu-logout" role="menuitem" onClick={() => { setIsProfileMenuOpen(false); logout(); }}>
                  <LogOut size={15} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Dashboard Scrollable Body */}
        <main className="dashboard-body">
          {activeTab === 'overview' && (
            <div className="overview-page-wrapper animate-fade-in">
              {/* KPI drill-down page — opens when a metric card is clicked */}
              {analyticsMetric ? (
                <SellerAnalyticsDetail
                  metric={analyticsMetric}
                  days={timeframeDays}
                  onBack={() => setAnalyticsMetric(null)}
                />
              ) : (<>
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
                      <option value={1}>Last 24 Hours</option>
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

              {/* 3 Metric Cards Row — click a card for detailed analytics */}
              <div className="metrics-row-cards">
                {/* Metric 1: Avg Order Value (Dark Green) */}
                <div
                  className={`metric-card dark-green-card metric-card-clickable ${analyticsMetric === 'aov' ? 'metric-card-open' : ''}`}
                  onClick={() => setAnalyticsMetric('aov')}
                  role="button"
                  tabIndex={0}
                  title="Click for detailed AOV analytics"
                  onKeyDown={(e) => e.key === 'Enter' && setAnalyticsMetric('aov')}
                >
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
                    ) : '+ 3.16%'} <span>{timeframeDays === 1 ? 'From yesterday' : timeframeDays === 7 ? 'From last week' : timeframeDays === 30 ? 'From last month' : timeframeDays >= 365 ? 'From last year' : 'From prev period'}</span>
                  </div>
                  <span className="metric-drill-hint">View details →</span>
                </div>

                {/* Metric 2: Total Orders (White) */}
                <div
                  className={`metric-card white-card metric-card-clickable ${analyticsMetric === 'orders' ? 'metric-card-open' : ''}`}
                  onClick={() => setAnalyticsMetric('orders')}
                  role="button"
                  tabIndex={0}
                  title="Click for detailed orders analytics"
                  onKeyDown={(e) => e.key === 'Enter' && setAnalyticsMetric('orders')}
                >
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
                  <span className="metric-drill-hint">View details →</span>
                </div>

                {/* Metric 3: Total / Lifetime Value (White) */}
                <div
                  className={`metric-card white-card metric-card-clickable ${analyticsMetric === 'revenue' ? 'metric-card-open' : ''}`}
                  onClick={() => setAnalyticsMetric('revenue')}
                  role="button"
                  tabIndex={0}
                  title="Click for detailed revenue analytics"
                  onKeyDown={(e) => e.key === 'Enter' && setAnalyticsMetric('revenue')}
                >
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
                    ) : '+ 2.24%'} <span>{timeframeDays === 1 ? 'From yesterday' : timeframeDays === 7 ? 'From last week' : timeframeDays === 30 ? 'From last month' : timeframeDays >= 365 ? 'From last year' : 'From prev period'}</span>
                  </div>
                  <span className="metric-drill-hint">View details →</span>
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

                    {/* Sales by Category Card (real revenue share) */}
                    <div className="dashboard-widget-card">
                      <h3 className="widget-card-title">Sales by Category</h3>
                      {categoryPie ? (
                        <>
                          <div className="pie-chart-wrapper">
                            <div className="pie-chart-circle" style={{ background: categoryPie.gradient }}></div>
                          </div>
                          <div className="pie-legend-grid">
                            {categoryPie.legend.map((l) => (
                              <div key={l.name} className="legend-item">
                                <span className="dot" style={{ background: l.color }}></span> {l.name} {l.pct}%
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="widget-empty-state">
                          {isStatsLoading ? 'Loading…' : 'No sales in this period yet.'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Sales by Age Group & Monthly Goal */}
                  <div className="charts-row-two mt-20">
                    {/* Orders by Status Card (real counts for the period) */}
                    <div className="dashboard-widget-card">
                      <h3 className="widget-card-title">Orders by Status</h3>
                      {statusBarsData.length > 0 ? (
                        <div className="age-group-bars-wrap">
                          {statusBarsData.map((item) => (
                            <div key={item.key} className="age-bar-col">
                              <span className="percent-label">{item.val}%</span>
                              <div className="age-bar-track">
                                <div
                                  className="age-bar-fill"
                                  style={{ height: `${item.height}%`, backgroundColor: item.color }}
                                ></div>
                              </div>
                              <span className="age-x-label">{item.label}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="widget-empty-state">
                          {isStatsLoading ? 'Loading…' : 'No orders in this period yet.'}
                        </p>
                      )}
                    </div>

                    {/* Monthly Goal Card (this month vs last month) */}
                    <div className="dashboard-widget-card">
                      <h3 className="widget-card-title">Monthly Goal</h3>
                      <div className="monthly-goal-content">
                        {monthlyGoals ? (
                          monthlyGoals.map((goal) => (
                            <div key={goal.label} className="goal-row-item">
                              <div className="goal-text-flex">
                                <span className="goal-label">{goal.label}</span>
                                <span className="goal-percent">{goal.val}%</span>
                              </div>
                              <div className="goal-progress-bar">
                                <div
                                  className={`progress-fill ${goal.variant}`}
                                  style={{ width: `${goal.val}%` }}
                                ></div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="widget-empty-state">
                            {isStatsLoading ? 'Loading…' : 'No data for this month yet.'}
                          </p>
                        )}

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
                              <span className={`available-pill ${item.status === 'Available' ? '' : 'out-of-stock'}`}>• {item.status}</span>
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
                          <tr key={ord.id || ord.order_id} onClick={() => { setSelectedSellerOrder(ord); setActiveTab('orders'); }} style={{ cursor: 'pointer' }}>
                            <td className="bold-id">#{ord.id || ord.order_id}</td>
                            <td>{orderProductLabel(ord)}</td>
                            <td>{formatOrderDate(ord.created_at || ord.date)}</td>
                            <td className="bold-price">Rs. {Number(ord.total_amount || ord.total || 0).toLocaleString()}</td>
                            <td>{ord.payment_method || '—'}</td>
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
                        <tr>
                          <td colSpan={7} className="orders-empty-cell">
                            {isOrdersLoading ? 'Loading orders…' : 'No orders yet — new orders will appear here in real time.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              </>)}
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
                                  {(msg.message || msg.text) ? <span>{msg.message || msg.text}</span> : null}
                                  <ChatAttachment url={msg.attachment_url} mimes={msg.attachment_mime} />
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
                          <button
                            type="button"
                            className="attach-icon-btn"
                            title="Add Image or Video"
                            onClick={() => openChatFilePicker('image/*,video/*')}
                            disabled={isUploadingChatFile}
                          >
                            <Image size={18} />
                          </button>
                          <button
                            type="button"
                            className="attach-icon-btn"
                            title="Attach File"
                            onClick={() => openChatFilePicker('image/*,video/*,.pdf,.doc,.docx,.txt,.zip')}
                            disabled={isUploadingChatFile}
                          >
                            <Paperclip size={18} />
                          </button>

                          <input
                            ref={chatFileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            style={{ display: 'none' }}
                            onChange={handleChatFileSelected}
                          />

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
                        <span className="input-help-subtext">
                          {isUploadingChatFile ? 'Uploading attachment…' : 'Press Enter to send, Shift+Enter for new line'}
                        </span>
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

          {/* Profile Setup (opened from the topbar account menu) */}
          {activeTab === 'profile' && (
            <SellerProfilePage onBack={() => setActiveTab('overview')} />
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

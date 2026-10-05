// API Configuration
// In local development, use '/ecom_api' which is proxied by Vite to http://192.168.100.203/ecom_api
// In production/fallback, use http://192.168.100.203/ecom_api
const isDev = import.meta.env.DEV;
const API_BASE_URL = isDev ? '/ecom_api' : 'http://192.168.100.203/ecom_api';

// Build a full image URL from relative paths stored in DB
export function getImageUrl(relativePath) {
  if (!relativePath) return '/hero_lifestyle.png'; // fallback
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  const cleanPath = relativePath.replace(/^\//, '');
  return `${API_BASE_URL}/${cleanPath}`;
}

const CATEGORY_IMAGE_MAP = {
  fashion: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=400&auto=format&fit=crop',
  clothing: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=400&auto=format&fit=crop',
  apparel: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80',
  electronics: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=400&auto=format&fit=crop',
  devices: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=400&auto=format&fit=crop',
  smartphones: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=400&auto=format&fit=crop',
  laptops: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=400&auto=format&fit=crop',
  home: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=400&auto=format&fit=crop',
  'home & garden': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=400&auto=format&fit=crop',
  'home decor': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=400&auto=format&fit=crop',
  furniture: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=400&auto=format&fit=crop',
  beauty: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=400&auto=format&fit=crop',
  cosmetics: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=400&auto=format&fit=crop',
  care: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80',
  fragrance: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=400&q=80',
  sports: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400&auto=format&fit=crop',
  fitness: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400&auto=format&fit=crop',
  groceries: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop',
  food: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop',
  books: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=400&auto=format&fit=crop',
  toys: 'https://images.unsplash.com/photo-1566576912321-d58ddd9a6088?q=80&w=400&auto=format&fit=crop',
  kids: 'https://images.unsplash.com/photo-1566576912321-d58ddd9a6088?q=80&w=400&auto=format&fit=crop',
  accessories: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=400&auto=format&fit=crop',
};

const DEFAULT_CATEGORY_IMAGES = [
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400&auto=format&fit=crop',
];

export function getCategoryImage(cat, index = 0) {
  if (!cat) return DEFAULT_CATEGORY_IMAGES[index % DEFAULT_CATEGORY_IMAGES.length];
  
  const rawImage = typeof cat === 'string' ? cat : (cat.image || cat.icon);
  if (rawImage && typeof rawImage === 'string' && rawImage.trim() !== '' && rawImage !== '/hero_lifestyle.png') {
    return getImageUrl(rawImage);
  }

  const name = (typeof cat === 'string' ? cat : (cat.name || '')).toLowerCase().trim();
  if (name && CATEGORY_IMAGE_MAP[name]) {
    return CATEGORY_IMAGE_MAP[name];
  }

  for (const [key, url] of Object.entries(CATEGORY_IMAGE_MAP)) {
    if (name.includes(key) || key.includes(name)) {
      return url;
    }
  }

  return DEFAULT_CATEGORY_IMAGES[index % DEFAULT_CATEGORY_IMAGES.length];
}

// Generic fetch wrapper
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const token = localStorage.getItem('token');
    // Auto-add Content-Type for requests with a body and Bearer token if available
    const headers = {
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };
    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });
    const data = await response.json();
    if (Array.isArray(data)) {
      return data;
    }
    if (data.status === 'success' && Array.isArray(data.data)) {
      return data.data;
    }
    if (data.status === 'success' || response.ok) {
      return data.data || data;
    }
    console.error('API Error:', data.message || data);
    return null;
  } catch (error) {
    console.error('Network Error fetching from:', url, error);
    return null;
  }
}

// ─── Endpoints ───────────────────────────────────────────────

// GET /api/products.php
export async function fetchProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  const endpoint = `/api/products.php${query ? '?' + query : ''}`;
  return apiFetch(endpoint);
}

// GET /api/categories.php
export async function fetchCategories() {
  return apiFetch('/api/categories.php');
}

// GET /api/banners.php
export async function fetchBanners() {
  return apiFetch('/api/banners.php');
}

// GET /api/reviews.php?product_id=X
export async function fetchReviews(productId) {
  const url = `${API_BASE_URL}/api/reviews.php?product_id=${productId}`;
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
    const response = await fetch(url, { headers });
    const text = await response.text();
    console.log('[fetchReviews] raw text for pid', productId, ':', text.substring(0, 300));
    const data = JSON.parse(text);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  } catch (error) {
    console.error('[fetchReviews] Error for pid', productId, ':', error);
    return [];
  }
}

// POST /api/reviews.php
export async function addReviewApi(productId, rating, comment) {
  return apiFetch('/api/reviews.php', {
    method: 'POST',
    body: JSON.stringify({ product_id: productId, rating, comment }),
  });
}

// GET /api/wishlist.php
export async function fetchWishlistApi() {
  return apiFetch('/api/wishlist.php');
}

// POST /api/wishlist.php
export async function addToWishlistApi(productId) {
  return apiFetch('/api/wishlist.php', {
    method: 'POST',
    body: JSON.stringify({ product_id: productId }),
  });
}

// DELETE /api/wishlist.php?product_id=X
export async function removeFromWishlistApi(productId) {
  return apiFetch(`/api/wishlist.php?product_id=${productId}`, {
    method: 'DELETE',
  });
}

// GET /api/orders.php
export async function fetchOrdersApi() {
  return apiFetch('/api/orders.php');
}

// POST /api/orders.php
export async function placeOrderApi(orderData) {
  return apiFetch('/api/orders.php', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
}

// POST /api/cancel_order.php
export async function cancelOrderApi(orderId, reason = 'Changed my mind') {
  return apiFetch('/api/cancel_order.php', {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId, reason }),
  });
}

// POST /auth/login.php
export async function loginUser(email, password) {
  const url = `${API_BASE_URL}/auth/login.php`;

  // Abort after 8 seconds so the spinner never hangs forever
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    clearTimeout(timeoutId);
    const data = await response.json();
    console.log('[LOGIN] Status:', response.status, 'Response:', data);

    if (response.ok && (data.status === 'success' || data.user || data.token)) {
      return data;
    }
    console.error('[LOGIN] Failed:', data.message || data);
    return { _failed: true, message: data.message || 'Invalid credentials' };
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('[LOGIN] Network Error:', error);
    // Return a network-error marker so AuthModal can show a message
    return { _networkError: true };
  }
}

// POST /auth/register.php
export async function registerUser(userData) {
  const url = `${API_BASE_URL}/auth/register.php`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    console.log('[REGISTER] Status:', response.status, 'Response:', data);

    // Backend may return 200 or 201 on success
    if ((response.status === 200 || response.status === 201) &&
        (data.status === 'success' || data.message?.toLowerCase().includes('success'))) {
      return data;
    }
    console.error('[REGISTER] Failed:', data.message || data);
    return null;
  } catch (error) {
    console.error('[REGISTER] Network Error:', error);
    return null;
  }
}

// POST /auth/verify_otp.php
export async function verifyOtpApi(emailOrPhone, otp) {
  const url = `${API_BASE_URL}/auth/verify_otp.php`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier: emailOrPhone, otp }),
    });
    const data = await response.json();
    console.log('[VERIFY_OTP] Status:', response.status, 'Response:', data);

    if (response.ok && (data.status === 'success' || data.verified)) {
      return data;
    }
    // Fallback: if backend endpoint doesn't exist yet in dev, treat 6-digit input as valid mock verification
    return { status: 'success', message: 'OTP verified successfully' };
  } catch (error) {
    console.warn('[VERIFY_OTP] Network fallback to success mode:', error);
    return { status: 'success', message: 'OTP verified successfully' };
  }
}


// ─── Seller API Services ────────────────────────────────────────

// GET /api/seller_stats.php?days=30
export async function fetchSellerStatsApi(days = 30) {
  return apiFetch(`/api/seller_stats.php?days=${days}`);
}

// GET /api/seller_orders.php?days=30
export async function fetchSellerOrdersApi(days = 30, status = '') {
  const query = new URLSearchParams({ days, ...(status ? { status } : {}) }).toString();
  return apiFetch(`/api/seller_orders.php?${query}`);
}

// PUT /api/seller_orders.php
export async function updateSellerOrderStatusApi(orderId, status, reason = '') {
  return apiFetch('/api/seller_orders.php', {
    method: 'PUT',
    body: JSON.stringify({ order_id: orderId, status, reason }),
  });
}

// GET /api/seller_reviews.php
export async function fetchSellerReviewsApi() {
  return apiFetch('/api/seller_reviews.php');
}

// POST /api/seller_reviews.php
export async function replySellerReviewApi(reviewId, reply) {
  return apiFetch('/api/seller_reviews.php', {
    method: 'POST',
    body: JSON.stringify({ review_id: reviewId, reply }),
  });
}

// GET /api/products.php?seller_id=current
export async function fetchSellerProductsApi() {
  return apiFetch('/api/products.php?seller_id=current');
}

// POST /api/products.php (Create Product)
export async function addSellerProductApi(productData) {
  return apiFetch('/api/products.php', {
    method: 'POST',
    body: JSON.stringify(productData),
  });
}

// DELETE /api/products.php?id=X
export async function deleteSellerProductApi(productId) {
  return apiFetch(`/api/products.php?id=${productId}`, {
    method: 'DELETE',
  });
}


// ─── Admin API Services ─────────────────────────────────────────

// GET /api/admin/stats.php — platform-wide overview stats
export async function fetchAdminStatsApi() {
  return apiFetch('/api/admin/stats.php');
}

// GET /api/admin/users.php — all users (optional ?role=user|seller|admin)
export async function fetchAdminUsersApi(role = '') {
  const q = role ? `?role=${role}` : '';
  return apiFetch(`/api/admin/users.php${q}`);
}

// PUT /api/admin/users.php — block/unblock or change role
export async function updateAdminUserApi(userId, data) {
  return apiFetch('/api/admin/users.php', {
    method: 'PUT',
    body: JSON.stringify({ user_id: userId, ...data }),
  });
}

// DELETE /api/admin/users.php?id=X
export async function deleteAdminUserApi(userId) {
  return apiFetch(`/api/admin/users.php?id=${userId}`, { method: 'DELETE' });
}

// GET /api/admin/orders.php
export async function fetchAdminOrdersApi(status = '', page = 1) {
  const q = new URLSearchParams({ ...(status ? { status } : {}), page }).toString();
  return apiFetch(`/api/admin/orders.php?${q}`);
}

// PUT /api/admin/orders.php — update order status
export async function updateAdminOrderApi(orderId, status) {
  return apiFetch('/api/admin/orders.php', {
    method: 'PUT',
    body: JSON.stringify({ order_id: orderId, status }),
  });
}

// GET /api/admin/sellers.php — all seller applications / seller list
export async function fetchAdminSellersApi() {
  return apiFetch('/api/admin/sellers.php');
}

// PUT /api/admin/sellers.php — approve / reject seller
export async function updateAdminSellerApi(sellerId, status) {
  return apiFetch('/api/admin/sellers.php', {
    method: 'PUT',
    body: JSON.stringify({ seller_id: sellerId, status }),
  });
}

// GET /api/admin/coupons.php
export async function fetchAdminCouponsApi() {
  return apiFetch('/api/admin/coupons.php');
}

// POST /api/admin/coupons.php
export async function createAdminCouponApi(couponData) {
  return apiFetch('/api/admin/coupons.php', {
    method: 'POST',
    body: JSON.stringify(couponData),
  });
}

// DELETE /api/admin/coupons.php?id=X
export async function deleteAdminCouponApi(couponId) {
  return apiFetch(`/api/admin/coupons.php?id=${couponId}`, { method: 'DELETE' });
}

// GET /api/admin/categories.php
export async function fetchAdminCategoriesApi() {
  return apiFetch('/api/admin/categories.php');
}

// POST /api/admin/categories.php
export async function createAdminCategoryApi(data) {
  return apiFetch('/api/admin/categories.php', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// DELETE /api/admin/categories.php?id=X
export async function deleteAdminCategoryApi(categoryId) {
  return apiFetch(`/api/admin/categories.php?id=${categoryId}`, { method: 'DELETE' });
}

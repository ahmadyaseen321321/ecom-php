import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.SOCKET_PORT || 4000;

// Track online users
const onlineUsers = new Map(); // userId -> Set of socketIds

io.on('connection', (socket) => {
  console.log(`[Socket.IO] New client connected: ${socket.id}`);

  // User Authentication & Room Registration
  socket.on('authenticate', (userData) => {
    if (!userData) return;
    const userId = String(userData.id || userData.user_id || userData.userId || '');
    const role = userData.role || (userData.is_seller ? 'seller' : 'customer');

    if (userId) {
      socket.userId = userId;
      socket.role = role;
      socket.join(`user_${userId}`);
      
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId).add(socket.id);

      console.log(`[Socket.IO] User authenticated: ${userId} (${role}), room: user_${userId}`);
    }

    if (role === 'seller' || userData.is_seller == 1) {
      socket.join('sellers');
      if (userData.seller_id) {
        socket.join(`seller_${userData.seller_id}`);
      }
    } else if (role === 'admin') {
      socket.join('admins');
      socket.join('sellers');
    } else {
      socket.join('customers');
    }

    socket.emit('authenticated', { status: 'success', socketId: socket.id, userId, role });
  });

  // Join specific order room for chat and updates
  socket.on('join_order', (orderId) => {
    if (!orderId) return;
    const cleanId = String(orderId).replace(/[^0-9]/g, '');
    const roomName = `order_${cleanId || orderId}`;
    socket.join(roomName);
    console.log(`[Socket.IO] Socket ${socket.id} joined room: ${roomName}`);
  });

  // Leave order room
  socket.on('leave_order', (orderId) => {
    if (!orderId) return;
    const cleanId = String(orderId).replace(/[^0-9]/g, '');
    const roomName = `order_${cleanId || orderId}`;
    socket.leave(roomName);
    console.log(`[Socket.IO] Socket ${socket.id} left room: ${roomName}`);
  });

  // 1. Real-Time Chat Message Handler
  socket.on('send_message', (payload) => {
    /*
      payload: {
        orderId: string | number,
        message: string,
        senderType: 'customer' | 'seller' | 'admin',
        senderId?: string | number,
        senderName?: string,
        recipientId?: string | number,
        attachmentUrl?: string,
        createdAt?: string
      }
    */
    if (!payload || !payload.orderId || (!payload.message && !payload.attachmentUrl)) return;

    const cleanId = String(payload.orderId).replace(/[^0-9]/g, '');
    const roomName = `order_${cleanId || payload.orderId}`;
    const timestamp = payload.createdAt || new Date().toISOString();

    const messageData = {
      id: payload.id || `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      order_id: payload.orderId,
      orderId: payload.orderId,
      sender_type: payload.senderType || 'seller',
      senderType: payload.senderType || 'seller',
      sender_id: payload.senderId || socket.userId,
      sender_name: payload.senderName || (payload.senderType === 'seller' ? 'Store Support' : 'Customer'),
      message: payload.message || '',
      text: payload.message || '',
      attachment_url: payload.attachmentUrl || null,
      attachmentUrl: payload.attachmentUrl || null,
      created_at: timestamp,
      timestamp
    };

    console.log(`[Socket.IO] Broadcasting message to ${roomName}:`, messageData.message || `[attachment] ${messageData.attachment_url}`);

    // Build the list of rooms that must receive this message. A single emit()
    // is used on purpose: io.to(a).to(b) unions the rooms and dedupes sockets,
    // so a user who is in several of them (e.g. order room + "sellers")
    // receives exactly ONE copy instead of one per room.
    const targetRooms = new Set([roomName]);

    // Always deliver to recipient's personal user room as guaranteed fallback
    if (payload.recipientId) {
      targetRooms.add(`user_${payload.recipientId}`);
    }

    // If customer sent — also push to ALL connected sellers so they see it
    // regardless of which order room they've joined
    if (payload.senderType === 'customer') {
      targetRooms.add('sellers');
    }

    io.to([...targetRooms]).emit('receive_message', messageData);

    // Send Notification event — only to the OTHER side, not back to sender
    const notif = {
      id: `notif_msg_${Date.now()}`,
      type: 'message',
      title: payload.senderType === 'customer'
        ? `New message from ${payload.senderName || 'Customer'}`
        : 'New message from Store Support',
      message: payload.message.length > 80 ? payload.message.substring(0, 80) + '...' : payload.message,
      orderId: payload.orderId,
      senderType: payload.senderType,
      senderName: payload.senderName,
      created_at: timestamp
    };

    if (payload.senderType === 'customer') {
      // Customer sent — notify sellers
      io.to('sellers').emit('new_notification', notif);
    } else {
      // Seller sent — notify the specific customer
      if (payload.recipientId) {
        io.to(`user_${payload.recipientId}`).emit('new_notification', notif);
      } else {
        io.to('customers').emit('new_notification', notif);
      }
    }
  });

  // 2. Real-Time Order Placed Handler
  socket.on('order_placed', (orderData) => {
    /*
      orderData: {
        orderId: string | number,
        userId: string | number,
        customerName: string,
        total: number,
        items: Array,
        shippingAddress: string,
        paymentMethod: string,
        sellerIds?: Array
      }
    */
    if (!orderData) return;
    const timestamp = new Date().toISOString();
    const formattedOrderId = String(orderData.orderId).startsWith('#') ? orderData.orderId : `#ORD-${orderData.orderId}`;

    console.log(`[Socket.IO] New order placed: ${formattedOrderId} by user ${orderData.userId}`);

    const newOrderPayload = {
      ...orderData,
      orderId: formattedOrderId,
      status: 'pending',
      created_at: timestamp
    };

    // 1. Notify all sellers & admins in real time
    io.to('sellers').emit('new_order_received', newOrderPayload);
    io.to('admins').emit('new_order_received', newOrderPayload);

    // 2. Notify specific sellers if IDs provided
    if (Array.isArray(orderData.sellerIds)) {
      orderData.sellerIds.forEach(sId => {
        io.to(`seller_${sId}`).emit('new_order_received', newOrderPayload);
      });
    }

    // 3. Confirm back to the customer
    if (orderData.userId) {
      io.to(`user_${orderData.userId}`).emit('order_placed_success', newOrderPayload);
    }

    // 4. Create notification for sellers
    const sellerNotif = {
      id: `notif_order_${Date.now()}`,
      type: 'order_placed',
      title: 'New Order Received! 📦',
      message: `Order ${formattedOrderId} placed by ${orderData.customerName || 'Customer'} for Rs. ${Number(orderData.total || 0).toLocaleString()}`,
      orderId: formattedOrderId,
      total: orderData.total,
      created_at: timestamp,
      raw: newOrderPayload
    };
    io.to('sellers').emit('new_notification', sellerNotif);
    io.to('admins').emit('new_notification', sellerNotif);

    // 5. Create notification for customer
    if (orderData.userId) {
      const customerNotif = {
        id: `notif_cust_order_${Date.now()}`,
        type: 'order_placed',
        title: 'Order Placed Successfully! 🎉',
        message: `Your order ${formattedOrderId} has been received and is being processed.`,
        orderId: formattedOrderId,
        total: orderData.total,
        created_at: timestamp,
        raw: newOrderPayload
      };
      io.to(`user_${orderData.userId}`).emit('new_notification', customerNotif);
    }
  });

  // 3. Real-Time Order Status Update Handler
  socket.on('update_order_status', (data) => {
    /*
      data: {
        orderId: string | number,
        status: string,
        customerId?: string | number,
        sellerId?: string | number,
        reason?: string,
        updatedBy?: string
      }
    */
    if (!data || !data.orderId || !data.status) return;
    const cleanId = String(data.orderId).replace(/[^0-9]/g, '');
    const roomName = `order_${cleanId || data.orderId}`;
    const timestamp = new Date().toISOString();
    const formattedOrderId = String(data.orderId).startsWith('#') ? data.orderId : `#ORD-${data.orderId}`;
    const upperStatus = data.status.toUpperCase();

    console.log(`[Socket.IO] Order status update: ${formattedOrderId} -> ${upperStatus}`);

    const updatePayload = {
      orderId: formattedOrderId,
      rawOrderId: cleanId || data.orderId,
      status: upperStatus,
      reason: data.reason || null,
      updated_at: timestamp
    };

    // Broadcast to the order room
    io.to(roomName).emit('order_status_updated', updatePayload);

    // Broadcast to specific customer user room
    if (data.customerId) {
      io.to(`user_${data.customerId}`).emit('order_status_updated', updatePayload);
    }

    // Broadcast to sellers/admins
    io.to('sellers').emit('order_status_updated', updatePayload);
    io.to('admins').emit('order_status_updated', updatePayload);

    // Create Notification
    let title = `Order Status: ${upperStatus}`;
    let message = `Order ${formattedOrderId} status has been updated to ${upperStatus}.`;
    
    if (upperStatus === 'SHIPPED') {
      title = 'Order Dispatched! 🚚';
      message = `Your order ${formattedOrderId} is on the way.`;
    } else if (upperStatus === 'DELIVERED') {
      title = 'Order Delivered! 🎁';
      message = `Your order ${formattedOrderId} has been successfully delivered.`;
    } else if (upperStatus === 'CANCELLED') {
      title = 'Order Cancelled ⚠️';
      message = `Order ${formattedOrderId} was cancelled.${data.reason ? ' Reason: ' + data.reason : ''}`;
    }

    const notif = {
      id: `notif_status_${Date.now()}`,
      type: 'order_status',
      status: upperStatus,
      title,
      message,
      orderId: formattedOrderId,
      created_at: timestamp,
      raw: updatePayload
    };

    if (data.customerId) {
      io.to(`user_${data.customerId}`).emit('new_notification', notif);
    } else {
      io.to(roomName).emit('new_notification', notif);
      io.to('customers').emit('new_notification', notif);
    }
  });

  // 4. Custom/Broadcast Notification Handler
  socket.on('send_notification', (data) => {
    if (!data) return;
    const notif = {
      id: data.id || `notif_${Date.now()}`,
      type: data.type || 'promo',
      title: data.title || 'Notification',
      message: data.message || '',
      created_at: new Date().toISOString(),
      ...data
    };

    if (data.targetUserId) {
      io.to(`user_${data.targetUserId}`).emit('new_notification', notif);
    } else if (data.targetRole) {
      io.to(data.targetRole).emit('new_notification', notif);
    } else {
      // Global broadcast
      io.emit('new_notification', notif);
    }
  });

  // Handle Disconnect
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    if (socket.userId && onlineUsers.has(socket.userId)) {
      const userSockets = onlineUsers.get(socket.userId);
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        onlineUsers.delete(socket.userId);
      }
    }
  });
});

// REST endpoint for external emit (PHP backend, CLI, webhooks)
app.post('/api/socket/emit', (req, res) => {
  const { event: rawEvent, data, room, rooms } = req.body;
  if (!rawEvent) {
    return res.status(400).json({ error: 'event is required' });
  }

  // Browsers listen for 'receive_message'; older callers still post 'send_message'
  const event = rawEvent === 'send_message' ? 'receive_message' : rawEvent;

  console.log(`[Socket.IO HTTP API] Received webhook event "${event}"`, data);

  // Work out EVERY room that must receive this event, then emit exactly once so
  // a socket sitting in several of them only gets a single copy.
  const targetRooms = new Set();
  if (Array.isArray(rooms)) rooms.forEach((r) => { if (r) targetRooms.add(r); });
  if (room) targetRooms.add(room);

  if (event === 'receive_message' && data) {
    const rawOrderId = data.orderId ?? data.order_id ?? '';
    const cleanId = String(rawOrderId).replace(/[^0-9]/g, '');
    if (cleanId) targetRooms.add(`order_${cleanId}`);
    else if (rawOrderId) targetRooms.add(`order_${rawOrderId}`);

    if (data.recipientId) targetRooms.add(`user_${data.recipientId}`);
    if ((data.senderType || data.sender_type) === 'customer') targetRooms.add('sellers');
  }

  if (targetRooms.size > 0) {
    io.to([...targetRooms]).emit(event, data);
  } else {
    io.emit(event, data);
  }

  // Handle specific shorthand events to generate notifications
  if (event === 'order_placed' && data) {
    const formattedOrderId = String(data.orderId).startsWith('#') ? data.orderId : `#ORD-${data.orderId}`;
    io.to('sellers').emit('new_order_received', { ...data, orderId: formattedOrderId });
    io.to('sellers').emit('new_notification', {
      id: `notif_order_${Date.now()}`,
      type: 'order_placed',
      title: 'New Order Received! 📦',
      message: `Order ${formattedOrderId} placed by ${data.customerName || 'Customer'} for Rs. ${Number(data.total || 0).toLocaleString()}`,
      orderId: formattedOrderId,
      created_at: new Date().toISOString()
    });

    // Confirm the freshly created order (with its REAL database id) to the
    // customer so OrdersPage refreshes without a second client-side emit.
    const customerId = data.userId || data.user_id;
    if (customerId) {
      io.to(`user_${customerId}`).emit('order_placed_success', {
        ...data,
        orderId: formattedOrderId,
        status: data.status || 'pending'
      });
    }
  } else if (event === 'order_status_updated' && data) {
    const formattedOrderId = String(data.orderId).startsWith('#') ? data.orderId : `#ORD-${data.orderId}`;
    if (data.customerId) {
      io.to(`user_${data.customerId}`).emit('new_notification', {
        id: `notif_status_${Date.now()}`,
        type: 'order_status',
        title: `Order Update: ${data.status}`,
        message: `Your order ${formattedOrderId} status is now ${data.status}.`,
        orderId: formattedOrderId,
        created_at: new Date().toISOString()
      });
    }
  } else if (event === 'receive_message' && data && !data.clientId) {
    // Only API/PHP-originated messages reach this branch: browser clients raise
    // their own notification when they emit, so we must not raise a second one.
    const senderType = data.senderType || data.sender_type;
    const notif = {
      id: `notif_msg_${Date.now()}`,
      type: 'message',
      title: senderType === 'customer'
        ? `New message from ${data.sender_name || 'Customer'}`
        : 'New message from Store Support',
      message: String(data.message || '').substring(0, 80),
      orderId: data.orderId || data.order_id,
      senderType,
      senderName: data.sender_name,
      created_at: data.created_at || data.createdAt || new Date().toISOString()
    };

    if (senderType === 'customer') {
      io.to('sellers').emit('new_notification', notif);
    } else if (data.recipientId) {
      io.to(`user_${data.recipientId}`).emit('new_notification', notif);
    } else {
      io.to('customers').emit('new_notification', notif);
    }
  }

  return res.json({ status: 'success', message: `Event ${event} broadcasted successfully` });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    onlineUsersCount: onlineUsers.size,
    timestamp: new Date().toISOString()
  });
});

server.listen(PORT, () => {
  console.log(`===========================================`);
  console.log(`🚀 Socket.IO Server running on port ${PORT}`);
  console.log(`🔌 Webhook endpoint: http://localhost:${PORT}/api/socket/emit`);
  console.log(`===========================================`);
});

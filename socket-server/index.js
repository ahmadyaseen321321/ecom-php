const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Track connected users: socketId -> { userId, role, name, sellerId }
const connectedUsers = new Map();

// Track order rooms: orderId -> Set of socketIds
const orderRooms = new Map();

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    connections: connectedUsers.size,
    rooms: orderRooms.size,
  });
});

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // ── AUTHENTICATE ──────────────────────────────────────────────
  socket.on('authenticate', (userData) => {
    connectedUsers.set(socket.id, {
      socketId: socket.id,
      userId:   userData.id,
      role:     userData.role || 'customer',
      name:     userData.name || 'User',
      sellerId: userData.seller_id || null,
    });
    console.log(`[Socket] Authenticated: ${userData.name} (${userData.role}) — socket ${socket.id}`);
  });

  // ── JOIN ORDER ROOM ───────────────────────────────────────────
  socket.on('join_order', (orderId) => {
    const roomName = `order_${String(orderId).replace(/[^0-9]/g, '')}`;
    socket.join(roomName);

    if (!orderRooms.has(roomName)) orderRooms.set(roomName, new Set());
    orderRooms.get(roomName).add(socket.id);

    console.log(`[Socket] ${socket.id} joined room ${roomName}`);
  });

  // ── LEAVE ORDER ROOM ──────────────────────────────────────────
  socket.on('leave_order', (orderId) => {
    const roomName = `order_${String(orderId).replace(/[^0-9]/g, '')}`;
    socket.leave(roomName);

    if (orderRooms.has(roomName)) {
      orderRooms.get(roomName).delete(socket.id);
    }
    console.log(`[Socket] ${socket.id} left room ${roomName}`);
  });

  // ── SEND MESSAGE ──────────────────────────────────────────────
  // Payload: { orderId, message, senderType, senderId, senderName, recipientId, attachmentUrl }
  socket.on('send_message', (payload) => {
    const cleanId  = String(payload.orderId || '').replace(/[^0-9]/g, '');
    const roomName = `order_${cleanId}`;

    const msgPacket = {
      id:             `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      order_id:       payload.orderId,
      sender_type:    payload.senderType || 'customer',
      sender_id:      payload.senderId,
      sender_name:    payload.senderName,
      message:        payload.message,
      attachment_url: payload.attachmentUrl || null,
      created_at:     new Date().toISOString(),
    };

    console.log(`[Socket] Message in ${roomName} from ${payload.senderName}: "${payload.message}"`);

    // Broadcast to everyone in the order room EXCEPT the sender
    socket.to(roomName).emit('receive_message', msgPacket);

    // Also acknowledge back to sender (so they know it was delivered to others)
    socket.emit('message_delivered', { id: msgPacket.id, orderId: payload.orderId });
  });

  // ── ORDER STATUS UPDATE ───────────────────────────────────────
  socket.on('update_order_status', (payload) => {
    const cleanId  = String(payload.orderId || '').replace(/[^0-9]/g, '');
    const roomName = `order_${cleanId}`;

    io.to(roomName).emit('order_status_updated', {
      orderId:  payload.orderId,
      status:   payload.status,
      reason:   payload.reason || null,
      updatedBy: payload.updatedBy || 'Seller',
    });

    console.log(`[Socket] Order ${payload.orderId} status → ${payload.status}`);
  });

  // ── ORDER PLACED ──────────────────────────────────────────────
  socket.on('order_placed', (payload) => {
    // Notify all sellers
    for (const [sid, userData] of connectedUsers.entries()) {
      if (userData.role === 'seller' || userData.role === 'admin') {
        io.to(sid).emit('new_notification', {
          type:    'new_order',
          title:   'New Order Received! 📦',
          message: `Order #${payload.orderId} placed by ${payload.customerName} — Rs. ${payload.total}`,
          orderId: payload.orderId,
        });
      }
    }

    // Notify the customer who placed it
    socket.emit('order_placed_success', { orderId: payload.orderId });
    console.log(`[Socket] Order placed: #${payload.orderId} by ${payload.customerName}`);
  });

  // ── SEND NOTIFICATION ─────────────────────────────────────────
  socket.on('send_notification', (data) => {
    if (data.targetSocketId) {
      io.to(data.targetSocketId).emit('new_notification', data);
    } else if (data.targetUserId) {
      // Find the socket for this userId
      for (const [sid, userData] of connectedUsers.entries()) {
        if (String(userData.userId) === String(data.targetUserId)) {
          io.to(sid).emit('new_notification', data);
          break;
        }
      }
    } else {
      // Broadcast to all
      io.emit('new_notification', data);
    }
  });

  // ── DISCONNECT ────────────────────────────────────────────────
  socket.on('disconnect', () => {
    connectedUsers.delete(socket.id);
    // Clean up order rooms
    for (const [room, members] of orderRooms.entries()) {
      members.delete(socket.id);
    }
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`\n🚀 Socket.IO server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/\n`);
});

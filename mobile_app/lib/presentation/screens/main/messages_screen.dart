import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ecomapp/core/theme/app_theme.dart';
import 'package:ecomapp/core/network/api_client.dart';
import 'package:ecomapp/core/network/api_endpoints.dart';
import 'package:ecomapp/data/models/order_model.dart';
import 'package:ecomapp/presentation/controllers/order_controller.dart';
import 'package:ecomapp/presentation/screens/chat/chat_screen.dart';

class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  late final OrderController _orderController;
  // Map orderId -> last message snippet
  final Map<String, _ChatPreview> _previews = {};
  bool _loadingPreviews = true;

  @override
  void initState() {
    super.initState();
    _orderController = Get.find<OrderController>();
    _fetchPreviews();
  }

  Future<void> _fetchPreviews() async {
    if (!mounted) return;
    setState(() => _loadingPreviews = true);
    
    // Ensure orders are loaded if they haven't been already
    if (_orderController.orders.isEmpty) {
      await _orderController.fetchOrders();
    }

    final apiClient = Get.find<ApiClient>();
    final orders = List<OrderModel>.from(_orderController.orders);
    final Map<String, _ChatPreview> previews = {};

    if (orders.isNotEmpty) {
      await Future.wait(orders.map((order) async {
        try {
          final response = await apiClient.getData(
            ApiEndpoints.chat,
            query: {'order_id': order.id},
          );
          final data = response.data;
          if (data != null && data['status'] == 'success') {
            final List msgs = data['messages'] ?? [];
            if (msgs.isNotEmpty) {
              final last = msgs.last;
              previews[order.id] = _ChatPreview(
                message: last['message']?.toString() ?? '',
                time: last['created_at']?.toString() ?? '',
                senderType: last['sender_type']?.toString() ?? '',
              );
            }
          }
        } catch (_) {}
      }));
    }

    if (mounted) {
      setState(() {
        _previews.clear();
        _previews.addAll(previews);
        _loadingPreviews = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: const BoxDecoration(
              color: Color(0xFFF0F2F5),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.arrow_back, size: 20, color: Colors.black),
          ),
          onPressed: () => Get.back(),
        ),
        title: const Text(
          'Messages',
          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            onPressed: _fetchPreviews,
            icon: const Icon(Icons.refresh_rounded, color: Colors.black87),
          ),
        ],
      ),
      body: Obx(() {
        final orders = _orderController.orders;

        if (_orderController.isLoading && orders.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }

        // Filter orders that have chat messages
        final chatOrders = orders
            .where((o) => _previews.containsKey(o.id))
            .toList();

        if (_loadingPreviews) {
          return const Center(child: CircularProgressIndicator());
        }

        if (chatOrders.isEmpty) {
          return _buildEmptyState();
        }

        return RefreshIndicator(
          onRefresh: _fetchPreviews,
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: chatOrders.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              return _buildChatTile(chatOrders[index]);
            },
          ),
        );
      }),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showOrderSelectionBottomSheet,
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.chat_outlined, color: Colors.white),
        label: const Text('Start New Chat', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }

  void _showOrderSelectionBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.75,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(30),
            topRight: Radius.circular(30),
          ),
        ),
        child: Column(
          children: [
            const SizedBox(height: 12),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Select an Order to Message',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1A1C1E),
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: Obx(() {
                final orders = _orderController.orders;
                if (orders.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.inventory_2_outlined, size: 48, color: Colors.grey.shade300),
                        const SizedBox(height: 16),
                        const Text('No orders found to start a chat.'),
                      ],
                    ),
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  itemCount: orders.length,
                  physics: const BouncingScrollPhysics(),
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final order = orders[index];
                    final productName = order.products.isNotEmpty
                        ? order.products[0].name
                        : 'Order #${order.id}';
                    final productImage = order.products.isNotEmpty
                        ? order.products[0].mainImage
                        : null;
                    
                    return GestureDetector(
                      onTap: () async {
                        Navigator.pop(context);
                        await Get.to(() => ChatScreen(
                          orderId: order.id,
                          senderType: 'customer',
                          orderModel: order,
                        ));
                        _fetchPreviews();
                      },
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8F9FA),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 50,
                              height: 50,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(10),
                                image: productImage != null
                                    ? DecorationImage(
                                        image: NetworkImage(productImage),
                                        fit: BoxFit.cover,
                                      )
                                    : null,
                              ),
                              child: productImage == null
                                  ? const Icon(Icons.shopping_bag_outlined, color: Colors.grey)
                                  : null,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    productName,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                  Text(
                                    'Order #${order.id}',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey.shade600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const Icon(Icons.chat_bubble_outline_rounded, size: 20, color: AppColors.primary),
                          ],
                        ),
                      ),
                    );
                  },
                );
              }),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.08),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.chat_bubble_outline_rounded,
              size: 50,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'No conversations yet',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1A1C1E),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Start chatting with a seller from\nyour order details page.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.grey.shade500,
              fontSize: 14,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 28),
          ElevatedButton.icon(
            onPressed: _showOrderSelectionBottomSheet,
            icon: const Icon(Icons.chat_outlined, size: 18),
            label: const Text('New Message'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(25),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChatTile(OrderModel order) {
    final preview = _previews[order.id]!;
    final productName = order.products.isNotEmpty
        ? order.products[0].name
        : 'Order #${order.id}';
    final productImage = order.products.isNotEmpty
        ? order.products[0].mainImage
        : null;
    final isLastFromSeller = preview.senderType == 'seller';
    final formattedTime = _formatTime(preview.time);

    return GestureDetector(
      onTap: () async {
        await Get.to(() => ChatScreen(
              orderId: order.id,
              senderType: 'customer',
              orderModel: order,
            ));
        _fetchPreviews();
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            // Avatar
            Stack(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF0F2F5),
                    borderRadius: BorderRadius.circular(16),
                    image: productImage != null
                        ? DecorationImage(
                            image: NetworkImage(productImage),
                            fit: BoxFit.cover,
                          )
                        : null,
                  ),
                  child: productImage == null
                      ? const Icon(Icons.storefront_rounded, color: Colors.grey, size: 28)
                      : null,
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    width: 14,
                    height: 14,
                    decoration: BoxDecoration(
                      color: Colors.green,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 14),
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              productName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                                color: Color(0xFF1A1C1E),
                              ),
                            ),
                            const Text(
                              'SwiftShop Seller',
                              style: TextStyle(
                                fontWeight: FontWeight.w900,
                                fontSize: 13,
                                color: AppColors.primary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        formattedTime,
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.grey.shade500,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      if (isLastFromSeller)
                        const Icon(Icons.storefront_rounded, size: 12, color: AppColors.primary)
                      else
                        const Icon(Icons.person_rounded, size: 12, color: Colors.grey),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          preview.message.isEmpty ? 'Attachment' : preview.message,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(Icons.chevron_right_rounded, color: Color(0xFFCCD0D4), size: 20),
          ],
        ),
      ),
    );
  }

  String _formatTime(String dateStr) {
    if (dateStr.isEmpty) return '';
    try {
      final dt = DateTime.parse(dateStr);
      final now = DateTime.now();
      final diff = now.difference(dt);
      if (diff.inDays == 0) {
        final h = dt.hour.toString().padLeft(2, '0');
        final m = dt.minute.toString().padLeft(2, '0');
        return '$h:$m';
      } else if (diff.inDays == 1) {
        return 'Yesterday';
      } else if (diff.inDays < 7) {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return days[dt.weekday - 1];
      } else {
        return '${dt.day}/${dt.month}';
      }
    } catch (_) {
      return '';
    }
  }
}

class _ChatPreview {
  final String message;
  final String time;
  final String senderType;
  const _ChatPreview({
    required this.message,
    required this.time,
    required this.senderType,
  });
}

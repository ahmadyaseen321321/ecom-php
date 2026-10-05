import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ecomapp/core/theme/app_theme.dart';
import 'package:ecomapp/presentation/controllers/seller_controller.dart';
import 'package:ecomapp/data/models/seller_order_model.dart';
import 'package:ecomapp/presentation/screens/chat/chat_screen.dart';
import 'package:ecomapp/core/network/api_endpoints.dart';
import 'package:ecomapp/presentation/screens/seller/process_order_screen.dart';

class SellerOrderListScreen extends StatelessWidget {
  final String status;

  const SellerOrderListScreen({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final SellerController controller = Get.find<SellerController>();
    
    // Fetch fresh data when entering the screen to ensure we have the latest payload
    WidgetsBinding.instance.addPostFrameCallback((_) {
      controller.fetchSellerOrders();
    });
    
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: Text(
          '$status Orders',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
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
      ),
      body: Obx(() {
        final orders = controller.sellerOrders.where((order) {
           String dbStatus = order.status.toUpperCase();
           String tabStatus = status.toUpperCase();
           
           if (tabStatus == 'IN PROGRESS' && (dbStatus == 'IN PROGRESS' || dbStatus == 'IN_PROGRESS' || dbStatus == 'CONFIRMED')) return true;
           if (tabStatus == 'PENDING' && (dbStatus == 'PENDING' || dbStatus == 'PROCESSING')) return true;
           if (tabStatus == 'SHIPPED' && dbStatus == 'SHIPPED') return true;
           if (tabStatus == 'DELIVERED' && dbStatus == 'DELIVERED') return true;
           if (tabStatus == 'RETURNS' && (dbStatus == 'RETURNED' || dbStatus == 'RETURNS')) return true;
           if (tabStatus == 'CANCELLED' && dbStatus == 'CANCELLED') return true;

           
           return dbStatus == tabStatus;
        }).toList();

        if (controller.isLoading && controller.sellerOrders.isEmpty) {
           return const Center(child: CircularProgressIndicator());
        }

        if (orders.isEmpty) {
          return RefreshIndicator(
            onRefresh: () async {
              await controller.fetchSellerOrders();
              await controller.fetchStats();
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: SizedBox(
                height: MediaQuery.of(context).size.height * 0.7,
                child: _buildEmptyState(),
              ),
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () async {
            await controller.fetchSellerOrders();
            await controller.fetchStats();
          },
          child: ListView.separated(
            padding: const EdgeInsets.all(24),
            itemCount: orders.length,
            separatorBuilder: (context, index) => const SizedBox(height: 16),
            itemBuilder: (context, index) {
              return _buildOrderCard(context, orders[index], controller);
            },
          ),
        );
      }),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.inbox_outlined, size: 80, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          Text(
            'No order in progress',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Orders with this status will appear here.',
            style: TextStyle(color: Colors.grey.shade500),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderCard(BuildContext context, SellerOrderModel order, SellerController controller) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: _getStatusBgColor(order.status),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  order.status.toUpperCase(),
                  style: TextStyle(
                    color: _getStatusTextColor(order.status),
                    fontWeight: FontWeight.bold,
                    fontSize: 10,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
              Text(
                'PKR ${order.total.toStringAsFixed(0)}',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                  color: Color(0xFF1A1C1E),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: const Color(0xFFF0F2F5),
                child: Text(
                  order.customerName.isNotEmpty ? order.customerName.substring(0, 1).toUpperCase() : 'C',
                  style: const TextStyle(
                    color: Colors.black54,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      order.customerName.isNotEmpty ? order.customerName : 'Unknown Customer',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    Text(
                      'Order #${order.id}',
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Divider(color: Colors.grey.shade100),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Order Date',
                    style: TextStyle(
                      color: Colors.grey.shade500,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _formatDate(order.date),
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    'Items',
                    style: TextStyle(
                      color: Colors.grey.shade500,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${order.itemCount} unit(s)',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),
          if (order.status.toUpperCase() == 'CANCELLED' && order.cancellationReason != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.05),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.red.withOpacity(0.1)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.info_outline, color: Colors.red, size: 16),
                      SizedBox(width: 8),
                      Text(
                        'Cancellation Reason',
                        style: TextStyle(
                          color: Colors.red,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    order.cancellationReason ?? 'No reason provided',
                    style: TextStyle(
                      color: Colors.red.shade700,
                      fontSize: 13,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],
          _buildActionButtons(context, order, controller),

        ],
      ),
    );
  }

  String _formatDate(String dateStr) {
    if (dateStr.isEmpty) return 'Unknown';
    try {
      final date = DateTime.parse(dateStr);
      final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return '${months[date.month - 1]} ${date.day}, ${date.year}';
    } catch (e) {
      return dateStr.split(' ')[0];
    }
  }

  Widget _buildActionButtons(BuildContext context, SellerOrderModel order, SellerController controller) {
    String primaryActionText = 'Details';
    Color primaryColor = AppColors.primary;
    bool showCancel = false;

    final s = order.status.toUpperCase();
    if (s == 'PENDING' || s == 'PROCESSING') {
      primaryActionText = 'Process Order';
      showCancel = true;
    } else if (s == 'CONFIRMED' || s == 'IN PROGRESS' || s == 'IN_PROGRESS') {
      primaryActionText = 'Ready to Ship';
    } else if (s == 'SHIPPED') {
      primaryActionText = 'Mark Delivered';
    } else if (s == 'RETURNED') {
      primaryActionText = 'Process Return';
      primaryColor = Colors.red.shade400;
    } else {
      primaryActionText = 'View Details';
    }

    bool isPendingManualPayment = (order.paymentMethod == 'Easypaisa' || order.paymentMethod == 'JazzCash') && order.paymentStatus == 'pending';

    return Column(
      children: [
        if (isPendingManualPayment) ...[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: Colors.orange.shade50,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.orange.shade200),
            ),
            child: const Row(
              children: [
                Icon(Icons.pending_actions, color: Colors.orange, size: 16),
                SizedBox(width: 8),
                Text('Payment Verification is Pending', style: TextStyle(color: Colors.orange, fontSize: 12, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                _showVerifyPaymentDialog(context, order, controller);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                elevation: 0,
              ),
              child: const Text('Verify Payment', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(height: 12),
        ],
        Row(
          children: [
            if (showCancel) ...[
              Expanded(
                flex: 1,
                child: OutlinedButton(
                  onPressed: () => _showSellerCancelDialog(context, order, controller),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(0, 45),
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                    side: BorderSide(color: Colors.red.shade300),
                    foregroundColor: Colors.red,
                  ),
                  child: const Text(
                    'Cancel',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                ),
              ),
              const SizedBox(width: 8),
            ],
            Expanded(
              flex: 1,
              child: OutlinedButton(
                onPressed: () => Get.to(() => ChatScreen(orderId: order.id, senderType: 'seller', orderModel: order.toOrderModel())),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(0, 45),
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  side: BorderSide(color: Colors.grey.shade300),
                ),
                child: const Text(
                  'Message',
                  style: TextStyle(
                    color: Colors.black87,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              flex: 1,
              child: ElevatedButton(
                onPressed: () {
                  if (s == 'PENDING' || s == 'PROCESSING') {
                    Get.to(() => ProcessOrderScreen(order: order));
                  } else if (s == 'CONFIRMED' || s == 'IN PROGRESS' || s == 'IN_PROGRESS') {
                     controller.updateOrderStatus(order.id, 'SHIPPED');
                  } else if (s == 'SHIPPED') {
                     controller.updateOrderStatus(order.id, 'DELIVERED');
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryColor,
                  minimumSize: const Size(0, 45),
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  elevation: 0,
                ),
                child: Text(
                  primaryActionText,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  void _showVerifyPaymentDialog(BuildContext context, SellerOrderModel order, SellerController controller) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Verify Payment', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Customer: ${order.customerName}', style: const TextStyle(fontSize: 16)),
            const SizedBox(height: 16),
            if (order.receiptUrl != null && order.receiptUrl!.isNotEmpty)
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(
                  order.receiptUrl!.startsWith('http') 
                    ? order.receiptUrl! 
                    : '${ApiEndpoints.baseUrl}${order.receiptUrl!}',
                  height: 200,
                  width: double.infinity,
                  fit: BoxFit.cover,
                ),
              )
            else
              Container(
                height: 100,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(12),
                ),
                alignment: Alignment.center,
                child: const Text('No receipt uploaded', style: TextStyle(color: Colors.grey)),
              ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () {
              controller.updateOrderStatus(order.id, order.status, verifyPayment: true, goBack: true);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Verify'),
          ),
        ],
      ),
    );
  }

  void _showSellerCancelDialog(BuildContext context, SellerOrderModel order, SellerController controller) {
    final TextEditingController reasonController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Cancel Order'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Why you cancel this order?', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            TextField(
              controller: reasonController,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'Enter reason for cancellation...',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.red),
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Back', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () {
              if (reasonController.text.trim().isEmpty) {
                Get.snackbar('Error', 'Please provide a reason', backgroundColor: Colors.red, colorText: Colors.white);
                return;
              }
              controller.updateOrderStatus(order.id, 'CANCELLED', reason: reasonController.text.trim(), goBack: true);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Confirm Cancel'),
          ),
        ],
      ),
    );
  }


  void _showInvoiceBottomSheet(BuildContext context, SellerOrderModel order, SellerController controller) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
          ),
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            top: 24,
            left: 24,
            right: 24,
          ),
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.8,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 50,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Order Invoice',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Order #${order.id} • ${_formatDate(order.date)}',
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 24),
              const Divider(),
              Expanded(
                child: ListView.separated(
                  itemCount: order.items.length,
                  separatorBuilder: (context, index) => const Divider(),
                  itemBuilder: (context, index) {
                    final item = order.items[index];
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: Container(
                        width: 50,
                        height: 50,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(8),
                          image: item.mainImage != null
                             ? DecorationImage(
                                 image: NetworkImage(item.mainImage!),
                                 fit: BoxFit.cover,
                               )
                             : null,
                        ),
                        child: item.mainImage == null 
                           ? const Icon(Icons.inventory_2_outlined, color: Colors.grey)
                           : null,
                      ),
                      title: Text(
                        item.productName,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      subtitle: Text('Qty: ${item.quantity}'),
                      trailing: Text(
                        'PKR ${item.price.toStringAsFixed(0)}',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    );
                  },
                ),
              ),
              const Divider(),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Total Amount',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    Text(
                      'PKR ${order.total.toStringAsFixed(0)}',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                         // Print action
                      },
                      icon: const Icon(Icons.print_outlined, size: 20),
                      label: const Text('Print'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                         Navigator.pop(context);
                         controller.updateOrderStatus(order.id, 'CONFIRMED');
                      },
                      icon: const Icon(Icons.inventory_2_outlined, size: 20),
                      label: const Text('Print and Pack'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }

  Color _getStatusBgColor(String status) {
    final s = status.toUpperCase();
    if (s == 'PENDING' || s == 'PROCESSING') return const Color(0xFFFFF3E0); // Orange Light
    if (s == 'CONFIRMED' || s == 'IN PROGRESS' || s == 'IN_PROGRESS') return const Color(0xFFE3F2FD); // Blue Light
    if (s == 'SHIPPED') return const Color(0xFFF3E5F5); // Purple Light
    if (s == 'DELIVERED') return const Color(0xFFE8F5E9); // Green Light
    if (s == 'RETURNS') return const Color(0xFFFFEBEE); // Red Light
    return const Color(0xFFF5F5F5);
  }

  Color _getStatusTextColor(String status) {
    final s = status.toUpperCase();
    if (s == 'PENDING' || s == 'PROCESSING') return Colors.orange.shade800;
    if (s == 'CONFIRMED' || s == 'IN PROGRESS' || s == 'IN_PROGRESS') return Colors.blue.shade800;
    if (s == 'SHIPPED') return Colors.purple.shade800;
    if (s == 'DELIVERED') return Colors.green.shade800;
    if (s == 'RETURNS') return Colors.red.shade800;
    return Colors.grey.shade800;
  }
}

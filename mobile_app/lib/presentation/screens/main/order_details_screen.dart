import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ecomapp/core/theme/app_theme.dart';
import 'package:ecomapp/data/models/order_model.dart';
import 'package:ecomapp/presentation/controllers/order_controller.dart';
import 'package:ecomapp/presentation/screens/chat/chat_screen.dart';


class OrderDetailsScreen extends StatelessWidget {
  final OrderModel order;
  const OrderDetailsScreen({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FB),
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
          'Order Details',
          style: TextStyle(
            color: Colors.black,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Card
            _buildStatusCard(),
            const SizedBox(height: 20),

            if (order.status.toUpperCase() == 'CANCELLED' && order.cancellationReason != null) ...[
              const Text(
                'Cancellation Reason',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.red),
              ),
              const SizedBox(height: 12),
              _buildInfoCard(
                children: [
                  Text(
                    order.cancellationReason ?? 'No reason provided',
                    style: const TextStyle(color: Colors.red, height: 1.5, fontWeight: FontWeight.w500),
                  ),
                ],
              ),
              const SizedBox(height: 24),
            ],


            // Order Header Information
            _buildSectionHeader('Order Information'),
            _buildInfoCard(
              children: [
                _buildInfoRow('Order ID', '#${order.id}'),
                _buildInfoRow('Placed on', order.date),
                _buildInfoRow('Payment Method', 'Cash on Delivery'),
              ],
            ),
            const SizedBox(height: 24),

            // Shipping Address & Customer
            _buildSectionHeader('Shipping Details'),
            _buildInfoCard(
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.location_on_rounded, color: AppColors.primary, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            order.customerName ?? 'No Name',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            order.customerPhone ?? '',
                            style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            order.shippingAddress ?? 'No address provided',
                            style: TextStyle(
                              color: Colors.grey.shade700,
                              height: 1.4,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Product Details
            _buildSectionHeader('Product Details'),
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: order.products.length,
              itemBuilder: (context, index) {
                final product = order.products[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _buildProductItem(product),
                );
              },
            ),
            const SizedBox(height: 24),

            // Order Summary
            _buildSectionHeader('Order Summary'),
            _buildInfoCard(
              children: [
                _buildInfoRow('Subtotal', 'PKR ${order.total.toStringAsFixed(0)}'),
                _buildInfoRow('Shipping Fee', 'Free', isGreen: true),
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 8.0),
                  child: Divider(height: 1),
                ),
                _buildInfoRow('Total Amount', 'PKR ${order.total.toStringAsFixed(0)}', isBold: true, larger: true),
              ],
            ),
            const SizedBox(height: 32),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => Get.to(() => ChatScreen(orderId: order.id, senderType: 'customer', orderModel: order)),
                icon: const Icon(Icons.chat_bubble_outline, size: 20, color: AppColors.primary),
                label: const Text('Contact Seller', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary.withOpacity(0.1),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
              ),
            ),
            const SizedBox(height: 16),

            if ((order.status.toUpperCase() == 'DELIVERED' || order.status.toUpperCase() == 'COMPLETED') && !order.isReturnExpired)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => _showReturnDialog(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.orange,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 0,
                  ),
                  child: const Text('Request Return', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 12),
      child: Text(
        title,
        style: TextStyle(
          fontWeight: FontWeight.bold, 
          fontSize: 16, 
          color: color ?? const Color(0xFF1A1C2E),
        ),
      ),
    );
  }

  void _showReturnDialog(BuildContext context) {
    final TextEditingController reasonCtrl = TextEditingController();
    final controller = Get.find<OrderController>();
    
    Get.defaultDialog(
      title: 'Request Return',
      content: Column(
        children: [
          const Text('Why are you returning these items?', style: TextStyle(fontSize: 14)),
          const SizedBox(height: 12),
          TextField(
            controller: reasonCtrl,
            maxLines: 3,
            decoration: InputDecoration(
              hintText: 'Enter reason for return...',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
      textConfirm: 'Request',
      textCancel: 'Back',
      confirmTextColor: Colors.white,
      buttonColor: Colors.orange,
      onConfirm: () async {
        if (reasonCtrl.text.trim().isEmpty) {
          Get.snackbar('Alert', 'Please enter a reason');
          return;
        }
        Get.back(); // close dialog
        await controller.requestReturn(order.id, reasonCtrl.text.trim());
      },
    );
  }

  Widget _buildStatusCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: _getStatusColor(order.status).withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              _getStatusIcon(order.status),
              color: _getStatusColor(order.status),
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Order Status',
                style: TextStyle(color: AppColors.textLight, fontSize: 12),
              ),
              Text(
                order.status.toUpperCase(),
                style: TextStyle(
                  color: _getStatusColor(order.status),
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildProductItem(dynamic product) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              Container(
                width: 70,
                height: 70,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  image: product.mainImage != null
                      ? DecorationImage(
                          image: NetworkImage(product.mainImage!),
                          fit: BoxFit.cover,
                        )
                      : null,
                  color: const Color(0xFFF8F8F8),
                ),
                child: product.mainImage == null
                    ? const Icon(Icons.image, color: Colors.grey)
                    : null,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'PKR ${product.price.toStringAsFixed(0)}',
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              const Text(
                'x 1',
                style: TextStyle(color: AppColors.textLight, fontSize: 12),
              ),
            ],
          ),
        ),
        if ((order.status.toUpperCase() == 'DELIVERED' || order.status.toUpperCase() == 'COMPLETED') && product.userReviewComment != null) ...[
          Container(
            width: double.infinity,
            margin: const EdgeInsets.only(top: 8, bottom: 16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFF0F2F5)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Row(
                      children: List.generate(5, (index) {
                        return Icon(
                          index < (product.userReviewRating ?? 0) ? Icons.star : Icons.star_border,
                          color: Colors.amber,
                          size: 16,
                        );
                      }),
                    ),
                    const SizedBox(width: 8),
                    const Text('Your Review', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  product.userReviewComment!,
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                ),
                if (product.sellerReply != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F8E9),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.storefront, size: 14, color: Colors.green.shade700),
                            const SizedBox(width: 6),
                            Text(
                              'Seller\'s Response',
                              style: TextStyle(
                                color: Colors.green.shade700,
                                fontWeight: FontWeight.bold,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          product.sellerReply!,
                          style: TextStyle(color: Colors.grey.shade800, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ] else ...[
          const SizedBox(height: 12),
        ],
      ],
    );
  }

  Widget _buildInfoCard({required List<Widget> children}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, {bool isBold = false, bool isGreen = false, bool larger = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textLight, fontSize: 13)),
          Text(
            value,
            style: TextStyle(
              fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
              fontSize: larger ? 16 : 13,
              color: isGreen ? Colors.green : (isBold ? Colors.black : AppColors.textSecondary),
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
      case 'COMPLETED':
        return Colors.green;
      case 'IN TRANSIT':
      case 'SHIPPED':
        return Colors.blue;
      case 'PROCESSING':
      case 'CONFIRMED':
        return Colors.orange;
      case 'CANCELLED':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
      case 'COMPLETED':
        return Icons.check_circle_outline;
      case 'IN TRANSIT':
      case 'SHIPPED':
        return Icons.local_shipping_outlined;
      case 'PROCESSING':
      case 'CONFIRMED':
        return Icons.pending_actions_outlined;
      case 'CANCELLED':
        return Icons.cancel_outlined;
      default:
        return Icons.help_outline;
    }
  }
}

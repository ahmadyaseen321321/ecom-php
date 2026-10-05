import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ecomapp/core/theme/app_theme.dart';
import 'package:ecomapp/presentation/controllers/order_controller.dart';
import 'package:ecomapp/presentation/controllers/review_controller.dart';
import 'package:ecomapp/data/models/order_model.dart';
import 'package:ecomapp/presentation/widgets/app_drawer.dart';
import 'package:ecomapp/presentation/widgets/write_review_bottom_sheet.dart';
import 'package:ecomapp/core/network/api_client.dart';
import 'package:ecomapp/presentation/screens/main/order_details_screen.dart';
import 'package:ecomapp/presentation/screens/chat/chat_screen.dart';

class OrderHistoryScreen extends StatelessWidget {
  const OrderHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final OrderController controller = Get.find<OrderController>();
    // Ensure ReviewController is available
    if (!Get.isRegistered<ReviewController>()) {
      Get.put(ReviewController(apiClient: Get.find<ApiClient>()));
    }
    final scaffoldKey = GlobalKey<ScaffoldState>();
    final bool canGoBack = Navigator.canPop(context);

    return Scaffold(
      key: canGoBack ? null : scaffoldKey,
      drawer: canGoBack ? null : const AppDrawer(),
      appBar: canGoBack
          ? AppBar(
              leading: IconButton(
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: const BoxDecoration(
                    color: Color(0xFFF0F2F5),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.arrow_back, size: 20),
                ),
                onPressed: () => Get.back(),
              ),
              title: const Text(
                'Order History',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            )
          : shopAppBar(scaffoldKey),
      body: Column(
        children: [
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Container(
              height: 50,
              decoration: BoxDecoration(
                color: const Color(0xFFF0F2F5),
                borderRadius: BorderRadius.circular(25),
              ),
              child: const TextField(
                decoration: InputDecoration(
                  hintText: 'Search by Order ID or item name',
                  prefixIcon: Icon(Icons.search, color: AppColors.textLight),
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),

          Obx(
            () => Container(
              height: 45,
              margin: const EdgeInsets.only(left: 16, right: 8),
              child: Row(
                children: [
                  Expanded(
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      physics: const BouncingScrollPhysics(),
                      children: [
                        _buildTabItem('Processing', 0, controller),
                        const SizedBox(width: 12),
                        _buildTabItem('Shipped', 1, controller),
                        const SizedBox(width: 12),
                        _buildTabItem('Delivered', 2, controller),
                        const SizedBox(width: 12),
                        _buildTabItem('Cancelled', 3, controller),
                        const SizedBox(width: 12),
                        _buildTabItem('All Orders', 4, controller),
                      ],
                    ),
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 8),
                    child: Icon(
                      Icons.arrow_forward_ios,
                      size: 12,
                      color: AppColors.textLight,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),

          Expanded(
            child: Obx(() {
              if (controller.isLoading && controller.orders.isEmpty) {
                return const Center(child: CircularProgressIndicator());
              }
              if (controller.filteredOrders.isEmpty) {
                return RefreshIndicator(
                  onRefresh: () => controller.fetchOrders(),
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: SizedBox(
                      height: MediaQuery.of(context).size.height * 0.6,
                      child: const Center(
                        child: Text(
                          'No order in progress',
                          style: TextStyle(
                            fontSize: 16,
                            color: AppColors.textLight,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }
              return RefreshIndicator(
                onRefresh: () => controller.fetchOrders(),
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  physics: const AlwaysScrollableScrollPhysics(),
                  itemCount: controller.filteredOrders.length,
                  separatorBuilder: (context, index) =>
                      const SizedBox(height: 20),
                  itemBuilder: (context, index) {
                    final order = controller.filteredOrders[index];
                    return _buildOrderCard(context, order, controller);
                  },
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildTabItem(String label, int index, OrderController controller) {
    final isSelected = controller.currentTab.value == index;
    return GestureDetector(
      onTap: () => controller.filterByTab(index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        padding: const EdgeInsets.symmetric(horizontal: 20),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(25),
          border: Border.all(
            color: isSelected ? AppColors.primary : const Color(0xFFEEEEEE),
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : AppColors.textLight,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  Widget _buildOrderCard(
    BuildContext context,
    OrderModel order,
    OrderController controller,
  ) {
    return GestureDetector(
      onTap: () => Get.to(() => OrderDetailsScreen(order: order)),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFFF0F2F5)),
        ),

        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: _getStatusColor(order.status).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(15),
                    border: Border.all(
                      color: _getStatusColor(order.status).withOpacity(0.3),
                    ),
                  ),
                  child: Text(
                    order.status.toUpperCase(),
                    style: TextStyle(
                      color: _getStatusColor(order.status),
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
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'Order #${order.id}',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            Text(
              '${order.date} • ${order.products.length} Items',
              style: TextStyle(color: AppColors.textLight, fontSize: 12),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                ...order.products
                    .take(3)
                    .map(
                      (p) => Container(
                        width: 50,
                        height: 50,
                        margin: const EdgeInsets.only(right: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8F8F8),
                          borderRadius: BorderRadius.circular(10),
                          image: p.mainImage != null
                              ? DecorationImage(
                                  image: NetworkImage(p.mainImage!),
                                  fit: BoxFit.cover,
                                )
                              : null,
                        ),
                        child: p.mainImage == null
                            ? const Icon(
                                Icons.image,
                                color: Colors.grey,
                                size: 20,
                              )
                            : null,
                      ),
                    ),
                if (order.products.length > 3)
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: const Color(0xFFEEEEEE),
                        style: BorderStyle.solid,
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Center(
                      child: Text(
                        '+${order.products.length - 3}',
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 16),

            // Reviews Section (if any)
            if ((order.status.toUpperCase() == 'DELIVERED' ||
                    order.status.toUpperCase() == 'COMPLETED') &&
                order.products.any((p) => p.userReviewComment != null)) ...[
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: order.products
                    .where((p) => p.userReviewComment != null)
                    .map((p) {
                      return Container(
                        width: double.infinity,
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAF8),
                          borderRadius: BorderRadius.circular(15),
                          border: Border.all(color: const Color(0xFFE8F5E9)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: List.generate(5, (index) {
                                    return Icon(
                                      index < (p.userReviewRating ?? 0)
                                          ? Icons.star
                                          : Icons.star_border,
                                      color: Colors.amber,
                                      size: 14,
                                    );
                                  }),
                                ),
                                Text(
                                  p.name,
                                  style: const TextStyle(
                                    fontSize: 10,
                                    color: AppColors.textLight,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              p.userReviewComment!,
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            if (p.sellerReply != null) ...[
                              const SizedBox(height: 8),
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Icon(
                                          Icons.storefront,
                                          size: 12,
                                          color: Colors.green.shade700,
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          'Seller Reply',
                                          style: TextStyle(
                                            color: Colors.green.shade700,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 10,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      p.sellerReply!,
                                      style: const TextStyle(
                                        fontSize: 11,
                                        color: Colors.black87,
                                      ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      );
                    })
                    .toList(),
              ),
              const SizedBox(height: 8),
            ],

            if (order.status == 'IN TRANSIT') ...[
              Row(
                children: [
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8F8F8),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.headset, color: Colors.grey),
                  ),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Expected delivery',
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 12,
                        ),
                      ),
                      Text(
                        order.deliveryDate ?? '',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () =>
                          Get.to(() => OrderDetailsScreen(order: order)),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(0, 50),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(25),
                        ),
                        side: const BorderSide(color: Color(0xFFEEEEEE)),
                      ),
                      child: const Text(
                        'Details',
                        style: TextStyle(
                          color: Colors.black,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {},
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryLight,
                        minimumSize: const Size(0, 50),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(25),
                        ),
                      ),
                      child: const Text(
                        'Track Package',
                        style: TextStyle(color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
            ] else if (order.status == 'PROCESSING' ||
                       ((order.paymentMethod == 'JazzCash' || order.paymentMethod == 'Easypaisa') && 
                        order.paymentStatus == 'pending')) ...[
              Row(
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8F8F8),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.checkroom, color: Colors.grey),
                  ),
                  const SizedBox(width: 16),
                  const Text(
                    'Payment is under processing...',
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () =>
                          Get.to(() => OrderDetailsScreen(order: order)),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(0, 50),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(25),
                        ),
                        side: const BorderSide(color: Color(0xFFEEEEEE)),
                      ),
                      child: const Text(
                        'Details',
                        style: TextStyle(
                          color: Colors.black,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () =>
                          _showCancelDialog(context, order, controller),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(0, 50),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(25),
                        ),
                        side: const BorderSide(color: Color(0xFFEEEEEE)),
                      ),
                      child: const Text(
                        'Cancel Order',
                        style: TextStyle(
                          color: Colors.red,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ] else if (order.status.toUpperCase() == 'PENDING') ...[
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () =>
                          Get.to(() => OrderDetailsScreen(order: order)),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(0, 50),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(25),
                        ),
                        side: const BorderSide(color: Color(0xFFEEEEEE)),
                      ),
                      child: const Text(
                        'Details',
                        style: TextStyle(
                          color: Colors.black,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () =>
                          _showCancelDialog(context, order, controller),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(0, 50),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(25),
                        ),
                        side: const BorderSide(color: Color(0xFFEEEEEE)),
                      ),
                      child: const Text(
                        'Cancel Order',
                        style: TextStyle(
                          color: Colors.red,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ] else ...[
              Row(
                children: [
                  if ((order.status.toUpperCase() == 'DELIVERED' ||
                          order.status.toUpperCase() == 'COMPLETED') &&
                      order.products.any((p) => p.userReviewComment == null))
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {
                          final unreviewedProduct = order.products
                              .firstWhereOrNull(
                                (p) => p.userReviewComment == null,
                              );
                          if (unreviewedProduct != null) {
                            Get.bottomSheet(
                              WriteReviewBottomSheet(
                                product: unreviewedProduct,
                              ),
                              isScrollControlled: true,
                            );
                          }
                        },
                        style: OutlinedButton.styleFrom(
                          backgroundColor: const Color(0xFFF8FAF8),
                          minimumSize: const Size(0, 50),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(25),
                          ),
                          side: BorderSide.none,
                        ),
                        child: const Text(
                          'Write Review',
                          style: TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  if (order.status.toUpperCase() != 'DELIVERED' &&
                      order.status.toUpperCase() != 'COMPLETED')
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {
                          Get.to(
                            () => ChatScreen(
                              orderId: order.id,
                              senderType: 'customer',
                              orderModel: order,
                            ),
                          );
                        },
                        style: OutlinedButton.styleFrom(
                          backgroundColor: const Color(0xFFF8FAF8),
                          minimumSize: const Size(0, 50),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(25),
                          ),
                          side: BorderSide.none,
                        ),
                        child: const Text(
                          'Contact Seller',
                          style: TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  if ((order.status.toUpperCase() == 'DELIVERED' ||
                          order.status.toUpperCase() == 'COMPLETED') &&
                      !order.isReturnExpired) ...[
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () =>
                            _showReturnDialog(context, order, controller),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size(0, 50),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(25),
                          ),
                          side: const BorderSide(color: Color(0xFFEEEEEE)),
                        ),
                        child: const Text(
                          'Request Return',
                          style: TextStyle(
                            color: Colors.orange,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () =>
                          Get.to(() => OrderDetailsScreen(order: order)),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(0, 50),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(25),
                        ),
                        side: const BorderSide(color: Color(0xFFEEEEEE)),
                      ),
                      child: const Text(
                        'Details',
                        style: TextStyle(
                          color: Colors.black,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return Colors.green;
      case 'IN TRANSIT':
        return Colors.blue;
      case 'PROCESSING':
        return Colors.orange;
      case 'PENDING':
        return Colors.amber;
      case 'CANCELLED':
        return Colors.red;
      case 'RETURN REQUESTED':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  void _showCancelDialog(
    BuildContext context,
    OrderModel order,
    OrderController controller,
  ) {
    final TextEditingController reasonCtrl = TextEditingController();
    Get.defaultDialog(
      title: 'Cancel Order',
      content: Column(
        children: [
          const Text(
            'Why are you cancelling this order?',
            style: TextStyle(fontSize: 14),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: reasonCtrl,
            maxLines: 3,
            decoration: InputDecoration(
              hintText: 'Enter reason...',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
      textConfirm: 'Confirm',
      textCancel: 'Back',
      confirmTextColor: Colors.white,
      buttonColor: AppColors.primary,
      onConfirm: () async {
        if (reasonCtrl.text.trim().isEmpty) {
          Get.snackbar('Alert', 'Please enter a reason');
          return;
        }
        Get.back(); // close dialog
        await controller.cancelOrder(order.id, reasonCtrl.text.trim());
      },
    );
  }

  void _showReturnDialog(
    BuildContext context,
    OrderModel order,
    OrderController controller,
  ) {
    final TextEditingController reasonCtrl = TextEditingController();
    Get.defaultDialog(
      title: 'Request Return',
      content: Column(
        children: [
          const Text(
            'Why are you returning these items?',
            style: TextStyle(fontSize: 14),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: reasonCtrl,
            maxLines: 3,
            decoration: InputDecoration(
              hintText: 'Enter reason for return...',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
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
}

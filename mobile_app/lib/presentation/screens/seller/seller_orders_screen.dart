import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ecomapp/presentation/screens/seller/seller_order_list_screen.dart';
import 'package:ecomapp/presentation/controllers/seller_controller.dart';

class SellerOrdersScreen extends StatelessWidget {
  final bool isStandalone;
  const SellerOrdersScreen({super.key, this.isStandalone = false});

  @override
  Widget build(BuildContext context) {
    final SellerController controller = Get.find<SellerController>();

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            await controller.fetchStats(
              days: controller.selectedDashboardTimeframe.value,
            );
            await controller.fetchSellerOrders(
              days: controller.selectedDashboardTimeframe.value,
            );
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(24),
            child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(),
              const SizedBox(height: 32),
              const Text(
                'ADMINISTRATION',
                style: TextStyle(
                  color: Color(0xFF81C784),
                  letterSpacing: 1.2,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Order Overview',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1A1C1E),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                "Manage and track your boutique's\nfulfillment cycle in real-time.",
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontSize: 16,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 40),
              
              // Stats Grid
              Obx(() => GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 20,
                crossAxisSpacing: 20,
                childAspectRatio: 0.78,
                children: [
                  _buildOrderStatCard(
                    '${controller.stats.value?.pendingCount ?? 0}', 
                    'PENDING', 
                    Icons.assignment_turned_in_outlined, 
                    const Color(0xFFF1F8E9)
                  ),
                  _buildOrderStatCard(
                    '${controller.stats.value?.confirmedCount ?? 0}', 
                    'IN PROGRESS', 
                    Icons.precision_manufacturing_outlined, 
                    const Color(0xFFF1F8E9)
                  ),
                  _buildOrderStatCard(
                    '${controller.stats.value?.shippedCount ?? 0}', 
                    'SHIPPED', 
                    Icons.local_shipping_outlined, 
                    const Color(0xFFF1F8E9)
                  ),
                  _buildOrderStatCard(
                    '${controller.stats.value?.deliveredCount ?? 0}', 
                    'DELIVERED', 
                    Icons.check_circle_outline, 
                    const Color(0xFFF1F8E9)
                  ),
                ],
              )),
              
              Obx(() => _buildReturnsCard(controller.stats.value?.returnedCount ?? 0)),
              const SizedBox(height: 20),
              Obx(() => _buildCancelledCard(controller.stats.value?.cancelledCount ?? 0)),
            ],
          ),
        ),
      ),
    ),
  );
}


  Widget _buildHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        IconButton(
          onPressed: () => isStandalone ? Get.back() : null,
          icon: Icon(isStandalone ? Icons.arrow_back : Icons.menu, color: const Color(0xFF1A1C1E)),
        ),
        const Text(
          'Linen & Slate',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF1A1C1E)),
        ),
        const CircleAvatar(
          radius: 20,
          backgroundImage: NetworkImage('https://i.pravatar.cc/150?u=seller_orders'),
        ),
      ],
    );
  }

  Widget _buildOrderStatCard(String value, String label, IconData icon, Color iconBg) {
    return GestureDetector(
      onTap: () {
        String formattedLabel = label;
        if (label.toUpperCase() == 'PENDING') formattedLabel = 'Pending';
        if (label.toUpperCase() == 'IN PROGRESS') formattedLabel = 'In Progress';
        if (label.toUpperCase() == 'SHIPPED') formattedLabel = 'Shipped';
        if (label.toUpperCase() == 'DELIVERED') formattedLabel = 'Delivered';
        Get.to(() => SellerOrderListScreen(status: formattedLabel));
      },
      child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: FittedBox(
        fit: BoxFit.scaleDown,
        child: Padding(
          padding: const EdgeInsets.all(4.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: const Color(0xFF81C784), size: 24),
              ),
              const SizedBox(height: 12),
              Text(
                value,
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF1A1C1E)),
              ),
              const SizedBox(height: 2),
              Text(
                label,
                style: const TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5),
              ),
            ],
          ),
        ),
      ),
    ));
  }

  Widget _buildReturnsCard(int count) {
    return GestureDetector(
      onTap: () => Get.to(() => const SellerOrderListScreen(status: 'Returns')),
      child: Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFFEBEE),
              borderRadius: BorderRadius.circular(15),
            ),
            child: const Icon(Icons.assignment_return_outlined, color: Colors.red, size: 28),
          ),
          const SizedBox(width: 20),
          Text(
            '$count',
            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Color(0xFF1A1C1E)),
          ),
          const SizedBox(width: 12),
          const Text(
            'ITEMS RETURNED',
            style: TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    ));
  }

  Widget _buildCancelledCard(int count) {
    return GestureDetector(
      onTap: () => Get.to(() => const SellerOrderListScreen(status: 'Cancelled')),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(30),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
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
                color: const Color(0xFFFBE9E7),
                borderRadius: BorderRadius.circular(15),
              ),
              child: const Icon(Icons.cancel_outlined, color: Colors.deepOrange, size: 28),
            ),
            const SizedBox(width: 20),
            Text(
              '$count',
              style: const TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1A1C1E),
              ),
            ),
            const SizedBox(width: 12),
            const Text(
              'CANCELLED ORDERS',
              style: TextStyle(
                color: Colors.grey,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}


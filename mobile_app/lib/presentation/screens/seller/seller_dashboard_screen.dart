import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ecomapp/presentation/controllers/seller_controller.dart';
import 'package:ecomapp/presentation/controllers/notification_controller.dart';
import 'add_product_screen.dart';
import 'seller_total_sales_screen.dart';
import 'seller_profile_screen.dart';
import 'seller_orders_screen.dart';
import 'seller_product_list_screen.dart';
import 'seller_reviews_screen.dart';

class SellerDashboardScreen extends StatelessWidget {
  const SellerDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final SellerController controller = Get.put(
      SellerController(apiClient: Get.find()),
    );

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: SafeArea(
        child: Obx(() {
          if (controller.isLoading && controller.stats.value == null) {
            return const Center(child: CircularProgressIndicator());
          }

          return RefreshIndicator(
            onRefresh: () async {
              await controller.fetchStats(
                days: controller.selectedDashboardTimeframe.value,
              );
              await controller.fetchSellerOrders(
                days: controller.selectedDashboardTimeframe.value,
              );
              await controller.fetchSellerReviews();
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(20),
              child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(),
                const SizedBox(height: 24),

                // Stats Grid
                if (controller.stats.value != null)
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 16,
                    childAspectRatio: 1.25,
                    children: [
                      _buildStatCard(
                        'Total Sales',
                        'PKR ${controller.stats.value!.totalSales.toStringAsFixed(0)}',
                        Icons.payments_outlined,
                        const Color(0xFFE8F5E9),
                        const Color(0xFF4CAF50),
                        '${controller.stats.value!.salesPercentage >= 0 ? '+' : ''}${controller.stats.value!.salesPercentage}%',
                        onTap: () =>
                            Get.to(() => const SellerTotalSalesScreen()),
                      ),
                      _buildStatCard(
                        'Total Orders',
                        '${controller.stats.value!.pendingCount + controller.stats.value!.confirmedCount}',
                        Icons.local_shipping_outlined,
                        const Color(0xFFE3F2FD),
                        const Color(0xFF2196F3),
                        '${controller.stats.value!.ordersPercentage >= 0 ? '+' : ''}${controller.stats.value!.ordersPercentage}%',
                        onTap: () => Get.to(
                          () => const SellerOrdersScreen(isStandalone: true),
                        ),
                      ),
                      _buildStatCard(
                        'Total Products',
                        '${controller.stats.value!.productCount}',
                        Icons.inventory_2_outlined,
                        const Color(0xFFFFF3E0),
                        const Color(0xFFFF9800),
                        '+2%',
                        onTap: () => Get.to(
                          () =>
                              const SellerProductListScreen(isStandalone: true),
                        ),
                      ),
                      _buildStatCard(
                        'Customer Reviews',
                        '${controller.stats.value!.avgRating} Rating',
                        Icons.star_outline,
                        const Color(0xFFF3E5F5),
                        const Color(0xFF9C27B0),
                        '+0.2',
                        onTap: () => Get.to(
                          () => const SellerReviewsScreen(isStandalone: true),
                        ),
                      ),
                    ],
                  ),

                const SizedBox(height: 24),
                const Text(
                  'Quick Actions',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                _buildQuickActions(),

                const SizedBox(height: 24),
                _buildSalesAnalytics(),

                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Recent Orders',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    TextButton(onPressed: () {}, child: const Text('View All')),
                  ],
                ),
                _buildRecentOrders(),
              ],
            ),
          ),
        );
      }),
    ),
  );
}

  Widget _buildHeader() {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 5,
              ),
            ],
          ),
          child: const Icon(Icons.grid_view_rounded, color: Color(0xFF4CAF50)),
        ),
        const SizedBox(width: 12),
        const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'ShopStyle',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            Text(
              'Admin Dashboard',
              style: TextStyle(color: Colors.grey, fontSize: 13),
            ),
          ],
        ),
        const Spacer(),
        Obx(() {
          final notifController = Get.find<NotificationController>();
          final count = notifController.unreadCount.value;
          return Stack(
            children: [
              IconButton(
                onPressed: () => Get.toNamed('/notifications'),
                icon: const Icon(Icons.notifications_none_rounded, size: 28),
              ),
              if (count > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(3),
                    decoration: const BoxDecoration(
                      color: Color(0xFFE53935),
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                    child: Text(
                      count > 9 ? '9+' : '$count',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          );
        }),
        GestureDetector(
          onTap: () => Get.to(() => const SellerProfileScreen()),
          child: const CircleAvatar(
            radius: 20,
            backgroundImage: NetworkImage('https://i.pravatar.cc/150?u=seller'),
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    IconData icon,
    Color bgColor,
    Color iconColor,
    String percentage, {
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
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
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: bgColor,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: iconColor, size: 20),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F8E9),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    percentage,
                    style: const TextStyle(
                      color: Color(0xFF4CAF50),
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const Spacer(),
            Text(
              title,
              style: const TextStyle(color: Colors.grey, fontSize: 11),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
            FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Text(
                value,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSalesAnalytics() {
    final SellerController controller = Get.find<SellerController>();

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Sales Analytics',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              Obx(
                () => Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey.shade200),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<int>(
                      value: controller.selectedDashboardTimeframe.value,
                      icon: const Icon(Icons.keyboard_arrow_down, size: 16),
                      style: const TextStyle(fontSize: 12, color: Colors.black),
                      items: const [
                        DropdownMenuItem(value: 1, child: Text('Last 1 Day')),
                        DropdownMenuItem(value: 7, child: Text('Last 7 Days')),
                        DropdownMenuItem(
                          value: 30,
                          child: Text('Last 30 Days'),
                        ),
                        DropdownMenuItem(
                          value: 90,
                          child: Text('Last 90 Days'),
                        ),
                      ],
                      onChanged: (val) {
                        if (val != null) {
                          controller.selectedDashboardTimeframe.value = val;
                          controller.fetchStats(days: val);
                          controller.fetchSellerOrders(days: val);
                          controller.fetchSellerReviews();
                        }
                      },
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Obx(() {
            final stats = controller.stats.value;
            if (stats == null || stats.chartData.isEmpty) {
              return const SizedBox(
                height: 180,
                child: Center(
                  child: Text(
                    "No analytics data available",
                    style: TextStyle(color: Colors.grey),
                  ),
                ),
              );
            }

            final data = stats.chartData;
            final maxValue = (data
                    .map((e) => e.value)
                    .fold(0.0, (prev, curr) => curr > prev ? curr : prev)) * 1.2; // Add 20% padding top

            return Column(
              children: [
                SizedBox(
                  height: 150,
                  width: double.infinity,
                  child: CustomPaint(
                    painter: _SalesAreaChartPainter(data, maxValue),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: List.generate(data.length, (index) {
                    final point = data[index];
                    // Logic to space labels
                    bool showLabel = false;
                    if (data.length <= 8) {
                        showLabel = true;
                    } else if (data.length <= 31) {
                        showLabel = index % 5 == 0 || index == data.length - 1;
                    } else {
                        showLabel = index % 15 == 0 || index == data.length - 1;
                    }

                    if (!showLabel) return const SizedBox.shrink();

                    return Text(
                      point.label,
                      style: const TextStyle(color: Colors.grey, fontSize: 10),
                    );
                  }).whereType<Widget>().toList(),
                ),
              ],
            );
          }),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    final actions = [
      {
        'icon': Icons.add_box_outlined,
        'label': 'Add Product',
        'color': const Color(0xFF81C784),
      },
      {
        'icon': Icons.account_balance_wallet_outlined,
        'label': 'Income',
        'color': Colors.white,
      },
      {
        'icon': Icons.bar_chart_outlined,
        'label': 'Reports',
        'color': Colors.white,
      },
      {
        'icon': Icons.chat_bubble_outline_rounded,
        'label': 'Support',
        'color': Colors.white,
      },
    ];

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: actions.map((action) {
        final isSelected = action['label'] == 'Add Product';
        return Column(
          children: [
            GestureDetector(
              onTap: () {
                if (action['label'] == 'Add Product') {
                  Get.to(() => const AddProductScreen());
                }
              },
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFF81C784) : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 10,
                    ),
                  ],
                ),
                child: Icon(
                  action['icon'] as IconData,
                  color: isSelected ? Colors.white : Colors.grey,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              action['label'] as String,
              style: const TextStyle(fontSize: 12, color: Colors.black87),
            ),
          ],
        );
      }).toList(),
    );
  }

  Widget _buildRecentOrders() {
    final SellerController controller = Get.find<SellerController>();

    return Obx(() {
      final orders = controller.recentDeliveredOrders.take(4).toList();

      if (controller.isLoading && orders.isEmpty) {
        return const Center(
          child: Padding(
            padding: EdgeInsets.all(20),
            child: CircularProgressIndicator(),
          ),
        );
      }

      if (orders.isEmpty) {
        return const Center(
          child: Padding(
            padding: EdgeInsets.all(20),
            child: Text(
              "No recent orders",
              style: TextStyle(color: Colors.grey),
            ),
          ),
        );
      }

      return Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 10,
            ),
          ],
        ),
        child: ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: orders.length,
          separatorBuilder: (context, index) => const Divider(height: 1),
          itemBuilder: (context, index) {
            final order = orders[index];
            return ListTile(
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 20,
                vertical: 8,
              ),
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8F9FA),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.inventory_2_outlined,
                  color: Colors.grey,
                  size: 20,
                ),
              ),
              title: Text(
                'Order #${order.id}',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              subtitle: Text(
                order.customerName.isNotEmpty
                    ? order.customerName
                    : 'Processing',
                style: const TextStyle(color: Colors.grey, fontSize: 12),
              ),
              trailing: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'PKR ${order.total.toStringAsFixed(0)}',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: _getStatusColor(
                        order.status,
                      ).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      order.status.toUpperCase(),
                      style: TextStyle(
                        color: _getStatusColor(order.status),
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      );
    });
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Shipped':
        return const Color(0xFF2196F3);
      case 'Pending':
        return const Color(0xFFFF9800);
      case 'Delivered':
        return const Color(0xFF4CAF50);
      default:
        return Colors.grey;
    }
  }
}

class _SalesAreaChartPainter extends CustomPainter {
  final List<ChartDataPoint> data;
  final double maxValue;

  _SalesAreaChartPainter(this.data, this.maxValue);

  @override
  void paint(Canvas canvas, Size size) {
    if (data.isEmpty) return;

    final double width = size.width;
    final double height = size.height;
    final double stepX = width / (data.length - 1);

    // 1. Draw Grid Lines (Horizontal)
    final gridPaint = Paint()
      ..color = Colors.grey.withValues(alpha: 0.05)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;

    for (int i = 0; i <= 3; i++) {
        final double y = height * (i / 3);
        canvas.drawLine(Offset(0, y), Offset(width, y), gridPaint);
    }

    // 2. Calculate Points
    final points = data.asMap().entries.map((entry) {
        final i = entry.key;
        final val = entry.value.value;
        final x = i * stepX;
        final y = height - (maxValue > 0 ? (val / maxValue) * height : 0);
        return Offset(x, y);
    }).toList();

    if (points.length < 2) return;

    // 3. Create Bezier Paths
    final path = Path();
    final fillPath = Path();

    path.moveTo(points[0].dx, points[0].dy);
    fillPath.moveTo(0, height);
    fillPath.lineTo(points[0].dx, points[0].dy);

    for (int i = 0; i < points.length - 1; i++) {
        final p1 = points[i];
        final p2 = points[i + 1];
        final controlX1 = p1.dx + (p2.dx - p1.dx) / 3;
        final controlX2 = p1.dx + 2 * (p2.dx - p1.dx) / 3;
        
        path.cubicTo(controlX1, p1.dy, controlX2, p2.dy, p2.dx, p2.dy);
        fillPath.cubicTo(controlX1, p1.dy, controlX2, p2.dy, p2.dx, p2.dy);
    }

    fillPath.lineTo(width, height);
    fillPath.close();

    // 4. Draw Fill (Gradient)
    final fillPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          const Color(0xFF4CAF50).withValues(alpha: 0.25),
          const Color(0xFF4CAF50).withValues(alpha: 0.0),
        ],
      ).createShader(Rect.fromLTWH(0, 0, width, height));
    
    canvas.drawPath(fillPath, fillPaint);

    // 5. Draw Line
    final linePaint = Paint()
      ..color = const Color(0xFF4CAF50)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    canvas.drawPath(path, linePaint);

    // 6. Highlight Points (only for short ranges for clarity)
    if (data.length <= 10) {
        final pointPaint = Paint()..color = const Color(0xFF4CAF50);
        final bgPointPaint = Paint()..color = Colors.white;
        for (var p in points) {
            canvas.drawCircle(p, 5, pointPaint);
            canvas.drawCircle(p, 3, bgPointPaint);
        }
    }
  }

  @override
  bool shouldRepaint(covariant _SalesAreaChartPainter oldDelegate) {
    return oldDelegate.data != data || oldDelegate.maxValue != maxValue;
  }
}

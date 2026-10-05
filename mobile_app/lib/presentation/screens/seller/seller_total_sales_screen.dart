import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:ecomapp/presentation/controllers/seller_controller.dart';
import 'package:intl/intl.dart';
import 'package:ecomapp/data/models/seller_order_model.dart';

class SellerTotalSalesScreen extends StatefulWidget {
  const SellerTotalSalesScreen({super.key});

  @override
  State<SellerTotalSalesScreen> createState() => _SellerTotalSalesScreenState();
}

class _SellerTotalSalesScreenState extends State<SellerTotalSalesScreen> {
  final SellerController controller = Get.find<SellerController>();

  @override
  void initState() {
    super.initState();
    // Fetch initial data for default 30 days
    _refreshData(30);
  }

  void _refreshData(int days) {
    controller.fetchStats(days: days);
    controller.fetchSellerOrders(status: 'delivered', days: days);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Column(
          children: [
            Text('ShopStyle', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black, fontSize: 18)),
            Text('ADMIN', style: TextStyle(color: Colors.grey, fontSize: 10, letterSpacing: 1.2)),
          ],
        ),
        centerTitle: true,
        backgroundColor: const Color(0xFFF8F9FA),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.blueGrey, size: 20),
          onPressed: () => Get.back(),
        ),
      ),
      body: Obx(() {
        if (controller.isLoading && controller.stats.value == null) {
          return const Center(child: CircularProgressIndicator());
        }

        final stats = controller.stats.value;
        final orders = controller.analyticsOrders;
        final totalRevenue = orders.fold(0.0, (sum, order) => sum + order.total);
        final orderCount = orders.length;

        return RefreshIndicator(
          onRefresh: () async => _refreshData(controller.selectedSalesTimeframe.value),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('ANALYTICS OVERVIEW', style: TextStyle(color: Color(0xFF4CAF50), fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                const SizedBox(height: 4),
                const Text('Total Sales', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                
                // Timeframe Filters
                SingleChildScrollView(
                   scrollDirection: Axis.horizontal,
                   child: Row(
                    children: [
                      _buildTimeframeButton(1, '1 Day'),
                      const SizedBox(width: 8),
                      _buildTimeframeButton(7, '7 Days'),
                      const SizedBox(width: 8),
                      _buildTimeframeButton(30, '30 Days'),
                      const SizedBox(width: 8),
                      _buildTimeframeButton(90, '90 Days'),
                    ],
                  ),
                ),
                
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () => controller.exportToCSV(),
                    icon: const Icon(Icons.file_upload_outlined, size: 18),
                    label: const Text('Export CSV Report'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF4CAF50),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
                
                const SizedBox(height: 24),
                if (stats != null) ...[
                  _buildRevenueCard(totalRevenue, stats.prevTotalSales, stats.salesPercentage),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(child: _buildStatMiniCard('Orders', '$orderCount', '${stats.ordersPercentage}%', const Color(0xFF2196F3))),
                      const SizedBox(width: 16),
                      Expanded(child: _buildStatMiniCard('Avg. Order', 'PKR ${orderCount > 0 ? (totalRevenue / orderCount).toStringAsFixed(0) : "0"}', '', const Color(0xFFF48FB1))),
                    ],
                  ),
                ],
                
                const SizedBox(height: 32),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Delivered (${orders.length})', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                    if (orders.isNotEmpty)
                      TextButton(
                        onPressed: () {},
                        child: const Text('Filtered List', style: TextStyle(color: Color(0xFF4CAF50), fontWeight: FontWeight.bold)),
                      ),
                  ],
                ),
                const SizedBox(height: 16),
                
                if (orders.isEmpty)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(40),
                      child: Text('No delivered orders in this period', style: TextStyle(color: Colors.grey)),
                    ),
                  )
                else
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: orders.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 16),
                    itemBuilder: (context, index) => _buildOrderCard(orders[index]),
                  ),
              ],
            ),
          ),
        );
      }),
    );
  }

  Widget _buildTimeframeButton(int days, String label) {
    final isSelected = controller.selectedSalesTimeframe.value == days;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        if (selected) _refreshData(days);
      },
      selectedColor: Color(0xFF4CAF50).withValues(alpha: 0.2),
      labelStyle: TextStyle(
        color: isSelected ? const Color(0xFF4CAF50) : Colors.grey.shade700,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      side: BorderSide(color: isSelected ? const Color(0xFF4CAF50) : Colors.grey.shade300),
      showCheckmark: false,
    );
  }

  Widget _buildRevenueCard(double amount, double prevAmount, double percentage) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Total Revenue', style: TextStyle(color: Colors.blueGrey, fontSize: 13)),
          const SizedBox(height: 8),
          Text('PKR ${amount.toStringAsFixed(0)}', style: const TextStyle(fontSize: 36, fontWeight: FontWeight.bold, letterSpacing: -1)),
          const SizedBox(height: 8),
          Row(
            children: [
              Text(
                '${percentage >= 0 ? '↑' : '↓'} ${percentage.abs()}% from PKR ${prevAmount.toStringAsFixed(0)}', 
                style: TextStyle(color: percentage >= 0 ? Colors.green : Colors.red, fontSize: 12, fontWeight: FontWeight.bold)
              ),
              const Spacer(),
              Icon(
                percentage >= 0 ? Icons.trending_up : Icons.trending_down, 
                color: percentage >= 0 ? Colors.green : Colors.red, 
                size: 16
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatMiniCard(String title, String value, String growth, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border(left: BorderSide(color: color, width: 4)),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: Colors.blueGrey, fontSize: 13, height: 1.2)),
          const SizedBox(height: 12),
          Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          if (growth.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(growth, style: TextStyle(color: growth.startsWith('+') ? Colors.green : Colors.red, fontSize: 10, fontWeight: FontWeight.bold)),
          ],
        ],
      ),
    );
  }

  Widget _buildOrderCard(SellerOrderModel order) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(16)),
                child: const Icon(Icons.check_circle_outline, color: Color(0xFF4CAF50), size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Order #${order.id}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 2),
                    Text(_formatDate(order.date), style: const TextStyle(color: Colors.grey, fontSize: 12)),
                  ],
                ),
              ),
              Text('PKR ${order.total.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(),
          const SizedBox(height: 16),
          Row(
            children: [
              if (order.images.isNotEmpty)
                SizedBox(
                  height: 40,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    shrinkWrap: true,
                    itemCount: order.images.length,
                    itemBuilder: (context, i) => Container(
                      width: 40,
                      height: 40,
                      margin: const EdgeInsets.only(right: 8),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        image: DecorationImage(
                          image: CachedNetworkImageProvider(order.images[i]),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                  ),
                ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(order.productSummary, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 4),
                    Text('To: ${order.customerName}', style: const TextStyle(color: Colors.grey, fontSize: 11)),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.blueGrey),
            ],
          ),
        ],
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      if (dateStr.isEmpty) return 'Recent';
      return DateFormat('MMM dd, yyyy').format(DateTime.parse(dateStr));
    } catch (e) {
      return dateStr;
    }
  }
}

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ecomapp/presentation/controllers/seller_controller.dart';
import 'package:ecomapp/data/models/product_model.dart';
import 'add_product_screen.dart';
import 'edit_product_screen.dart';
import 'package:cached_network_image/cached_network_image.dart';

class SellerProductListScreen extends StatelessWidget {
  final bool isStandalone;
  const SellerProductListScreen({super.key, this.isStandalone = false});

  @override
  Widget build(BuildContext context) {
    final SellerController controller = Get.find<SellerController>();

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: isStandalone 
          ? IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.black),
              onPressed: () => Get.back(),
            )
          : null,
        title: const Text(
          'Inventory Management',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(
              Icons.add_circle_outline,
              color: Color(0xFF4CAF50),
            ),
            onPressed: () => Get.to(() => const AddProductScreen()),
          ),
          IconButton(
            icon: const Icon(Icons.more_vert, color: Colors.black),
            onPressed: () {},
          ),
        ],
      ),
      body: Obx(() {
        if (controller.isLoading && controller.myProducts.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }

        return Column(
          children: [
            Obx(() => _buildStats(controller)),
            Obx(() => _buildSearchAndFilters(controller)),
            Expanded(
              child: controller.myProducts.isEmpty && !controller.isLoading
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.inventory_2_outlined, size: 80, color: Colors.grey.shade300),
                          const SizedBox(height: 16),
                          const Text('No products found', style: TextStyle(color: Colors.grey, fontSize: 16)),
                          const SizedBox(height: 8),
                          TextButton(
                            onPressed: () => controller.fetchMyProducts(),
                            child: const Text('Refresh'),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      itemCount: controller.filteredProducts.length,
                      itemBuilder: (context, index) {
                        return _buildProductCard(controller.filteredProducts[index]);
                      },
                    ),
            ),
          ],
        );
      }),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Get.to(() => const AddProductScreen()),
        backgroundColor: const Color(0xFF81C784),
        child: const Icon(Icons.add, size: 30),
      ),
    );
  }

  Widget _buildStats(SellerController controller) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          Expanded(
            child: _buildInventoryStatCard(
              'Total Products',
              '${controller.stats.value?.productCount ?? 0}',
              Icons.inventory_2_outlined,
              const Color(0xFFE8F5E9),
              const Color(0xFF4CAF50),
              '+5% this month',
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: _buildInventoryStatCard(
              'Low Stock',
              '${controller.lowStockCount}',
              Icons.warning_amber_rounded,
              const Color(0xFFFFF3E0),
              const Color(0xFFFF9800),
              '-2% from peak',
              isWarning: true,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInventoryStatCard(
    String label,
    String value,
    IconData icon,
    Color bgColor,
    Color iconColor,
    String trend, {
    bool isWarning = false,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isWarning ? const Color(0xFFFFF7ED) : const Color(0xFFF1F8E9),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isWarning ? Colors.orange.shade100 : Colors.green.shade100,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: iconColor, size: 24),
          const SizedBox(height: 12),
          Text(
            value,
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(
                isWarning ? Icons.trending_down : Icons.trending_up,
                size: 14,
                color: isWarning ? Colors.red : Colors.green,
              ),
              const SizedBox(width: 4),
              Text(
                trend,
                style: TextStyle(
                  color: isWarning ? Colors.red : Colors.green,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSearchAndFilters(SellerController controller) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
      child: Column(
        children: [
          TextField(
            onChanged: (value) => controller.searchQuery.value = value,
            decoration: InputDecoration(
              hintText: 'Search product name or SKU...',
              prefixIcon: const Icon(Icons.search),
              fillColor: const Color(0xFFEFF2F5),
              filled: true,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(15),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          const SizedBox(height: 16),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterChip(
                  'All Items', 
                  isSelected: !controller.showLowStockOnly.value,
                  onTap: () => controller.showLowStockOnly.value = false,
                ),
                _buildFilterChip(
                  'Low Stock', 
                  isSelected: controller.showLowStockOnly.value,
                  onTap: () => controller.showLowStockOnly.value = true,
                ),
                _buildFilterChip('Categories', hasDropdown: true),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, {bool isSelected = false, bool hasDropdown = false, VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF81C784) : const Color(0xFFEFF2F5),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.black87,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
            if (hasDropdown) ...[
              const SizedBox(width: 4),
              Icon(
                Icons.keyboard_arrow_down,
                size: 16,
                color: isSelected ? Colors.white : Colors.black87,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildProductCard(ProductModel product) {
    final lowStock = product.stock < 5;
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10),
        ],
      ),
      child: Stack(
        children: [
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: product.mainImage != null
                    ? CachedNetworkImage(
                        imageUrl: product.mainImage!,
                        width: 80,
                        height: 80,
                        fit: BoxFit.cover,
                        errorWidget: (context, url, err) => Container(
                          width: 80,
                          height: 80,
                          color: Colors.grey.shade200,
                          child: const Icon(
                            Icons.image_not_supported,
                            color: Colors.grey,
                          ),
                        ),
                      )
                    : Container(
                        width: 80,
                        height: 80,
                        color: Colors.grey.shade200,
                        child: const Icon(Icons.image),
                      ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.name,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    Text(
                      'SKU: ${product.name.substring(0, 3).toUpperCase()}-${indexToChar(product.id)}',
                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'PKR ${product.price.toStringAsFixed(0)}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: Color(0xFF4CAF50),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: lowStock ? Colors.red : Colors.green,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          lowStock
                              ? 'only ${product.stock} left'
                              : '${product.stock} in stock',
                          style: TextStyle(
                            color: lowStock ? Colors.red : Colors.blueGrey,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Column(
                children: [
                  GestureDetector(
                    onTap: () =>
                        Get.to(() => EditProductScreen(product: product)),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F8E9),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Row(
                        children: [
                          Icon(
                            Icons.edit_outlined,
                            size: 14,
                            color: Color(0xFF4CAF50),
                          ),
                          SizedBox(width: 4),
                          Text(
                            'EDIT',
                            style: TextStyle(
                              color: Color(0xFF4CAF50),
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          if (lowStock)
            Positioned(
              right: 0,
              top: -8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: const BoxDecoration(
                  color: Color(0xFFFF5252),
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(12),
                    topRight: Radius.circular(12),
                  ),
                ),
                child: const Text(
                  'LOW STOCK',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 8,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  String indexToChar(int id) {
    return String.fromCharCode(65 + (id % 26)) + (id % 100).toString();
  }
}

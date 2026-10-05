import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ecomapp/core/theme/app_theme.dart';
import 'package:ecomapp/presentation/controllers/cart_controller.dart';
import 'package:ecomapp/presentation/controllers/main_controller.dart';
import 'package:ecomapp/presentation/widgets/product_card.dart';
import 'package:ecomapp/data/models/product_model.dart';

class ProductListScreen extends StatelessWidget {
  final String title;
  final List<ProductModel> products;

  const ProductListScreen({
    super.key,
    required this.title,
    required this.products,
  });

  @override
  Widget build(BuildContext context) {
    final CartController cartController = Get.find<CartController>();

    return Scaffold(
      appBar: AppBar(
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
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          Obx(() {
            final count = cartController.totalItemCount;
            return IconButton(
              icon: Badge(
                isLabelVisible: count > 0,
                label: Text('$count'),
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: const BoxDecoration(
                    color: Color(0xFFF0F2F5),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.shopping_bag_outlined, size: 20),
                ),
              ),
              onPressed: () {
                Get.back();
                Get.find<MainController>().changeIndex(2);
              },
            );
          }),
          const SizedBox(width: 8),
        ],
      ),
      body: products.isEmpty
          ? const Center(
              child: Text(
                'No products found',
                style: TextStyle(color: AppColors.textLight),
              ),
            )
          : GridView.builder(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 110),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.7,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
              ),
              itemCount: products.length,
              itemBuilder: (context, index) {
                return ProductCard(product: products[index]);
              },
            ),
      bottomNavigationBar: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.bottomCenter,
        children: [
          Container(
            height: 70,
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -5),
                ),
              ],
            ),
            child: SafeArea(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildNavItem(0, Icons.home_outlined, Icons.home, 'Home'),
                  _buildNavItem(
                    1,
                    Icons.grid_view_outlined,
                    Icons.grid_view,
                    'Category',
                  ),
                  const SizedBox(width: 80), // gap for cart
                  _buildNavItem(
                    3,
                    Icons.receipt_long_outlined,
                    Icons.receipt_long,
                    'Orders',
                  ),
                  _buildNavItem(
                    4,
                    Icons.person_outline,
                    Icons.person,
                    'Profile',
                  ),
                ],
              ),
            ),
          ),
          Positioned(bottom: 30, child: _buildCartItem(cartController)),
        ],
      ),
    );
  }

  Widget _buildCartItem(CartController cartController) {
    return GestureDetector(
      onTap: () {
        Get.back();
        Get.find<MainController>().changeIndex(2);
      },
      child: Container(
        height: 64,
        width: 64,
        decoration: BoxDecoration(
          color: AppColors.primary,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.3),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Obx(() {
          final count = cartController.totalItemCount;
          return Center(
            child: Badge(
              isLabelVisible: count > 0,
              label: Text('$count'),
              backgroundColor: AppColors.accent,
              child: const Icon(
                Icons.shopping_bag_outlined,
                color: Colors.white,
                size: 32,
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildNavItem(
    int index,
    IconData icon,
    IconData activeIcon,
    String label,
  ) {
    return InkWell(
      onTap: () {
        Get.back();
        Get.find<MainController>().changeIndex(index);
      },
      splashColor: Colors.transparent,
      highlightColor: Colors.transparent,
      child: SizedBox(
        width: 65,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: AppColors.textLight, size: 24),
            const SizedBox(height: 4),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: AppColors.textLight,
                fontWeight: FontWeight.w500,
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

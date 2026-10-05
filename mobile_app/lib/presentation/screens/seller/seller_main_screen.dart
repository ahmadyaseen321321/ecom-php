import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ecomapp/core/theme/app_theme.dart';
import 'package:ecomapp/presentation/controllers/seller_main_controller.dart';
import 'seller_dashboard_screen.dart';
import 'seller_product_list_screen.dart';
import 'seller_orders_screen.dart';
import 'seller_reviews_screen.dart';
import 'seller_settings_screen.dart';

class SellerMainScreen extends StatefulWidget {
  const SellerMainScreen({super.key});

  @override
  State<SellerMainScreen> createState() => _SellerMainScreenState();
}

class _SellerMainScreenState extends State<SellerMainScreen> {
  final SellerMainController _controller = Get.put(SellerMainController());

  final List<Widget> _pages = [
    const SellerDashboardScreen(),
    const SellerProductListScreen(),
    const SellerOrdersScreen(),
    const SellerReviewsScreen(),
    const SellerSettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Obx(() => _pages[_controller.currentIndex]),
      bottomNavigationBar: Container(
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
          child: Obx(
            () => Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildNavItem(
                  0,
                  Icons.dashboard_outlined,
                  Icons.dashboard,
                  'Dashboard',
                ),
                _buildNavItem(
                  1,
                  Icons.inventory_2_outlined,
                  Icons.inventory_2,
                  'Products',
                ),
                _buildNavItem(
                  2,
                  Icons.receipt_long_outlined,
                  Icons.receipt_long,
                  'Orders',
                ),
                _buildNavItem(
                  3,
                  Icons.rate_review_outlined,
                  Icons.rate_review,
                  'Reviews',
                ),
                _buildNavItem(
                  4,
                  Icons.settings_outlined,
                  Icons.settings,
                  'Settings',
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(
    int index,
    IconData icon,
    IconData activeIcon,
    String label,
  ) {
    final isSelected = _controller.currentIndex == index;
    return InkWell(
      onTap: () => _controller.changeIndex(index),
      splashColor: Colors.transparent,
      highlightColor: Colors.transparent,
      child: SizedBox(
        width: 65,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isSelected ? activeIcon : icon,
              color: isSelected ? AppColors.primary : AppColors.textLight,
              size: 24,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: isSelected ? AppColors.primary : AppColors.textLight,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

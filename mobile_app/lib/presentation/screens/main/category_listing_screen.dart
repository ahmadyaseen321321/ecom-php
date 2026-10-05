import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ecomapp/core/theme/app_theme.dart';
import 'package:ecomapp/data/models/category_model.dart';
import 'package:ecomapp/presentation/controllers/category_controller.dart';
import 'package:ecomapp/presentation/controllers/cart_controller.dart';
import 'package:ecomapp/presentation/controllers/main_controller.dart';
import 'package:ecomapp/presentation/widgets/product_card.dart';

class CategoryListingScreen extends StatefulWidget {
  final CategoryModel category;
  const CategoryListingScreen({super.key, required this.category});

  @override
  State<CategoryListingScreen> createState() => _CategoryListingScreenState();
}

class _CategoryListingScreenState extends State<CategoryListingScreen> {
  final CategoryController controller = Get.find<CategoryController>();
  final CartController cartController = Get.find<CartController>();

  @override
  void initState() {
    super.initState();
    // Defer fetch to after first build so Obx doesn't trigger during build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      controller.fetchCategoryProducts(widget.category.id);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
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
        title: Text(
          widget.category.name,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
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
              child: TextField(
                onSubmitted: (value) {
                  controller.searchQuery.value = value;
                  controller.applyFilters(widget.category.id);
                },
                decoration: const InputDecoration(
                  hintText: 'Search for products...',
                  prefixIcon: Icon(Icons.search, color: AppColors.textLight),
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Obx(
            () => SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  _buildFilterChip(
                    'Clear',
                    Icons.close,
                    isSelected:
                        controller.minPrice.value != null ||
                        controller.minRating.value != null ||
                        controller.currentSort.value != 'newest' ||
                        controller.searchQuery.value.isNotEmpty,
                    onTap: () {
                      controller.clearFilters();
                      controller.applyFilters(widget.category.id);
                    },
                  ),
                  const SizedBox(width: 12),
                  _buildFilterChip(
                    'Price',
                    Icons.keyboard_arrow_down,
                    isSelected:
                        controller.minPrice.value != null ||
                        controller.maxPrice.value != null,
                    onTap: () => _showPriceFilterSheet(),
                  ),
                  const SizedBox(width: 12),
                  _buildFilterChip(
                    'Rating',
                    Icons.star_border,
                    isSelected: controller.minRating.value != null,
                    onTap: () => _showRatingFilterSheet(),
                  ),
                  const SizedBox(width: 12),
                  _buildFilterChip(
                    'Popular',
                    Icons.local_fire_department_outlined,
                    isSelected: controller.currentSort.value == 'popular',
                    onTap: () {
                      if (controller.currentSort.value == 'popular') {
                        controller.currentSort.value = 'newest';
                      } else {
                        controller.currentSort.value = 'popular';
                      }
                      controller.applyFilters(widget.category.id);
                    },
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          Expanded(
            child: Obx(
              () => controller.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : controller.categoryProducts.isEmpty
                  ? const Center(
                      child: Text(
                        'No products found',
                        style: TextStyle(color: AppColors.textLight),
                      ),
                    )
                  : GridView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 0.7,
                            crossAxisSpacing: 16,
                            mainAxisSpacing: 16,
                          ),
                      itemCount: controller.categoryProducts.length,
                      itemBuilder: (context, index) {
                        return ProductCard(
                          product: controller.categoryProducts[index],
                        );
                      },
                    ),
            ),
          ),
        ],
      ),
      // Mirror the main screen's bottom nav — tap navigates back + switches tab
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
          Positioned(
            bottom: 30, // Exactly overlaps, slightly up from nav bar
            child: _buildCartItem(),
          ),
        ],
      ),
    );
  }

  Widget _buildCartItem() {
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
    final isSelected = index == 1; // Always active for Category tab
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

  void _showPriceFilterSheet() {
    double min = controller.minPrice.value ?? 0;
    double max = controller.maxPrice.value ?? 1000;

    Get.bottomSheet(
      Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: StatefulBuilder(
          builder: (context, setState) {
            return Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Price Range',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('PKR ${min.toInt()}'),
                    Text('PKR ${max.toInt()}'),
                  ],
                ),
                RangeSlider(
                  values: RangeValues(min, max),
                  min: 0,
                  max: 2000,
                  divisions: 40,
                  activeColor: AppColors.primary,
                  onChanged: (values) {
                    setState(() {
                      min = values.start;
                      max = values.end;
                    });
                  },
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () {
                    controller.minPrice.value = min;
                    controller.maxPrice.value = max;
                    controller.applyFilters(widget.category.id);
                    Get.back();
                  },
                  child: const Text('Apply Filter'),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  void _showRatingFilterSheet() {
    Get.bottomSheet(
      Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Minimum Rating',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ...[4.0, 3.0, 2.0]
                .map(
                  (rating) => ListTile(
                    leading: const Icon(Icons.star, color: Colors.amber),
                    title: Text('$rating Stars & Up'),
                    onTap: () {
                      controller.minRating.value = rating;
                      controller.applyFilters(widget.category.id);
                      Get.back();
                    },
                  ),
                )
                .toList(),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(
    String label,
    IconData icon, {
    bool isSelected = false,
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryLight : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? Colors.transparent : const Color(0xFFEEEEEE),
          ),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected ? Colors.white : AppColors.textSecondary,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : AppColors.textSecondary,
                fontWeight: FontWeight.w500,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

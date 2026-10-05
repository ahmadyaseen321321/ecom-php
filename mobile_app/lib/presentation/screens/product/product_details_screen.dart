import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:logger/logger.dart';
import 'package:ecomapp/core/theme/app_theme.dart';
import 'package:ecomapp/data/models/product_model.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:ecomapp/presentation/controllers/product_controller.dart';
import 'package:ecomapp/core/network/api_client.dart';
import 'package:ecomapp/presentation/controllers/cart_controller.dart';
import 'package:ecomapp/presentation/controllers/main_controller.dart';
import 'package:ecomapp/presentation/controllers/wishlist_controller.dart';
import 'package:ecomapp/presentation/widgets/review_item.dart';
import 'package:ecomapp/presentation/screens/product/all_reviews_screen.dart';
import 'package:ecomapp/core/network/api_endpoints.dart';

class ProductDetailsScreen extends StatefulWidget {
  final ProductModel product;
  const ProductDetailsScreen({super.key, required this.product});

  @override
  State<ProductDetailsScreen> createState() => _ProductDetailsScreenState();
}

class _ProductDetailsScreenState extends State<ProductDetailsScreen> {
  late final ProductController controller;
  final WishlistController wishlistController = Get.find<WishlistController>();
  final CartController cartController = Get.find<CartController>();
  final PageController _pageController = PageController();
  final _currentPage = 0.obs;
  final _isExpanded = false.obs;

  @override
  void initState() {
    super.initState();
    if (!Get.isRegistered<ProductController>()) {
      Get.put(ProductController(apiClient: Get.find<ApiClient>()));
    }
    controller = Get.find<ProductController>();
    controller.fetchProductDetails(widget.product.id);
  }

  /// Popup after a successful cart add. [openCartAfter] shows "View cart" to open the cart tab with full list.
  void _showAddedToCartPopup({required bool openCartAfter}) {
    Get.dialog<void>(
      Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        backgroundColor: Colors.white,
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.check_rounded,
                    color: AppColors.primary,
                    size: 44,
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Item added to cart',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  widget.product.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 14,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                Obx(
                  () => Text(
                    '${cartController.totalItemCount} item'
                    '${cartController.totalItemCount == 1 ? '' : 's'} in your cart',
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 13,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 24),
                if (openCartAfter) ...[
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        Get.back(); // Close dialog
                        Get.back(); // Exit product details
                        if (Get.isRegistered<MainController>()) {
                          Get.find<MainController>().changeIndex(2);
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryLight,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(28),
                        ),
                      ),
                      child: const Text(
                        'View cart',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () => Get.back(),
                    child: const Text(
                      'Continue shopping',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ] else
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        Get.back(); // Close dialog
                        Get.back(); // Go back to the main screen
                        if (Get.isRegistered<MainController>()) {
                          Get.find<MainController>().changeIndex(0);
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(28),
                        ),
                      ),
                      child: const Text(
                        'OK',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
      barrierDismissible: true,
    );
  }

  @override
  Widget build(BuildContext context) {
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
        title: const Text(
          'Product Details',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(icon: const Icon(Icons.share_outlined), onPressed: () {}),
          Obx(() {
            final isInWishlist = wishlistController.isProductInWishlist(
              widget.product.id,
            );
            return IconButton(
              icon: Icon(
                isInWishlist ? Icons.favorite : Icons.favorite_border,
                color: isInWishlist ? Colors.red : null,
              ),
              onPressed: () =>
                  wishlistController.toggleWishlist(widget.product),
            );
          }),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Carousel (Mock)
            Container(
              height: 350,
              width: double.infinity,
              color: const Color(0xFFF8F8F8),
              child: Stack(
                alignment: Alignment.bottomCenter,
                children: [
                  PageView.builder(
                    controller: _pageController,
                    onPageChanged: (int page) {
                      _currentPage.value = page;
                    },
                    itemCount: widget.product.images.length,
                    itemBuilder: (context, index) {
                      return Center(
                        child: CachedNetworkImage(
                          imageUrl: widget.product.images[index],
                          fit: BoxFit.contain,
                          placeholder: (context, url) => const Icon(
                            Icons.image,
                            size: 200,
                            color: Colors.grey,
                          ),
                          errorWidget: (context, url, error) => const Icon(
                            Icons.broken_image,
                            size: 200,
                            color: Colors.grey,
                          ),
                        ),
                      );
                    },
                  ),
                  if (widget.product.images.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 20),
                      child: Obx(
                        () => Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(
                            widget.product.images.length,
                            (index) => AnimatedContainer(
                              duration: const Duration(milliseconds: 300),
                              margin: const EdgeInsets.symmetric(horizontal: 4),
                              width: _currentPage.value == index ? 24 : 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: _currentPage.value == index
                                    ? AppColors.primary
                                    : Colors.grey.withValues(alpha: 0.5),
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.product.name,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    crossAxisAlignment: WrapCrossAlignment.center,
                    spacing: 8,
                    runSpacing: 4,
                    children: [
                      Row(
                        children: List.generate(
                          5,
                          (index) => Icon(
                            Icons.star,
                            color: index < widget.product.rating.floor()
                                ? Colors.amber
                                : Colors.grey[300],
                            size: 16,
                          ),
                        ),
                      ),
                      Text(
                        widget.product.rating == 0 ? 'N/A' : widget.product.rating.toStringAsFixed(1),
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        '(${widget.product.reviewCount} reviews)',
                        style: TextStyle(
                          color: AppColors.textLight,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Wrap(
                    crossAxisAlignment: WrapCrossAlignment.center,
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      Text(
                        'PKR ${widget.product.price.toStringAsFixed(0)}',
                        style: const TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                      if (widget.product.discountPrice != null) ...[
                        Text(
                          'PKR ${widget.product.discountPrice!.toStringAsFixed(0)}',
                          style: TextStyle(
                            fontSize: 18,
                            color: AppColors.textLight,
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF0F2F5),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text(
                            '15% OFF',
                            style: TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 24),

                  const Text(
                    'DESCRIPTION',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      letterSpacing: 1.1,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Obx(() => Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.product.description,
                            maxLines: _isExpanded.value ? null : 5,
                            overflow: _isExpanded.value ? TextOverflow.visible : TextOverflow.ellipsis,
                            style: TextStyle(
                              color: AppColors.textSecondary,
                              height: 1.5,
                              fontSize: 14,
                            ),
                          ),
                          GestureDetector(
                            onTap: () => _isExpanded.toggle(),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4),
                              child: Text(
                                _isExpanded.value ? 'Show Less' : 'Read More',
                                style: const TextStyle(
                                  color: Colors.green,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                        ],
                      )),
                  const SizedBox(height: 24),

                  const Text(
                    'SELECT COLOR',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      letterSpacing: 1.1,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 16,
                    runSpacing: 12,
                    children: [
                      _buildColorOption('Silver', const Color(0xFFD8D8D8), 0),
                      _buildColorOption('Black', const Color(0xFF1A1D21), 1),
                    ],
                  ),
                  const SizedBox(height: 32),

                  // Customer Reviews Heading with View All
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'CUSTOMER REVIEWS',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          letterSpacing: 1.1,
                        ),
                      ),
                      TextButton(
                        onPressed: () {
                          if (controller.reviews.isNotEmpty) {
                            Get.to(() => AllReviewsScreen(
                                  productName: widget.product.name,
                                  reviews: controller.reviews,
                                ));
                          }
                        },
                        style: TextButton.styleFrom(
                          padding: EdgeInsets.zero,
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Text(
                          'View All',
                          style: TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Review Images Gallery
                  Obx(() {
                    final reviewImages = controller.reviews
                        .where((r) => r.imageUrl != null && r.imageUrl!.isNotEmpty)
                        .map((r) => r.imageUrl!)
                        .toList();
                    
                    if (reviewImages.isEmpty) return const SizedBox.shrink();
                    
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Photos from Customers',
                          style: TextStyle(fontSize: 12, color: AppColors.textLight),
                        ),
                        const SizedBox(height: 8),
                        SizedBox(
                          height: 80,
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            itemCount: reviewImages.length,
                            itemBuilder: (context, index) {
                              final imageUrl = "${ApiEndpoints.baseUrl.replaceAll('/api/', '')}/${reviewImages[index]}";
                              return Padding(
                                padding: const EdgeInsets.only(right: 12),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(12),
                                  child: CachedNetworkImage(
                                    imageUrl: imageUrl,
                                    width: 80,
                                    height: 80,
                                    fit: BoxFit.cover,
                                    placeholder: (context, url) => Container(
                                      width: 80,
                                      height: 80,
                                      color: const Color(0xFFF8F8F8),
                                      child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                                    ),
                                    errorWidget: (context, url, error) => const Icon(Icons.broken_image),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],
                    );
                  }),
                  const SizedBox(height: 4),
                  Obx(() {
                    if (controller.reviews.isEmpty) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 24),
                        child: Center(
                          child: Column(
                            children: [
                              Icon(Icons.rate_review_outlined,
                                  size: 48, color: Colors.grey.shade300),
                              const SizedBox(height: 12),
                              const Text(
                                'No reviews yet',
                                style: TextStyle(
                                    fontWeight: FontWeight.bold, color: Colors.grey),
                              ),
                              const Text(
                                'Be the first to review this product',
                                style: TextStyle(fontSize: 12, color: Colors.grey),
                              ),
                            ],
                          ),
                        ),
                      );
                    }
                    
                    final displayCount = controller.reviews.length > 5 ? 5 : controller.reviews.length;
                    
                    return ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: displayCount,
                      separatorBuilder: (context, index) =>
                          const SizedBox(height: 16),
                      itemBuilder: (context, index) {
                        final review = controller.reviews[index];
                        return ReviewItem(review: review);
                      },
                    );
                  }),
                  const SizedBox(height: 24),

                  const SizedBox(height: 40),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: Obx(() {
        final busy = cartController.isSyncing.value;
        return Container(
          padding: const EdgeInsets.all(20),
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
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: busy
                      ? null
                      : () async {
                          Logger().i('Add to Cart clicked for: ${widget.product.name}');
                          final ok = await cartController.addToCart(
                            widget.product,
                          );
                          Logger().i('Add to Cart result: $ok');
                          if (ok) {
                            _showAddedToCartPopup(openCartAfter: false);
                          }
                        },
                  icon: const Icon(
                    Icons.shopping_bag_outlined,
                    color: AppColors.primary,
                  ),
                  label: const Text(
                    'Add to Cart',
                    style: TextStyle(
                      color: Colors.black,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(0, 56),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(28),
                    ),
                    side: const BorderSide(color: AppColors.primary),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: ElevatedButton(
                  onPressed: busy
                      ? null
                      : () async {
                          Logger().i('Buy Now clicked for: ${widget.product.name}');
                          final ok = await cartController.addToCart(
                            widget.product,
                          );
                          Logger().i('Buy Now result: $ok');
                          if (ok) {
                            // Direct navigation for Buy Now as requested
                            Get.back(); // Exit product details
                            if (Get.isRegistered<MainController>()) {
                              Get.find<MainController>().changeIndex(2);
                            }
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryLight,
                    minimumSize: const Size(0, 56),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(28),
                    ),
                  ),
                  child: busy
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          'Buy Now',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                ),
              ),
            ],
          ),
        );
      }),
    );
  }

  Widget _buildColorOption(String label, Color color, int index) {
    return Obx(() {
      final isSelected = controller.selectedColor.value == index;
      return GestureDetector(
        onTap: () => controller.changeColor(index),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFFF0F2F5) : Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: isSelected ? Colors.black : const Color(0xFFEEEEEE),
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(color: color, shape: BoxShape.circle),
              ),
              const SizedBox(width: 8),
              Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      );
    });
  }
}

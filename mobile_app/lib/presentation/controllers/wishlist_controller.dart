import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:logger/logger.dart';
import '../../data/models/product_model.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_endpoints.dart';
import 'base_controller.dart';

class WishlistController extends BaseController {
  final ApiClient apiClient;
  WishlistController({required this.apiClient});

  final RxList<ProductModel> wishlistItems = <ProductModel>[].obs;

  @override
  void onInit() {
    super.onInit();
    fetchWishlist();
  }

  Future<void> fetchWishlist() async {
    showLoading();
    try {
      final response = await apiClient.getData(ApiEndpoints.wishlist);
      Logger().d('Fetch Wishlist Response: ${response.data}');
      if (response.data['status'] == 'success') {
        final items = (response.data['data'] as List)
            .map((item) => ProductModel.fromJson(item))
            .toList();
        Logger().i('Fetched ${items.length} items from server');
        wishlistItems.assignAll(items);
      }
    } catch (e) {
      Logger().e('Fetch Wishlist Error: $e');
    } finally {
      hideLoading();
    }
  }

  bool isProductInWishlist(int productId) {
    return wishlistItems.any((item) => item.id == productId);
  }

  Future<void> toggleWishlist(ProductModel product) async {
    Logger().i('Toggling wishlist for product ID: ${product.id}');
    // Check locally first to avoid multiple concurrent requests for the same product
    final isInWishlist = isProductInWishlist(product.id);
    Logger().d('Is in local wishlist: $isInWishlist');

    if (isInWishlist) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product);
    }
    Logger().d('Local wishlist size after toggle: ${wishlistItems.length}');
  }

  Future<void> addToWishlist(ProductModel product) async {
    Logger().d('DEBUG: addToWishlist for product: ${product.id}');
    // Prevent duplicates in local list
    if (isProductInWishlist(product.id)) {
      Logger().d('DEBUG: Already in wishlist, skipping');
      return;
    }

    try {
      final response = await apiClient.postData(ApiEndpoints.wishlist, {
        'product_id': product.id,
      });
      Logger().d('DEBUG: add response: ${response.data}');
      if (response.data['status'] == 'success') {
        // Re-check just in case another request finished in the meantime
        if (!isProductInWishlist(product.id)) {
          wishlistItems.add(product);
          Logger().d('DEBUG: Added to local list');
        }
        Get.snackbar(
          'Success',
          'Item added to wishlist',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.green.shade600,
          colorText: Colors.white,
          margin: const EdgeInsets.all(16),
        );
      }
    } catch (e) {
      Logger().e('DEBUG: add error: $e');
      showError('Failed to add to wishlist');
    }
  }

  Future<void> removeFromWishlist(int productId) async {
    Logger().d('DEBUG: removeFromWishlist for id: $productId');
    try {
      final response = await apiClient.deleteData(
        '${ApiEndpoints.wishlist}?product_id=$productId',
      );
      Logger().d('DEBUG: remove response: ${response.data}');
      if (response.data['status'] == 'success') {
        wishlistItems.removeWhere((item) => item.id == productId);
        Logger().d('DEBUG: Removed from local list');
        Get.snackbar(
          'Removed',
          'Item removed from wishlist',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.orange.shade600,
          colorText: Colors.white,
          margin: const EdgeInsets.all(16),
        );
      }
    } catch (e) {
      Logger().e('DEBUG: remove error: $e');
      showError('Failed to remove from wishlist');
    }
  }
}

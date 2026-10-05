import 'dart:convert';
import 'package:get/get.dart';
import 'package:logger/logger.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ecomapp/data/models/cart_item_model.dart';
import 'package:ecomapp/data/models/product_model.dart';
import 'package:ecomapp/core/network/api_client.dart';
import 'package:ecomapp/core/network/api_endpoints.dart';

class CartController extends GetxController {
  final ApiClient apiClient;
  CartController({required this.apiClient});

  final cartItems = <CartItemModel>[].obs;
  final isSyncing = false.obs;
  final appliedCouponCode = ''.obs;
  final couponDiscount = 0.0.obs;
  final isCouponLoading = false.obs;

  @override
  void onInit() {
    super.onInit();
    fetchCart();
  }

  /// Cart API rows use [product_id]; [ProductModel.fromJson] expects [id] as product id.
  Map<String, dynamic> _cartRowToProductJson(Map<String, dynamic> item) {
    return {
      'id': item['product_id'],
      'category_id': item['category_id'] ?? 0,
      'name': item['name'],
      'description': item['description'] ?? '',
      'price': item['price'],
      'discount_price': item['discount_price'],
      'stock': item['stock'] ?? 0,
      'main_image': item['main_image'],
      'rating': item['rating'] ?? 0,
    };
  }

  Future<int?> _getUserId() async {
    final prefs = await SharedPreferences.getInstance();
    int? userId = prefs.getInt('user_id');

    // Fallback: If user was logged in before our changes, extract ID from JWT token
    if (userId == null) {
      final token = prefs.getString('token');
      if (token != null && token.isNotEmpty) {
        try {
          final parts = token.split('.');
          if (parts.length == 3) {
            final payload = utf8.decode(
              base64Url.decode(base64Url.normalize(parts[1])),
            );
            final data = json.decode(payload);
            userId = int.tryParse(data['id'].toString());
            if (userId != null) {
              await prefs.setInt('user_id', userId);
              Logger().i('Recovered User ID from token: $userId');
            }
          }
        } catch (e) {
          Logger().e('Failed to recover ID from token: $e');
        }
      }
    }

    if (userId == null) {
      Logger().e('CRITICAL: User ID is null. User might not be logged in or session corrupted.');
    }
    return userId;
  }

  Future<void> fetchCart() async {
    try {
      final userId = await _getUserId();
      if (userId == null) {
        Logger().w('Fetch Cart skipped: User ID is null');
        return;
      }

      final response = await apiClient.getData(
        '${ApiEndpoints.cart}?user_id=$userId',
      );
      final body = response.data;
      if (body is Map && body['status'] == 'success' && body['data'] is List) {
        final list = body['data'] as List;
        cartItems.assignAll(
          list.map((e) {
            final item = Map<String, dynamic>.from(e as Map);
            return CartItemModel(
              cartLineId: int.parse(item['cart_id'].toString()),
              product: ProductModel.fromJson(_cartRowToProductJson(item)),
              quantity: int.parse(item['quantity'].toString()),
            );
          }).toList(),
        );
      }
    } on DioException catch (e) {
      Logger().e('Fetch Cart Error: $e');
      if (e.response?.statusCode == 401) {
        cartItems.clear();
      }
    } catch (e) {
      Logger().e('Fetch Cart Unexpected Error: $e');
    }
  }

  double get subtotal => cartItems.fold(0.0, (sum, item) => sum + item.total);
  double get shipping => cartItems.isEmpty ? 0.0 : 10.0;
  double get tax => subtotal * 0.05;
  double get discount => couponDiscount.value;
  double get total =>
      (subtotal + shipping + tax - discount).clamp(0.0, double.infinity);
  int get totalItemCount =>
      cartItems.fold(0, (sum, item) => sum + item.quantity);

  Future<void> applyCoupon(String code) async {
    if (code.trim().isEmpty) {
      Get.snackbar(
        'Coupon',
        'Please enter a coupon code',
        snackPosition: SnackPosition.BOTTOM,
      );
      return;
    }
    isCouponLoading.value = true;
    try {
      final response = await apiClient.postData(ApiEndpoints.coupon, {
        'code': code.trim().toUpperCase(),
        'subtotal': subtotal,
      });
      final data = response.data;
      if (data is Map && data['status'] == 'success') {
        appliedCouponCode.value = data['coupon']['code'].toString();
        couponDiscount.value = (data['coupon']['discount'] as num).toDouble();
        Get.snackbar(
          'Coupon Applied!',
          'You saved PKR ${couponDiscount.value.toStringAsFixed(0)} with ${appliedCouponCode.value}',
          snackPosition: SnackPosition.BOTTOM,
        );
      } else {
        final msg = data is Map
            ? (data['message'] ?? 'Invalid coupon').toString()
            : 'Invalid coupon';
        Get.snackbar('Coupon', msg, snackPosition: SnackPosition.BOTTOM);
      }
    } on DioException catch (e) {
      final msg = e.response?.data is Map
          ? (e.response!.data['message'] ?? 'Invalid coupon').toString()
          : 'Invalid or expired coupon';
      Get.snackbar('Coupon', msg, snackPosition: SnackPosition.BOTTOM);
    } finally {
      isCouponLoading.value = false;
    }
  }

  void removeCoupon() {
    appliedCouponCode.value = '';
    couponDiscount.value = 0.0;
    Get.snackbar(
      'Coupon',
      'Coupon removed',
      snackPosition: SnackPosition.BOTTOM,
    );
  }

  Future<bool> addToCart(ProductModel product, {int quantity = 1}) async {
    isSyncing.value = true;
    try {
      final userId = await _getUserId();
      if (userId == null) return false;

      Logger().i('Adding to cart: ${product.name} (ID: ${product.id}), Qty: $quantity, User: $userId');
      final response = await apiClient.postData(ApiEndpoints.cart, {
        'product_id': product.id,
        'quantity': quantity,
        'user_id': userId,
      });
      Logger().d('Cart API Response: ${response.statusCode} - ${response.data}');
      final data = response.data;
      if (data is Map && data['status'] == 'success') {
        Logger().i('Cart Sync Success, fetching fresh cart...');
        await fetchCart();
        return true;
      }
      final msg = data is Map
          ? (data['message']?.toString() ?? 'Could not update cart')
          : 'Could not update cart';
      Logger().e('Cart Sync Failed: $msg');
      Get.snackbar('Cart', msg, snackPosition: SnackPosition.BOTTOM);
      return false;
    } on DioException catch (e) {
      Logger().e('Cart DioException: ${e.type} - ${e.message}');
      final msg = e.response?.data is Map
          ? (e.response!.data['message']?.toString() ?? 'Failed to add to cart')
          : 'Failed to add to cart (Network Error)';
      Get.snackbar('Error', msg, snackPosition: SnackPosition.BOTTOM);
      return false;
    } catch (e) {
      Logger().e('Cart Unexpected Error: $e');
      Get.snackbar(
        'Error',
        'An unexpected error occurred',
        snackPosition: SnackPosition.BOTTOM,
      );
      return false;
    } finally {
      isSyncing.value = false;
    }
  }

  Future<void> incrementQuantity(int index) async {
    final item = cartItems[index];
    final userId = await _getUserId();
    if (userId == null) return;

    try {
      await apiClient.postData(ApiEndpoints.cart, {
        'product_id': item.product.id,
        'quantity': 1,
        'user_id': userId,
      });
      await fetchCart();
    } on DioException catch (_) {
      Get.snackbar('Error', 'Could not update quantity');
    }
  }

  Future<void> decrementQuantity(int index) async {
    final item = cartItems[index];
    final userId = await _getUserId();
    if (userId == null) return;

    if (item.quantity > 1) {
      try {
        await apiClient.postData(ApiEndpoints.cart, {
          'product_id': item.product.id,
          'quantity': -1,
          'user_id': userId,
        });
        await fetchCart();
      } on DioException catch (_) {
        Get.snackbar('Error', 'Could not update quantity');
      }
    } else {
      await removeItemAt(index);
    }
  }

  Future<void> removeItemAt(int index) async {
    final item = cartItems[index];
    final userId = await _getUserId();
    if (userId == null) return;

    try {
      await apiClient.deleteData(
        '${ApiEndpoints.cart}?id=${item.cartLineId}&user_id=$userId',
      );
      await fetchCart();
    } on DioException catch (_) {
      Get.snackbar('Error', 'Could not remove item');
    }
  }

  Future<void> removeItem(int index) => removeItemAt(index);

  bool isProductInCart(int productId) {
    return cartItems.any((item) => item.product.id == productId);
  }
}

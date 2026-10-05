import 'dart:convert';
import 'package:get/get.dart';
import 'package:dio/dio.dart' as dio;
import 'package:logger/logger.dart';
import 'package:ecomapp/data/models/order_model.dart';


import 'package:ecomapp/data/models/cart_item_model.dart';
import 'package:ecomapp/core/network/api_client.dart';
import 'package:ecomapp/core/network/api_endpoints.dart';
import 'package:ecomapp/presentation/controllers/base_controller.dart';
import 'package:ecomapp/presentation/controllers/notification_controller.dart';
import 'package:shared_preferences/shared_preferences.dart';

class OrderController extends BaseController {
  final ApiClient apiClient;
  OrderController({required this.apiClient});

  final orders = <OrderModel>[].obs;
  final filteredOrders = <OrderModel>[].obs;
  final currentTab = 0.obs;

  @override
  void onInit() {
    super.onInit();
    fetchOrders();
  }

  Future<void> fetchOrders() async {
    // Skip silently if user is not logged in (e.g. during logout)
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    if (token == null || token.isEmpty) return;

    showLoading();
    try {
      final response = await apiClient.getData(ApiEndpoints.orders);
      if (response.data['status'] == 'success') {
        orders.assignAll(
          (response.data['data'] as List).map((o) {
            return OrderModel.fromJson(Map<String, dynamic>.from(o as Map));
          }).toList(),
        );
        filterByTab(currentTab.value);
      }

    } catch (e) {
      showError('Failed to load orders');
    } finally {
      hideLoading();
    }
  }

  Future<bool> placeOrder({
    required double total,
    required List<CartItemModel> items,
    required String address,
    String paymentMethod = 'Cash on Delivery',
    String? receiptPath,
  }) async {
    showLoading();
    Logger().i(
      'Placing order: total=$total, address=$address, method=$paymentMethod, item_count=${items.length}',
    );
    try {
      final itemsJson = items
          .map(
            (item) => {
              'product_id': item.product.id,
              'quantity': item.quantity,
              'price':
                  (item.product.discountPrice != null &&
                      item.product.discountPrice! > 0)
                  ? item.product.discountPrice
                  : item.product.price,
            },
          )
          .toList();

      dynamic data;
      if (receiptPath != null) {
        data = dio.FormData.fromMap({
          'total': total,
          'address': address,
          'payment_method': paymentMethod,
          'items': jsonEncode(itemsJson),
          'receipt': await dio.MultipartFile.fromFile(receiptPath),
        });
      } else {
        data = {
          'total': total,
          'address': address,
          'payment_method': paymentMethod,
          'items': itemsJson,
        };
      }

      final response = await apiClient.postData(ApiEndpoints.orders, data);

      Logger().d('Order Response: ${response.data}');
      if (response.data['status'] == 'success') {
        try {
          await fetchOrders();
          final notifyCtrl = Get.find<NotificationController>();
          await notifyCtrl.fetchNotifications();
        } catch (_) {}
        Get.snackbar('Success', 'Order placed successfully');
        return true;
      } else {
        final msg = response.data['message'] ?? 'Failed to place order';
        showError(msg);
        Get.snackbar('Error', msg);
        return false;
      }
    } catch (e) {
      Logger().e('Place Order Error: $e');
      showError('Failed to place order: $e');
      Get.snackbar('Error', 'Failed to place order: $e');
      return false;
    } finally {
      hideLoading();
    }
  }



  Future<bool> cancelOrder(String orderId, String reason) async {
    showLoading();
    try {
      final response = await apiClient.postData(ApiEndpoints.cancelOrder, {
        'order_id': orderId,
        'reason': reason,
      });

      if (response.data['status'] == 'success') {
        await fetchOrders();
        Get.snackbar('Success', 'Order cancelled successfully');
        return true;
      } else {
        showError(response.data['message'] ?? 'Failed to cancel order');
        return false;
      }
    } catch (e) {
      showError('Error cancelling order: $e');
      return false;
    } finally {
      hideLoading();
    }
  }

  Future<bool> requestReturn(String orderId, String reason) async {
    showLoading();
    try {
      final response = await apiClient.postData('/api/return_order.php', {
        'order_id': orderId,
        'reason': reason,
      });

      if (response.data['status'] == 'success') {
        await fetchOrders();
        Get.snackbar('Success', 'Return requested successfully');
        return true;
      } else {
        showError(response.data['message'] ?? 'Failed to request return');
        return false;
      }
    } catch (e) {
      showError('Error requesting return: $e');
      return false;
    } finally {
      hideLoading();
    }
  }

  void filterByTab(int index) {
    currentTab.value = index;
    if (index == 0) {
      // Processing / Pending
      filteredOrders.assignAll(
        orders.where((o) => 
          o.status.toUpperCase() == 'PROCESSING' || 
          o.status.toUpperCase() == 'PENDING'
        ),
      );
    } else if (index == 1) {
      // Shipped / In Transit / Confirmed
      filteredOrders.assignAll(
        orders.where((o) => 
          o.status.toUpperCase() == 'IN TRANSIT' || 
          o.status.toUpperCase() == 'SHIPPED' ||
          o.status.toUpperCase() == 'CONFIRMED'
        ),
      );
    } else if (index == 2) {
      // Delivered
      filteredOrders.assignAll(
        orders.where((o) => 
          o.status.toUpperCase() == 'DELIVERED' || 
          o.status.toUpperCase() == 'COMPLETED'
        ),
      );
    } else if (index == 3) {
      // Cancelled / Returns
      filteredOrders.assignAll(
        orders.where((o) => 
          o.status.toUpperCase() == 'CANCELLED' || 
          o.status.toUpperCase() == 'RETURN REQUESTED'
        ),
      );
    } else if (index == 4) {
      // All Orders
      filteredOrders.assignAll(orders);
    }
  }
}


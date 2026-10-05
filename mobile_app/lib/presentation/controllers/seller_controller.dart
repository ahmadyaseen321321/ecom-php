import 'dart:io';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart' as dio;
import 'package:csv/csv.dart';
import 'package:path_provider/path_provider.dart';
import 'package:ecomapp/core/network/api_client.dart';
import 'package:ecomapp/data/models/product_model.dart';
import 'package:ecomapp/data/models/seller_order_model.dart';
import 'package:ecomapp/data/models/seller_review_model.dart';
import 'base_controller.dart';

class ColorVariant {
  final String colorName;
  File? image;
  ColorVariant({required this.colorName, this.image});
}

class ChartDataPoint {
  final String label;
  final double value;

  ChartDataPoint({required this.label, required this.value});

  factory ChartDataPoint.fromJson(Map<String, dynamic> json) {
    return ChartDataPoint(
      label: json['label'] ?? '',
      value: (json['value'] as num).toDouble(),
    );
  }
}

class SellerStatsModel {
  final double totalSales;
  final double prevTotalSales;
  final double salesPercentage;
  final int orderCount;
  final double ordersPercentage;
  final int productCount;
  final double avgRating;
  final int pendingCount;
  final int pendingFeedbackCount;
  final int confirmedCount;
  final int shippedCount;
  final int deliveredCount;
  final int returnedCount;
  final int cancelledCount;
  final List<ChartDataPoint> chartData;


  SellerStatsModel({
    required this.totalSales,
    required this.prevTotalSales,
    required this.salesPercentage,
    required this.orderCount,
    required this.ordersPercentage,
    required this.productCount,
    required this.avgRating,
    required this.pendingCount,
    required this.pendingFeedbackCount,
    required this.confirmedCount,
    required this.shippedCount,
    required this.deliveredCount,
    required this.returnedCount,
    required this.cancelledCount,
    required this.chartData,
  });

  factory SellerStatsModel.fromJson(Map<String, dynamic> json) {
    return SellerStatsModel(
      totalSales: (json['total_sales'] as num).toDouble(),
      prevTotalSales: (json['prev_total_sales'] as num?)?.toDouble() ?? 0.0,
      salesPercentage: (json['sales_percentage'] as num?)?.toDouble() ?? 0.0,
      orderCount: (json['order_count'] as num).toInt(),
      ordersPercentage: (json['orders_percentage'] as num?)?.toDouble() ?? 0.0,
      productCount: (json['product_count'] as num).toInt(),
      avgRating: (json['avg_rating'] as num).toDouble(),
      pendingCount: (json['pending_count'] as num).toInt(),
      pendingFeedbackCount:
          (json['pending_feedback_count'] as num?)?.toInt() ?? 0,
      confirmedCount: (json['confirmed_count'] as num).toInt(),
      shippedCount: (json['shipped_count'] as num).toInt(),
      deliveredCount: (json['delivered_count'] as num).toInt(),
      returnedCount: (json['returned_count'] as num).toInt(),
      cancelledCount: (json['cancelled_count'] as num?)?.toInt() ?? 0,
      chartData: json['chart_data'] != null

          ? (json['chart_data'] as List)
                .map((i) => ChartDataPoint.fromJson(i))
                .toList()
          : [],
    );
  }
}

class SellerController extends BaseController {
  final ApiClient apiClient;
  SellerController({required this.apiClient});

  final Rxn<SellerStatsModel> stats = Rxn<SellerStatsModel>();
  final RxList<ProductModel> myProducts = <ProductModel>[].obs;
  final RxList<SellerOrderModel> sellerOrders = <SellerOrderModel>[].obs;
  final RxList<SellerOrderModel> analyticsOrders = <SellerOrderModel>[].obs;
  final RxList<SellerReviewModel> sellerReviews = <SellerReviewModel>[].obs;
  final RxInt debugSellerId = 0.obs;
  final RxInt totalReviewsInDb = 0.obs;
  final RxList<int> sellerProductIds = <int>[].obs;
  final RxString diagProd331Owner = ''.obs;
  final RxString diagRev48Pid = ''.obs;
  final RxString searchQuery = ''.obs;
  final RxBool showLowStockOnly = false.obs;
  final RxInt selectedSalesTimeframe = 30.obs;
  final RxInt selectedDashboardTimeframe = 30.obs;
  final RxString selectedReviewFilter = 'All'.obs;

  List<SellerReviewModel> get filteredReviews {
    switch (selectedReviewFilter.value) {
      case 'Pending':
        return sellerReviews.where((r) => r.reply == null || r.reply!.isEmpty).toList();
      case 'Completed':
        return sellerReviews.where((r) => r.reply != null && r.reply!.isNotEmpty).toList();
      case 'Critical':
        return sellerReviews.where((r) => r.rating <= 2).toList();
      default:
        return sellerReviews;
    }
  }

  List<SellerOrderModel> get recentDeliveredOrders =>
      sellerOrders.where((o) => o.status.toLowerCase() == 'delivered').toList();

  double get dashboardTotalRevenue => recentDeliveredOrders.fold(
    0.0,
    (sum, order) => sum + order.total,
  );

  // Product Add State
  final RxList<File> selectedImages = <File>[].obs;
  final RxList<ColorVariant> colorVariants = <ColorVariant>[
    ColorVariant(colorName: 'White'),
  ].obs;
  final ImagePicker _picker = ImagePicker();

  List<ProductModel> get filteredProducts {
    List<ProductModel> products = myProducts.toList();

    if (searchQuery.isNotEmpty) {
      final query = searchQuery.value.toLowerCase();
      products = products
          .where(
            (p) =>
                p.name.toLowerCase().contains(query) ||
                p.description.toLowerCase().contains(query),
          )
          .toList();
    }

    if (showLowStockOnly.value) {
      products = products.where((p) => p.stock < 5).toList();
    }

    return products;
  }

  int get lowStockCount => myProducts.where((p) => p.stock < 5).length;

  @override
  void onInit() {
    super.onInit();
    fetchStats(days: selectedDashboardTimeframe.value);
    fetchMyProducts();
    fetchSellerOrders(days: selectedDashboardTimeframe.value);
    fetchSellerReviews();
  }

  Future<void> fetchStats({int? days}) async {
    showLoading();
    try {
      final timeframe = days ?? selectedSalesTimeframe.value;
      final response = await apiClient.getData(
        '/api/seller_stats.php?days=$timeframe',
      );
      if (response.data['status'] == 'success') {
        stats.value = SellerStatsModel.fromJson(response.data['data']);
        selectedSalesTimeframe.value = timeframe;
      }
    } catch (e) {
      showError('Failed to load stats');
    } finally {
      hideLoading();
    }
  }

  Future<void> fetchMyProducts() async {
    try {
      // Reusing products.php with seller_id parameter if implemented,
      // or a new seller_products.php
      final response = await apiClient.getData(
        '/api/products.php?seller_id=current',
      );
      if (response.statusCode == 200) {
        final List items = response.data is List
            ? response.data
            : (response.data['data'] ?? []);

        // Final sanity check for product 334 in the list
        for (var item in items) {
          if (item['id'].toString() == '334') {
            Logger().i(
              "DEBUG_IMAGE: Controller received product 334. Images: ${item['all_images']}",
            );
            Logger().i(
              "DEBUG_IMAGE: Controller received product 334. Count from base: ${item['image_count']}",
            );
          }
        }

        myProducts.assignAll(
          items.map((item) => ProductModel.fromJson(item)).toList(),
        );
      }
    } catch (e) {
      Logger().e('Error fetching seller products: $e');
    }
  }

  Future<void> fetchSellerOrders({String? status, int? days}) async {
    showLoading();
    try {
      String path = '/api/seller_orders.php';
      Map<String, dynamic> query = {};
      if (status != null) query['status'] = status;
      if (days != null) query['days'] = days;

      if (query.isNotEmpty) {
        path += '?' + query.entries.map((e) => '${e.key}=${e.value}').join('&');
      }

      final response = await apiClient.getData(path);
      if (response.statusCode == 200 && response.data['status'] == 'success') {
        final List items = response.data['data'] ?? [];
        final orders = items
            .map((item) => SellerOrderModel.fromJson(item))
            .toList();

        // Safety filter: ensure we only keep orders matching the requested status if one was provided
        final filteredOrders = status != null 
            ? orders.where((o) => o.status.toLowerCase() == status.toLowerCase()).toList()
            : orders;

        if (status == 'delivered' && days != null) {
          analyticsOrders.assignAll(filteredOrders);
        } else {
          sellerOrders.assignAll(filteredOrders);
        }
      }
    } catch (e) {
      Logger().e('Error fetching seller orders: $e');
    } finally {
      hideLoading();
    }
  }

  Future<void> exportToCSV() async {
    try {
      if (analyticsOrders.isEmpty) {
        Get.snackbar('Error', 'No data to export');
        return;
      }

      List<List<dynamic>> rows = [];
      // Header
      rows.add([
        "Order ID",
        "Date",
        "Customer Name",
        "Products",
        "Total Amount",
        "Status",
        "Shipping Address",
      ]);

      // Data
      for (var order in analyticsOrders) {
        rows.add([
          order.id,
          order.date,
          order.customerName,
          order.productSummary,
          order.total.toStringAsFixed(0),
          order.status,
          order.shippingAddress,
        ]);
      }

      String csvData = const ListToCsvConverter().convert(rows);
      final directory = await getApplicationDocumentsDirectory();
      final path = "${directory.path}/delivered_orders_report.csv";
      final file = File(path);
      await file.writeAsString(csvData);

      Get.snackbar(
        'Success',
        'Report exported to Documents folder',
        backgroundColor: Colors.green,
        colorText: Colors.white,
        mainButton: TextButton(
          onPressed: () {
            // In a real device you'd use share_plus or open_filex
          },
          child: const Text('OK', style: TextStyle(color: Colors.white)),
        ),
      );
    } catch (e) {
      showError('Export failed: $e');
    }
  }

  Future<void> fetchSellerReviews() async {
    try {
      const String reviewsPath = '/api/seller_reviews.php';
      final response = await apiClient.getData(reviewsPath);
      if (response.statusCode == 200 && response.data['status'] == 'success') {
        debugSellerId.value = response.data['debug_seller_id'] ?? 0;
        totalReviewsInDb.value = response.data['total_reviews_in_db'] ?? 0;
        final List ids = response.data['seller_product_ids'] ?? [];
        sellerProductIds.assignAll(ids.cast<int>());
        
        diagProd331Owner.value = (response.data['diag_prod_331_owner'] ?? 'N/A').toString();
        diagRev48Pid.value = (response.data['diag_rev_48_pid'] ?? 'N/A').toString();
        
        final List items = response.data['data'] ?? [];
        sellerReviews.assignAll(
          items.map((item) => SellerReviewModel.fromJson(item)).toList(),
        );
      }
    } catch (e) {
      Logger().e('Error fetching seller reviews: $e');
    }
  }

  Future<void> replyToReview(int reviewId, String reply) async {
    try {
      final response = await apiClient.postData('/api/seller_reviews.php', {
        'review_id': reviewId,
        'reply': reply,
      });

      if (response.data['status'] == 'success') {
        // Refresh reviews list
        final reviewsResponse = await apiClient.getData(
          '/api/seller_reviews.php',
        );
        if (reviewsResponse.statusCode == 200 &&
            reviewsResponse.data['status'] == 'success') {
          final List items = reviewsResponse.data['data'] ?? [];
          sellerReviews.clear();
          sellerReviews.addAll(
            items.map((item) => SellerReviewModel.fromJson(item)).toList(),
          );
        }

        // Refresh stats silently (without showLoading)
        try {
          final statsResponse = await apiClient.getData(
            '/api/seller_stats.php',
          );
          if (statsResponse.data['status'] == 'success') {
            stats.value = SellerStatsModel.fromJson(statsResponse.data['data']);
          }
        } catch (_) {}

        Get.snackbar(
          'Success',
          'Reply posted successfully',
          backgroundColor: const Color(0xFFE8F5E9),
          colorText: const Color(0xFF2E7D32),
          snackPosition: SnackPosition.BOTTOM,
        );
      } else {
        showError(response.data['message'] ?? 'Failed to post reply');
      }
    } catch (e) {
      showError('Error posting reply: $e');
    }
  }

  Future<void> updateOrderStatus(String orderId, String status, {String? reason, bool verifyPayment = false, bool goBack = true}) async {
    showLoading();
    try {
      Map<String, dynamic> body = {
        'order_id': orderId,
        'status': status,
      };
      if (reason != null) body['reason'] = reason;
      if (verifyPayment) body['verify_payment'] = true;

      final response = await apiClient.putData('/api/seller_orders.php', body);

      if (response.data['status'] == 'success') {
        await fetchSellerOrders();
        await fetchStats();
        if (goBack) Get.back();
        Get.snackbar(
          'Success',
          'Order status updated to $status',
          backgroundColor: const Color(0xFFE8F5E9),
          colorText: const Color(0xFF2E7D32),
          snackPosition: SnackPosition.BOTTOM,
        );
      } else {
        showError(response.data?['message'] ?? 'Unable to update order status');
      }
    } catch (e) {
      if (e is dio.DioException) {
        final serverMessage = e.response?.data is Map
            ? e.response?.data['message']
            : null;
        showError(serverMessage?.toString() ?? 'Update failed: ${e.message}');
      } else {
        showError('Request error: $e');
      }
    } finally {
      hideLoading();
    }
  }


  Future<void> deleteProduct(int productId) async {
    showLoading();
    try {
      final response = await apiClient.deleteData(
        '/api/products.php?id=$productId',
      );
      if (response.data['status'] == 'success') {
        fetchMyProducts();
        fetchStats();
        Get.back();
        Get.snackbar(
          'Success',
          'Product deleted successfully',
          backgroundColor: const Color(0xFFE8F5E9),
          colorText: const Color(0xFF2E7D32),
          snackPosition: SnackPosition.BOTTOM,
        );
      }
    } catch (e) {
      showError('Failed to delete product');
    } finally {
      hideLoading();
    }
  }

  Future<void> pickProductImages(ImageSource source) async {
    if (selectedImages.length >= 10) {
      Get.snackbar(
        'Limit Reached',
        'Maximum 10 images allowed',
        backgroundColor: Colors.orange,
        colorText: Colors.white,
      );
      return;
    }

    try {
      if (source == ImageSource.gallery) {
        final List<XFile> pickedFiles = await _picker.pickMultiImage();
        if (pickedFiles.isNotEmpty) {
          final remaining = 10 - selectedImages.length;
          final toAdd = pickedFiles
              .take(remaining)
              .map((x) => File(x.path))
              .toList();
          selectedImages.addAll(toAdd);
        }
      } else {
        final XFile? file = await _picker.pickImage(source: ImageSource.camera);
        if (file != null) {
          selectedImages.add(File(file.path));
        }
      }
    } catch (e) {
      Logger().e('Error picking images: $e');
    }
  }

  Future<void> pickVariantImage(int index, ImageSource source) async {
    try {
      final XFile? file = await _picker.pickImage(source: source);
      if (file != null) {
        colorVariants[index].image = File(file.path);
        colorVariants.refresh();
      }
    } catch (e) {
      Logger().e('Error picking variant image: $e');
    }
  }

  void addColorVariant() {
    colorVariants.add(ColorVariant(colorName: ''));
  }

  void removeColorVariant(int index) {
    if (index == 0) return; // Cannot remove default White
    colorVariants.removeAt(index);
  }

  void updateColorName(int index, String name) {
    colorVariants[index] = ColorVariant(
      colorName: name,
      image: colorVariants[index].image,
    );
  }

  void clearAddProductData() {
    selectedImages.clear();
    colorVariants.assignAll([ColorVariant(colorName: 'White')]);
  }

  Future<void> addProduct({
    required String name,
    required String description,
    required double price,
    required double? discountPrice,
    required int stock,
    required int categoryId,
  }) async {
    if (selectedImages.length < 3) {
      Get.snackbar(
        'Minimum Images',
        'Please upload at least 3 images',
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
      return;
    }

    // Validate color variants
    for (int i = 0; i < colorVariants.length; i++) {
      if (colorVariants[i].colorName.isEmpty && i > 0) {
        Get.snackbar(
          'Missing Info',
          'Please enter color name for variant ${i + 1}',
        );
        return;
      }
      if (i > 0 && colorVariants[i].image == null) {
        Get.snackbar(
          'Missing Image',
          'Each additional color requires an image',
        );
        return;
      }
    }

    showLoading();
    try {
      final List<Map<String, dynamic>> variantData = colorVariants.map((v) {
        return {'name': v.colorName, 'has_image': v.image != null};
      }).toList();

      final Map<String, dynamic> data = {
        'source': 'add',
        'name': name,
        'description': description,
        'price': price.toString(),
        'discount_price': discountPrice?.toString() ?? '',
        'stock': stock.toString(),
        'category_id': categoryId.toString(),
        'variants': json.encode(variantData),
      };

      final dio.FormData formData = dio.FormData.fromMap(data);

      // Add general images
      for (int i = 0; i < selectedImages.length; i++) {
        formData.files.add(
          MapEntry(
            'images[]',
            await dio.MultipartFile.fromFile(
              selectedImages[i].path,
              filename: 'prod_$i.jpg',
            ),
          ),
        );
      }

      // Add variant images
      for (int i = 0; i < colorVariants.length; i++) {
        if (colorVariants[i].image != null) {
          formData.files.add(
            MapEntry(
              'variant_images[]',
              await dio.MultipartFile.fromFile(
                colorVariants[i].image!.path,
                filename: 'var_$i.jpg',
              ),
            ),
          );
        }
      }

      final response = await apiClient.postData('/api/products.php', formData);
      if (response.data['status'] == 'success') {
        fetchMyProducts();
        fetchStats();
        clearAddProductData();
        Get.back();
        Get.snackbar(
          'Success',
          'Product published successfully',
          backgroundColor: const Color(0xFFE8F5E9),
          colorText: const Color(0xFF2E7D32),
        );
      } else {
        showError(response.data['message'] ?? 'Failed to add product');
      }
    } catch (e) {
      showError('System Error: $e');
    } finally {
      hideLoading();
    }
  }

  /// Sends only [changes] keys to the API (PATCH-style) using FormData and POST method spoofing.
  Future<void> updateProduct({
    required int id,
    required Map<String, dynamic> changes,
  }) async {
    // images_data is always present; check for meaningful changes beyond just that
    final nonImageChanges = Map.from(changes)..remove('images_data');
    if (nonImageChanges.isEmpty && !changes.containsKey('images_data')) {
      Get.snackbar(
        'No changes',
        'Nothing to update',
        backgroundColor: Colors.orange,
        colorText: Colors.white,
        snackPosition: SnackPosition.BOTTOM,
      );
      return;
    }
    showLoading();
    try {
      final Map<String, dynamic> data = {
        ...changes,
        'id': id,
        '_method': 'PUT',
      };

      // Process images if present
      if (data.containsKey('images_data')) {
        final List<dynamic> images = data.remove('images_data');
        final List<String> existingImages = [];
        final List<File> newImages = [];

        for (var img in images) {
          if (img is String) {
            existingImages.add(img);
          } else if (img is File) {
            newImages.add(img);
          }
        }

        data['existing_images'] = json.encode(existingImages);

        final dio.FormData formData = dio.FormData.fromMap(data);

        // Add new images to FormData
        for (int i = 0; i < newImages.length; i++) {
          formData.files.add(
            MapEntry(
              'new_images[]',
              await dio.MultipartFile.fromFile(
                newImages[i].path,
                filename: 'update_prod_$i.jpg',
              ),
            ),
          );
        }

        final response = await apiClient.postData(
          '/api/products.php',
          formData,
        );
        _handleUpdateResponse(response);
      } else {
        // Standard non-image update
        final formData = dio.FormData.fromMap(data);
        final response = await apiClient.postData(
          '/api/products.php',
          formData,
        );
        _handleUpdateResponse(response);
      }
    } catch (e) {
      _handleUpdateError(e);
    } finally {
      hideLoading();
    }
  }

  void _handleUpdateResponse(dio.Response response) {
    if (response.data != null && response.data['status'] == 'success') {
      fetchMyProducts();
      fetchStats();
      Get.back();
      Get.snackbar(
        'Success',
        response.data['message'] ?? 'Product updated',
        backgroundColor: const Color(0xFFE8F5E9),
        colorText: const Color(0xFF2E7D32),
        snackPosition: SnackPosition.BOTTOM,
      );
    } else {
      showError(response.data?['message'] ?? 'Unable to update product');
    }
  }

  void _handleUpdateError(dynamic e) {
    if (e is dio.DioException) {
      final serverMessage = e.response?.data is Map
          ? e.response?.data['message']
          : null;
      showError(serverMessage?.toString() ?? 'Update failed: ${e.message}');
    } else {
      showError('Update failed: $e');
    }
  }
}

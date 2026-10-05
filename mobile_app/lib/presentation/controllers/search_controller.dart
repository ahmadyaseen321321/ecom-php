import 'dart:async';

import 'package:get/get.dart';
import '../../data/models/product_model.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_endpoints.dart';
import 'base_controller.dart';

class SearchController extends BaseController {
  final ApiClient apiClient;
  SearchController({required this.apiClient});

  final RxString searchQuery = ''.obs;
  final RxList<ProductModel> searchResults = <ProductModel>[].obs;
  final RxList<ProductModel> filteredResults = <ProductModel>[].obs;

  // Filters
  final RxnInt selectedCategoryId = RxnInt();
  final RxDouble minPrice = 0.0.obs;
  final RxDouble maxPrice = 10000.0.obs;
  final RxDouble minRating = 0.0.obs;

  Timer? _searchDebounce;

  @override
  void onClose() {
    _searchDebounce?.cancel();
    super.onClose();
  }

  void onSearchChanged(String query) {
    searchQuery.value = query;
    _searchDebounce?.cancel();
    final q = query.trim();
    if (q.isEmpty) {
      searchResults.clear();
      filteredResults.clear();
      return;
    }
    _searchDebounce = Timer(const Duration(milliseconds: 350), () {
      searchProducts(q);
    });
  }

  Future<void> searchProducts(String query) async {
    final q = query.trim();
    if (q.isEmpty) {
      searchResults.clear();
      filteredResults.clear();
      return;
    }
    showLoading();
    try {
      final encoded = Uri.encodeQueryComponent(q);
      final response = await apiClient.getData(
        '${ApiEndpoints.products}?search=$encoded',
      );
      final body = response.data;
      if (body is Map && body['status'] == 'success') {
        final raw = body['data'];
        if (raw is List) {
          final results = raw
              .map((item) => ProductModel.fromJson(item as Map<String, dynamic>))
              .toList();
          searchResults.assignAll(results);
          applyFilters();
        } else {
          searchResults.clear();
          filteredResults.clear();
        }
      }
    } catch (e) {
      showError('Search failed');
    } finally {
      hideLoading();
    }
  }

  void applyFilters() {
    var results = searchResults.toList();

    if (selectedCategoryId.value != null) {
      results = results
          .where((p) => p.categoryId == selectedCategoryId.value)
          .toList();
    }

    results = results
        .where((p) => p.price >= minPrice.value && p.price <= maxPrice.value)
        .toList();
    results = results.where((p) => p.rating >= minRating.value).toList();

    filteredResults.assignAll(results);
  }

  void resetFilters() {
    selectedCategoryId.value = null;
    minPrice.value = 0.0;
    maxPrice.value = 10000.0;
    minRating.value = 0.0;
    applyFilters();
  }
}

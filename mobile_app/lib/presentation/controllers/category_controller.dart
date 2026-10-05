import 'package:get/get.dart';
import 'package:ecomapp/data/models/product_model.dart';
import 'package:ecomapp/data/models/category_model.dart';
import 'package:ecomapp/core/network/api_client.dart';
import 'package:ecomapp/core/network/api_endpoints.dart';
import 'package:ecomapp/presentation/controllers/base_controller.dart';

class CategoryController extends BaseController {
  final ApiClient apiClient;
  CategoryController({required this.apiClient});

  final allCategories = <CategoryModel>[].obs;
  final categoryProducts = <ProductModel>[].obs;
  final currentCategory = Rxn<CategoryModel>();

  // Filter States
  final searchQuery = ''.obs;
  final currentSort = 'newest'.obs;
  final minPrice = Rxn<double>();
  final maxPrice = Rxn<double>();
  final minRating = Rxn<double>();

  void clearFilters() {
    searchQuery.value = '';
    currentSort.value = 'newest';
    minPrice.value = null;
    maxPrice.value = null;
    minRating.value = null;
  }

  void applyFilters(int categoryId) {
    fetchCategoryProducts(categoryId);
  }

  @override
  void onInit() {
    super.onInit();
    fetchAllCategories();
  }

  Future<void> fetchAllCategories() async {
    showLoading();
    try {
      final response = await apiClient.getData(ApiEndpoints.categories);
      final body = response.data;
      if (body is Map && body['status'] == 'success' && body['data'] is List) {
        final list = body['data'] as List;
        allCategories.assignAll(
          list.map((item) {
            final map = Map<String, dynamic>.from(item as Map);
            return CategoryModel.fromJson(map);
          }).toList(),
        );
      }
    } catch (e) {
      showError('Failed to load categories');
    } finally {
      hideLoading();
    }
  }

  Future<void> fetchCategoryProducts(int categoryId) async {
    showLoading();
    categoryProducts.clear();
    try {
      String url = '${ApiEndpoints.products}?category_id=$categoryId';
      
      if (searchQuery.value.isNotEmpty) {
        url += '&search=${Uri.encodeComponent(searchQuery.value)}';
      }
      if (minPrice.value != null) url += '&min_price=${minPrice.value}';
      if (maxPrice.value != null) url += '&max_price=${maxPrice.value}';
      if (minRating.value != null) url += '&min_rating=${minRating.value}';
      if (currentSort.value != 'newest') url += '&sort=${currentSort.value}';

      final response = await apiClient.getData(url);
      if (response.data['status'] == 'success') {
        categoryProducts.assignAll(
          (response.data['data'] as List)
              .map((item) => ProductModel.fromJson(item))
              .toList(),
        );
      }
    } catch (e) {
      showError('Failed to load products');
    } finally {
      hideLoading();
    }
  }
}

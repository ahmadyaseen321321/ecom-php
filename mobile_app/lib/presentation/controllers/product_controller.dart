import 'package:get/get.dart';
import 'package:logger/logger.dart';
import 'package:ecomapp/core/network/api_client.dart';
import 'package:ecomapp/data/models/product_model.dart';
import 'package:ecomapp/data/models/review_model.dart';
import 'package:ecomapp/core/network/api_endpoints.dart';
import 'package:ecomapp/presentation/controllers/base_controller.dart';

class ProductController extends BaseController {
  final ApiClient apiClient;
  ProductController({required this.apiClient});

  final product = Rxn<ProductModel>();
  final reviews = <ReviewModel>[].obs;
  final selectedColor = 0.obs;

  Future<void> fetchProductDetails(int productId) async {
    selectedColor.value = 0;
    reviews.clear();
    showLoading();
    try {
      Logger().i('Fetching reviews for Product ID: $productId');
      final response = await apiClient.getData(
        '${ApiEndpoints.reviews}?product_id=$productId',
      );
      Logger().d('Reviews API Response: ${response.data}');
      
      if (response.data['status'] == 'success') {
        final List data = response.data['data'] ?? [];
        reviews.assignAll(
          data.map((item) => ReviewModel.fromJson(item)).toList(),
        );
        Logger().i('Loaded ${reviews.length} reviews');
      }
    } catch (e) {
      Logger().e('Fetch Reviews Error: $e');
      showError('Failed to load reviews');
    } finally {
      hideLoading();
    }
  }

  void changeColor(int index) => selectedColor.value = index;
}

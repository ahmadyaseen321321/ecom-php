import 'package:get/get.dart';
import 'package:logger/logger.dart';
import 'package:ecomapp/data/models/product_model.dart';
import 'package:ecomapp/data/models/category_model.dart';
import 'package:ecomapp/core/network/api_client.dart';
import 'package:ecomapp/core/network/api_endpoints.dart';
import 'package:ecomapp/presentation/controllers/base_controller.dart';
import 'package:ecomapp/data/models/banner_model.dart';
import 'dart:async';

class HomeController extends BaseController {
  final ApiClient apiClient;
  HomeController({required this.apiClient});

  final categories = <CategoryModel>[].obs;
  final featuredProducts = <ProductModel>[].obs;
  final newArrivals = <ProductModel>[].obs;
  final allProducts = <ProductModel>[].obs;
  final banners = <BannerModel>[].obs;

  final timerSeconds = (2 * 60 * 60).obs; // 2 hours
  Timer? _timer;

  @override
  void onInit() {
    super.onInit();
    fetchHomeData();
    startTimer();
  }

  @override
  void onClose() {
    _timer?.cancel();
    super.onClose();
  }

  void startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (timerSeconds.value > 0) {
        timerSeconds.value--;
        if (timerSeconds.value % 60 == 0) {
          // Timer tick active
        }
      } else {
        // Reset to 2 hours when it ends
        timerSeconds.value = 2 * 60 * 60;
      }
    });
  }

  Future<void> fetchHomeData() async {
    showLoading();
    try {
      await Future.wait([
        _fetchBanners(),
        _fetchCategories(),
        _fetchProducts(),
      ]);
    } catch (e, stack) {
      Logger().e('Home Data Fatal Error: $e');
      Logger().e('Stack trace: $stack');
      showError('Failed to load home data');
    } finally {
      hideLoading();
    }
  }

  Future<void> _fetchBanners() async {
    try {
      final bannerResponse = await apiClient.getData(ApiEndpoints.banners);
      if (bannerResponse.data != null &&
          bannerResponse.data['status'] == 'success') {
        final List bannerData = bannerResponse.data['data'];
        banners.assignAll(
          bannerData.map((e) => BannerModel.fromJson(e)).toList(),
        );
        Logger().i('Banners Loaded: ${banners.length}');
      } else {
        Logger().w('Banners API returned status: ${bannerResponse.data?['status']}');
      }
    } catch (e) {
      Logger().e('Error fetching banners: $e');
    }
  }

  Future<void> _fetchCategories() async {
    try {
      final categoryResponse = await apiClient.getData(ApiEndpoints.categories);
      if (categoryResponse.data != null &&
          categoryResponse.data['status'] == 'success') {
        categories.assignAll(
          (categoryResponse.data['data'] as List)
              .map((item) => CategoryModel.fromJson(item))
              .toList(),
        );
        Logger().i('Categories Loaded: ${categories.length}');
      } else {
        Logger().w('Categories API returned status: ${categoryResponse.data?['status']}');
      }
    } catch (e) {
      Logger().e('Error fetching categories: $e');
    }
  }

  Future<void> _fetchProducts() async {
    try {
      final productResponse = await apiClient.getData(ApiEndpoints.products);
      if (productResponse.data != null &&
          productResponse.data['status'] == 'success' &&
          productResponse.data['data'] != null) {
        final List dataList = productResponse.data['data'] as List;
        final productsList = dataList
            .map((item) => ProductModel.fromJson(item))
            .toList();
        Logger().i('Parsed Products: ${productsList.length}');

        allProducts.assignAll(productsList);
        featuredProducts.assignAll(productsList.take(4).toList());
        newArrivals.assignAll(productsList.reversed.take(4).toList());
      } else {
        Logger().w('Product API returned unexpected format or empty data');
      }
    } catch (e) {
      Logger().e('Error fetching products: $e');
    }
  }
}

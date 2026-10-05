import 'package:get/get.dart';
import 'package:ecomapp/presentation/controllers/home_controller.dart';
import '../../core/network/api_client.dart';

class HomeBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut(() => HomeController(apiClient: Get.find<ApiClient>()));
  }
}

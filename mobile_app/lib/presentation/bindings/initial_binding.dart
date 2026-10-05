import 'package:get/get.dart';
import '../../core/network/api_client.dart';
import '../controllers/category_controller.dart';
import '../controllers/main_controller.dart';
import '../controllers/cart_controller.dart';
import '../controllers/notification_controller.dart';
import '../controllers/order_controller.dart';
import '../controllers/product_controller.dart';
import '../controllers/search_controller.dart' as app_search;
import '../controllers/wishlist_controller.dart';
import '../controllers/support_controller.dart';
import '../controllers/auth_controller.dart';
import '../controllers/address_controller.dart';
import '../controllers/card_controller.dart';
import '../controllers/profile_controller.dart';
import '../controllers/chat_controller.dart';

class InitialBinding extends Bindings {
  @override
  void dependencies() {
    final apiClient = Get.put(ApiClient(), permanent: true);
    Get.put(NotificationController(), permanent: true);

    Get.put(AuthController(apiClient: apiClient), permanent: true);
    Get.put(MainController(), permanent: true);
    // HomeController is registered in HomeBinding when opening /main.
    Get.put(CategoryController(apiClient: apiClient), permanent: true);
    Get.put(CartController(apiClient: apiClient), permanent: true);
    Get.lazyPut(() => OrderController(apiClient: apiClient), fenix: true);
    // fenix: true ensures it can be re-created if disposed after pop.
    Get.lazyPut(() => ProductController(apiClient: apiClient), fenix: true);
    Get.lazyPut(
      () => app_search.SearchController(apiClient: apiClient),
      fenix: true,
    );
    Get.put(WishlistController(apiClient: apiClient), permanent: true);
    Get.put(AddressController(apiClient: apiClient), permanent: true);
    Get.put(CardController(apiClient: apiClient), permanent: true);
    Get.put(ProfileController(apiClient: apiClient), permanent: true);
    Get.lazyPut(() => SupportController(apiClient: apiClient));
    Get.lazyPut(() => ChatController(apiClient: apiClient), fenix: true);
  }
}

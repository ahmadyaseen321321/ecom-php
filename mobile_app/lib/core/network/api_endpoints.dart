class ApiEndpoints {
  // Local PC Wi-Fi IP (for physical phone on same Wi-Fi):
  static const String baseUrl = "http://192.168.100.206/ecom_api";
  // Android Emulator (mapped to local PC):
  // static const String baseUrl = "http://10.0.2.2/ecom_api";
  // Live Cloud Server:
  // static const String baseUrl = "http://sansuielectronics.store/ecom_api";

  // Auth
  static const String login = "/auth/login.php";
  static const String register = "/auth/register.php";
  static const String logout = "/auth/logout.php";
  static const String socialLogin = "/auth/social_login.php";
  static const String categories = "/api/categories.php";
  static const String products = "/api/products.php";
  static const String cart = "/api/cart.php";
  static const String orders = "/api/orders.php";
  static const String wishlist = "/api/wishlist.php";
  static const String reviews = "/api/reviews.php";
  static const String banners = "/api/banners.php";
  static const String coupon = "/api/coupon.php";
  static const String address = "/api/address.php";
  static const String card = "/api/card.php";
  static const String profile = "/api/profile.php";
  static const String notifications = "/api/push_sync.php";
  static const String cancelOrder = "/api/cancel_order.php";
  static const String chat = "/api/chat.php";
}

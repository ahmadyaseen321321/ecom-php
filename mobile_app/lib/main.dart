import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'core/theme/app_theme.dart';
import 'presentation/bindings/initial_binding.dart';
import 'presentation/screens/auth/splash_screen.dart';
import 'presentation/screens/auth/login_screen.dart';
import 'presentation/screens/auth/signup_screen.dart';
import 'presentation/screens/main/main_screen.dart';
import 'presentation/screens/shop/search_screen.dart';
import 'presentation/screens/shop/wishlist_screen.dart';
import 'presentation/screens/support/support_screen.dart';
import 'presentation/screens/seller/seller_main_screen.dart';

import 'presentation/bindings/home_binding.dart';
import 'presentation/screens/main/saved_addresses_screen.dart';
import 'presentation/screens/main/saved_cards_screen.dart';
import 'package:ecomapp/presentation/screens/main/order_history_screen.dart';
import 'package:ecomapp/presentation/screens/main/notification_screen.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:get_storage/get_storage.dart';
import 'package:ecomapp/presentation/controllers/notification_controller.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  // We can't use GetX here as it might not be initialized in background isolate
  // But system notifications for background messages don't need manual code
  // unless we want to show a custom local notification.
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  await GetStorage.init();

  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  Get.put(NotificationController()); // Global notification listener
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return GetMaterialApp(
      title: 'ShopStyle',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      initialBinding: InitialBinding(),
      getPages: [
        GetPage(name: '/', page: () => const SplashScreen()),
        GetPage(name: '/login', page: () => const LoginScreen()),
        GetPage(name: '/signup', page: () => const SignupScreen()),
        GetPage(
          name: '/main',
          page: () => const MainScreen(),
          binding: HomeBinding(),
        ),
        GetPage(name: '/search', page: () => const SearchScreen()),
        GetPage(name: '/wishlist', page: () => const WishlistScreen()),
        GetPage(name: '/support', page: () => const SupportScreen()),
        GetPage(
          name: '/seller_dashboard',
          page: () => const SellerMainScreen(),
        ),
        GetPage(
          name: '/saved_addresses',
          page: () => const SavedAddressesScreen(),
        ),
        GetPage(name: '/saved_cards', page: () => const SavedCardsScreen()),
        GetPage(name: '/order_history', page: () => const OrderHistoryScreen()),
        GetPage(name: '/notifications', page: () => const NotificationScreen()),
      ],
      initialRoute: '/',
    );
  }
}

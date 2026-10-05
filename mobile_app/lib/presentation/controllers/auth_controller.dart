import 'package:get/get.dart';
import 'package:logger/logger.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter_facebook_auth/flutter_facebook_auth.dart';
import 'package:dio/dio.dart';
import 'base_controller.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_endpoints.dart';
import 'cart_controller.dart';
import 'wishlist_controller.dart';
import 'address_controller.dart';
import 'card_controller.dart';
import 'notification_controller.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'profile_controller.dart';
import 'order_controller.dart';
import 'main_controller.dart';


class AuthController extends BaseController {
  final ApiClient apiClient;

  AuthController({required this.apiClient});

  final _isPasswordVisible = false.obs;
  bool get isPasswordVisible => _isPasswordVisible.value;
  void togglePasswordVisibility() =>
      _isPasswordVisible.value = !_isPasswordVisible.value;

  final _keepMeLoggedIn = false.obs;
  bool get keepMeLoggedIn => _keepMeLoggedIn.value;
  void toggleKeepMeLoggedIn() => _keepMeLoggedIn.value = !_keepMeLoggedIn.value;

  bool _isGoogleInitialized = false;

  Future<void> login(String email, String password) async {
    showLoading();
    clearError();
    try {
      final response = await apiClient.postData(ApiEndpoints.login, {
        "email": email,
        "password": password,
      });

      if (response.statusCode == 200) {
        final prefs = await SharedPreferences.getInstance();
        final userData = response.data['user'];
        await prefs.setString('token', response.data['token']);
        await prefs.setString('role', userData['role']);
        await prefs.setInt('user_id', int.parse(userData['id'].toString()));
        if (userData['seller_id'] != null) {
          await prefs.setInt(
            'seller_id',
            int.parse(userData['seller_id'].toString()),
          );
        }

        // --- Notify FCM Token Sync ---
        try {
          final fcmToken = await FirebaseMessaging.instance.getToken();
          if (fcmToken != null) {
            Get.find<NotificationController>().updateFcmToken(fcmToken);
          }
        } catch (e) {
          Logger().e('FCM sync error after login: $e');
        }

        if (userData['role'] == 'seller') {
          Get.offAllNamed('/seller_dashboard');
        } else {
          // Trigger data fetch for cart and wishlist after login
          try {
            Get.find<ProfileController>().fetchProfile();
            Get.find<CartController>().fetchCart();
            Get.find<WishlistController>().fetchWishlist();
            Get.find<AddressController>().fetchAddresses();
            Get.find<CardController>().fetchCards();
            if (Get.isRegistered<MainController>()) {
              Get.find<MainController>().changeIndex(0);
            }
          } catch (e) {
            Logger().e('Initial data fetch error: $e');
          }
          Get.offAllNamed('/main');


        }
      } else {
        final msg = response.data['message'] ?? 'Login failed';
        showError(msg);
        Get.snackbar('Error', msg, snackPosition: SnackPosition.BOTTOM);
      }
    } on DioException catch (e) {
      String msg = 'An error occurred';
      if (e.type == DioExceptionType.connectionTimeout) {
        msg = 'Connection timeout. Check your network.';
      } else if (e.type == DioExceptionType.receiveTimeout) {
        msg = 'Server not responding. Is XAMPP running?';
      } else if (e.type == DioExceptionType.badResponse) {
        msg =
            e.response?.data['message'] ??
            'Server error: ${e.response?.statusCode}';
      } else if (e.type == DioExceptionType.connectionError) {
        msg = 'Cannot connect to server. Check IP: ${ApiEndpoints.baseUrl}';
      }
      showError(msg);
      Get.snackbar('Error', msg, snackPosition: SnackPosition.BOTTOM);
    } catch (e) {
      showError('An error occurred. Please try again.');
      Get.snackbar(
        'Error',
        'An error occurred. Please try again.',
        snackPosition: SnackPosition.BOTTOM,
      );
    } finally {
      hideLoading();
    }
  }

  Future<void> register(
    String name,
    String email,
    String password, {
    String role = 'user',
    String? shopName,
  }) async {
    showLoading();
    clearError();
    try {
      final response = await apiClient.postData(ApiEndpoints.register, {
        "full_name": name,
        "email": email,
        "password": password,
        "role": role,
        "shop_name": shopName,
      });

      if (response.statusCode == 201) {
        Get.back();
        Get.snackbar('Success', 'Account created successfully. Please login.');
      } else {
        showError(response.data['message'] ?? 'Registration failed');
      }
    } catch (e) {
      showError('An error occurred. Please try again.');
    } finally {
      hideLoading();
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('role');
    await prefs.remove('seller_id');
    await prefs.remove('user_id');

    // Clear reactive data
    try {
      Get.find<ProfileController>().clearProfile();
      Get.find<CartController>().cartItems.clear();
      Get.find<WishlistController>().wishlistItems.clear();
      Get.find<AddressController>().addresses.clear();
      Get.find<AddressController>().selectedAddress.value = null;
      Get.find<CardController>().cards.clear();
      Get.find<CardController>().selectedCard.value = null;
      Get.find<OrderController>().orders.clear();
      Get.find<OrderController>().filteredOrders.clear();
      Get.find<NotificationController>().notifications.clear();
      Get.find<NotificationController>().unreadCount.value = 0;
      if (Get.isRegistered<MainController>()) {
        Get.find<MainController>().changeIndex(0);
      }
    } catch (e) {
      Logger().e('Logout cleanup error: $e');
    }



    Get.offAllNamed('/login');
  }

  Future<void> socialLogin(String provider) async {
    try {
      showLoading();
      clearError();

      String providerId = '';
      String email = '';
      String name = '';
      String? photoUrl;

      if (provider == 'Google') {
        final GoogleSignIn googleSignIn = GoogleSignIn(
          scopes: ['email', 'profile'],
        );

        await googleSignIn.signOut().catchError((_) => null);
        final GoogleSignInAccount? account = await googleSignIn.signIn();

        if (account == null) {
          hideLoading();
          return; // User canceled
        }

        providerId = account.id;
        email = account.email;
        name = account.displayName ?? 'Google User';
        photoUrl = account.photoUrl;
      } else if (provider == 'Facebook') {
        final LoginResult result = await FacebookAuth.instance.login(
          permissions: ['public_profile', 'email'],
        );

        if (result.status == LoginStatus.success) {
          final userData = await FacebookAuth.instance.getUserData();
          providerId = userData['id'];
          email = userData['email'] ?? '';
          name = userData['name'] ?? 'Facebook User';

          if (userData['picture'] != null &&
              userData['picture']['data'] != null) {
            photoUrl = userData['picture']['data']['url'];
          }
        } else if (result.status == LoginStatus.cancelled) {
          hideLoading();
          return; // User canceled
        } else {
          hideLoading();
          showError('Facebook login failed: ${result.message}');
          return;
        }
      } else {
        hideLoading();
        return;
      }

      if (email.isEmpty) {
        hideLoading();
        showError('Could not retrieve email from $provider');
        return;
      }

      // Now send to backend
      final response = await apiClient.postData(ApiEndpoints.socialLogin, {
        "provider": provider.toLowerCase(),
        "provider_id": providerId,
        "email": email,
        "full_name": name,
        "photo_url": photoUrl,
      });

      if (response.statusCode == 200) {
        final prefs = await SharedPreferences.getInstance();
        final userData = response.data['user'];
        await prefs.setString('token', response.data['token']);
        await prefs.setString('role', userData['role']);
        await prefs.setInt('user_id', int.parse(userData['id'].toString()));
        if (userData['seller_id'] != null) {
          await prefs.setInt(
            'seller_id',
            int.parse(userData['seller_id'].toString()),
          );
        }

        // --- Notify FCM Token Sync ---
        try {
          final fcmToken = await FirebaseMessaging.instance.getToken();
          if (fcmToken != null) {
            Get.find<NotificationController>().updateFcmToken(fcmToken);
          }
        } catch (e) {
          Logger().e('FCM sync error after social login: $e');
        }

        if (userData['role'] == 'seller') {
          Get.offAllNamed('/seller_dashboard');
        } else {
          try {
            Get.find<ProfileController>().fetchProfile();
            Get.find<CartController>().fetchCart();
            Get.find<WishlistController>().fetchWishlist();
            Get.find<AddressController>().fetchAddresses();
            Get.find<CardController>().fetchCards();
            if (Get.isRegistered<MainController>()) {
              Get.find<MainController>().changeIndex(0);
            }
          } catch (e) {
            Logger().e('Initial data fetch error: $e');
          }
          Get.offAllNamed('/main');
        }


      } else {
        final msg =
            response.data['message'] ?? '$provider login failed on server';
        showError(msg);
        Get.snackbar('Error', msg, snackPosition: SnackPosition.BOTTOM);
      }
    } catch (e) {
      final errorMsg = e.toString();
      Logger().e('$provider Login Error: $errorMsg');
      Get.snackbar(
        'Error',
        'An error occurred with $provider login. Details: $errorMsg',
        snackPosition: SnackPosition.BOTTOM,
        duration: const Duration(seconds: 8),
      );
      hideLoading();
    } finally {
      hideLoading();
    }
  }
}

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ecomapp/core/network/api_client.dart';
import 'package:ecomapp/core/network/api_endpoints.dart';
import 'package:logger/logger.dart';
import 'package:ecomapp/presentation/controllers/seller_main_controller.dart';

class NotificationController extends GetxController {
  final _storage = GetStorage();
  final _logger = Logger();
  final _apiClient = ApiClient();

  var notifications = <Map<String, dynamic>>[].obs;
  var unreadCount = 0.obs;
  var isLoading = false.obs;
  var readIds = <String>[].obs;

  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  @override
  void onInit() {
    super.onInit();
    _initLocalNotifications();
    _initFirebaseMessaging();
    // fetchNotifications() is now called when NotificationScreen is opened
    // and correctly loads user-specific read state first.
  }

  Future<void> _initLocalNotifications() async {
    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const DarwinInitializationSettings iosSettings =
        DarwinInitializationSettings();

    const InitializationSettings settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      settings: settings,
      onDidReceiveNotificationResponse: (details) {
        // Handle notification click while app is open or from notification
        _handleNotificationClick(details.payload);
      },
    );
  }

  void _handleNotificationClick(String? payload) {
    if (payload == 'seller_orders' || payload == 'new_order') {
      try {
        // First navigate to the dashboard then change the tab index to 2 (Orders)
        Get.toNamed('/seller_dashboard');
        // Delay slightly to ensure GetX find works if the controller is being re-initialized
        Future.delayed(const Duration(milliseconds: 100), () {
          try {
            final sellerCtrl = Get.find<SellerMainController>();
            sellerCtrl.changeIndex(2);
          } catch (e) {
            _logger.e('Error finding SellerMainController: $e');
          }
        });
      } catch (e) {
        _logger.e('Navigation Error: $e');
      }
    } else {
      Get.toNamed('/notifications');
    }
  }

  Future<void> _initFirebaseMessaging() async {
    FirebaseMessaging messaging = FirebaseMessaging.instance;

    // Request permissions (important for iOS and Android 13+)
    NotificationSettings settings = await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      _logger.i('User granted notification permission');
    }

    // Get FCM Token and sync with backend
    String? token = await messaging.getToken();
    if (token != null) {
      updateFcmToken(token);
    }

    // Handle messages when app is in foreground
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      _logger.i('Received foreground message: ${message.notification?.title}');
      _showFirebaseLocalNotification(message);
      fetchNotifications(); // Refresh list and count
    });

    // Handle messages when app is opened from notification
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      _logger.i('App opened from notification: ${message.notification?.title}');
      _handleNotificationClick(message.data['type']);
    });

    // Handle initial message if app was terminated
    RemoteMessage? initialMessage = await FirebaseMessaging.instance
        .getInitialMessage();
    if (initialMessage != null) {
      _logger.i('App launched from terminated state via notification');
      Future.delayed(const Duration(seconds: 1), () {
        _handleNotificationClick(initialMessage.data['type']);
      });
    }
  }

  Future<void> showLocalNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    const AndroidNotificationDetails androidDetails =
        AndroidNotificationDetails(
          'high_importance_channel',
          'High Importance Notifications',
          importance: Importance.max,
          priority: Priority.high,
        );

    const NotificationDetails details = NotificationDetails(
      android: androidDetails,
    );

    await _localNotifications.show(
      id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title: title,
      body: body,
      notificationDetails: details,
      payload: payload,
    );
  }

  Future<void> _showFirebaseLocalNotification(RemoteMessage message) async {
    final prefs = await SharedPreferences.getInstance();
    final role = prefs.getString('role') ?? 'user';
    final type = message.data['type'];

    String title = message.notification?.title ?? 'New Notification';
    String body = message.notification?.body ?? '';
    final orderId = message.data['order_id'] ?? '';
    final orderSuffix = orderId.isNotEmpty ? ' #$orderId' : '';

    // Customize based on type for order notifications
    if (type == 'order_placed') {
      title = 'Order Placed';
      body = 'Your order$orderSuffix has been successfully placed';
    } else if ((type == 'seller_orders' || type == 'new_order')) {
      // ONLY show if the user is a seller
      if (role != 'seller') {
        _logger.d('Skipping seller notification for non-seller user');
        return;
      }
      title = 'New Order Received';
      body = 'You got a new order$orderSuffix';
    }

    await showLocalNotification(
      title: title,
      body: body,
      payload: type, // Store type for navigation
    );
  }

  Future<void> fetchNotifications() async {
    try {
      await _loadReadIds();
      isLoading.value = true;
      final response = await _apiClient.getData(ApiEndpoints.notifications);

      if (response.statusCode == 200 && response.data['status'] == 'success') {
        final List<dynamic> data = response.data['data'];
        notifications.assignAll(data.cast<Map<String, dynamic>>());
        _calculateUnreadCount();
      }
    } catch (e) {
      _logger.e('Error fetching notifications: $e');
    } finally {
      isLoading.value = false;
    }
  }

  void _calculateUnreadCount() {
    unreadCount.value = notifications
        .where((n) => !readIds.contains(n['id'].toString()))
        .length;
  }

  Future<void> _loadReadIds() async {
    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getInt('user_id');
    final key = 'read_notifications_$userId';

    final List<dynamic>? saved = _storage.read<List>(key);
    if (saved != null) {
      readIds.assignAll(saved.cast<String>());
    } else {
      readIds.clear();
    }
  }

  Future<void> _saveReadIds() async {
    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getInt('user_id');
    final key = 'read_notifications_$userId';
    await _storage.write(key, readIds.toList());
  }

  bool isUnread(String id) => !readIds.contains(id);

  Future<void> markAsRead(String id) async {
    // Add to user-specific readIds. The notification will turn grey
    // instead of disappearing immediately. It will be removed from the
    // server list on the next pull-to-refresh.
    if (!readIds.contains(id)) {
      readIds.add(id);
      await _saveReadIds();
      _calculateUnreadCount();
    }

    try {
      await _apiClient.postData(ApiEndpoints.notifications, {
        "mark_read": true,
        "id": id,
      });
    } catch (e) {
      _logger.e('Error marking as read on server: $e');
    }
  }

  Future<void> markAllAsRead() async {
    final List<String> allIds = notifications
        .map((n) => n['id'].toString())
        .toList();

    // Mark all as read on server
    for (final id in allIds) {
      if (!readIds.contains(id)) {
        readIds.add(id);
      }
      try {
        await _apiClient.postData(ApiEndpoints.notifications, {
          "mark_read": true,
          "id": id,
        });
      } catch (e) {
        _logger.e('Error marking $id as read: $e');
      }
    }

    await _saveReadIds();
    // Clear list — nothing left to show after marking all as read
    notifications.clear();
    _calculateUnreadCount();
  }

  Future<void> updateFcmToken(String token) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final String? jwtToken = prefs.getString('token');
      final int? userId = prefs.getInt('user_id');

      if (jwtToken == null && userId == null) {
        _logger.w('Not synced: User not logged in yet');
        return;
      }

      await _apiClient.postData(ApiEndpoints.notifications, {
        "fcm_token": token,
        "token": jwtToken, // Explicit fallback if header is blocked
        "user_id": userId, // Final fallback to bypass header/JWT issues
      });
      _logger.i('FCM Token synced with backend (ID: $userId)');
    } catch (e) {
      _logger.e('Error syncing FCM token: $e');
    }
  }
}

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ecomapp/core/theme/app_theme.dart';
import 'package:ecomapp/presentation/controllers/main_controller.dart';
import 'package:ecomapp/presentation/controllers/notification_controller.dart';

/// Shared AppBar used across all main tabs.
/// Pass a [scaffoldKey] from each screen's Scaffold so the menu icon can open
/// the drawer.
PreferredSizeWidget shopAppBar(GlobalKey<ScaffoldState> scaffoldKey) {
  return AppBar(
    leading: IconButton(
      icon: const Icon(Icons.menu),
      onPressed: () => scaffoldKey.currentState?.openDrawer(),
    ),
    title: const Text(
      'ShopStyle',
      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
    ),
    actions: [
      Obx(() {
        final count = Get.find<NotificationController>().unreadCount.value;
        return IconButton(
          icon: Badge(
            label: Text('$count'),
            isLabelVisible: count > 0,
            child: const Icon(Icons.notifications_none_outlined),
          ),
          onPressed: () => Get.toNamed('/notifications'),
        );
      }),
      const SizedBox(width: 8),
    ],
  );
}

/// Shared side drawer used on all main tab screens.
class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final mainController = Get.find<MainController>();

    void go(int index) {
      Navigator.of(context).pop();
      mainController.changeIndex(index);
    }

    return Drawer(
      child: Column(
        children: [
          DrawerHeader(
            decoration: const BoxDecoration(color: AppColors.primary),
            child: Align(
              alignment: Alignment.bottomLeft,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Icon(Icons.local_mall_outlined, color: Colors.white, size: 36),
                  SizedBox(height: 8),
                  Text(
                    'ShopStyle',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    'Your premium store',
                    style: TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
          _item(context, Icons.home_outlined, 'Home', () => go(0)),
          _item(context, Icons.grid_view_outlined, 'Categories', () => go(1)),
          _item(context, Icons.favorite_outline, 'Wishlist', () => go(2)),
          _item(context, Icons.shopping_cart_outlined, 'Cart', () => go(3)),
          _item(context, Icons.person_outline, 'Profile', () => go(4)),
          const Divider(),
          _item(context, Icons.search, 'Search', () {
            Navigator.of(context).pop();
            Get.toNamed('/search');
          }),
          const Spacer(),
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text('v1.0.0', style: TextStyle(color: Colors.grey, fontSize: 12)),
          ),
        ],
      ),
    );
  }

  Widget _item(BuildContext context, IconData icon, String label, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon, color: AppColors.primary),
      title: Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
      onTap: onTap,
    );
  }
}

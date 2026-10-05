import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ecomapp/core/theme/app_theme.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:ecomapp/presentation/controllers/profile_controller.dart';
import 'package:ecomapp/presentation/controllers/auth_controller.dart';
import 'package:ecomapp/presentation/widgets/app_drawer.dart';
import 'package:ecomapp/presentation/screens/main/order_history_screen.dart';
import 'package:ecomapp/presentation/screens/main/messages_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final ProfileController controller = Get.find<ProfileController>();
    final AuthController authController = Get.find<AuthController>();
    final scaffoldKey = GlobalKey<ScaffoldState>();
    return Scaffold(
      key: scaffoldKey,
      backgroundColor: const Color(0xFFF8F9F8),
      drawer: const AppDrawer(),
      appBar: shopAppBar(scaffoldKey),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 20),
            // User Info
            Center(
              child: Stack(
                children: [
                  Obx(() => Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 4),
                    ),
                    child: CircleAvatar(
                      radius: 60,
                      backgroundColor: const Color(0xFFE8F0E8),
                      backgroundImage: controller.user?.profileImage != null
                        ? CachedNetworkImageProvider(controller.user!.profileImage!)
                        : null,
                      child: controller.user?.profileImage == null
                        ? const Icon(Icons.person, size: 60, color: Colors.grey)
                        : null,
                    ),
                  )),
                  Positioned(
                    bottom: 0,
                    right: 4,
                    child: GestureDetector(
                      onTap: () => controller.pickImage(),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: const BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.camera_alt,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Obx(() => Text(
              controller.user?.email ?? 'Not logged in',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            )),
            const SizedBox(height: 4),
            Obx(() => Text(
              controller.user?.fullName ?? 'Guest User',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
            )),
            const SizedBox(height: 32),

            // Sections
            _buildSection('ACCOUNT ACTIVITY', [
              _buildMenuItem(
                'My Orders',
                Icons.inventory_2_outlined,
                onTap: () => Get.to(() => const OrderHistoryScreen()),
              ),
              _buildMenuItem(
                'Messages',
                Icons.chat_bubble_outline_rounded,
                onTap: () => Get.to(() => const MessagesScreen()),
              ),
              _buildMenuItem(
                'Wishlist',
                Icons.favorite_border,
                onTap: () => Get.toNamed('/wishlist'),
              ),
              _buildMenuItem(
                'Support & Chat',
                Icons.support_agent,
                onTap: () => Get.toNamed('/support'),
              ),
            ]),

            _buildSection('PREFERENCES', [
              _buildMenuItem(
                'Saved Addresses', 
                Icons.location_on_outlined,
                onTap: () => Get.toNamed('/saved_addresses'),
              ),
              _buildMenuItem(
                'Payment Methods', 
                Icons.payments_outlined,
                onTap: () => Get.toNamed('/saved_cards'),
              ),
              _buildMenuItem('Settings', Icons.tune_outlined),
            ]),

            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFEAEA),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.logout, color: Colors.red),
                  ),
                  title: const Text(
                    'Logout',
                    style: TextStyle(
                      color: Colors.red,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  onTap: () => authController.logout(),
                ),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, List<Widget> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 24, bottom: 12),
          child: Text(
            title,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: Color(0xFFAAB8AA),
              letterSpacing: 1.2,
            ),
          ),
        ),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
          ),
          child: Column(children: items),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildMenuItem(String title, IconData icon, {VoidCallback? onTap}) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FBF8),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: AppColors.primary, size: 22),
      ),
      title: Text(
        title,
        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
      ),
      trailing: const Icon(Icons.chevron_right, color: Color(0xFFC0D0C0)),
      onTap: onTap,
    );
  }
}

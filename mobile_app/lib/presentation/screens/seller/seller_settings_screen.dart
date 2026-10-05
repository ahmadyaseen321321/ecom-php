import 'package:flutter/material.dart';

class SellerSettingsScreen extends StatelessWidget {
  const SellerSettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () {},
        ),
        title: const Text(
          'Store Settings',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            onPressed: () {},
            icon: const Icon(Icons.settings_outlined, color: Color(0xFF81C784)),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            _buildProfileCard(),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(child: _buildActionButton('Shop homepage', Icons.storefront_outlined)),
                const SizedBox(width: 16),
                Expanded(child: _buildActionButton('Share Shop', Icons.share_outlined)),
              ],
            ),
            const SizedBox(height: 24),
            _buildSettingsSection([
              _buildSettingsItem(Icons.person_outline, 'Account Setting'),
              _buildSettingsItem(Icons.health_and_safety_outlined, 'Account Health', trailingLabel: 'Need To Improve', trailingColor: Colors.orange.shade100, textSecondary: Colors.orange),
              _buildSettingsItem(Icons.info_outline, 'General Information'),
            ]),
            const SizedBox(height: 20),
            _buildSettingsSection([
              _buildSettingsItem(Icons.headset_mic_outlined, 'Chat with us', trailingLabel: 'Get Help', hasDropdown: true),
              _buildSettingsItem(Icons.feedback_outlined, 'Feedback'),
              _buildSettingsItem(Icons.help_outline, 'Seller Help Center'),
            ]),
            const SizedBox(height: 20),
            _buildSettingsSection([
              _buildSettingsItem(Icons.payments_outlined, 'My Income'),
              _buildSettingsItem(Icons.notifications_none_outlined, 'Notifications'),
              _buildSettingsItem(Icons.chat_bubble_outline_rounded, 'Chat'),
              _buildSettingsItem(Icons.language_outlined, 'Language'),
              _buildSettingsItem(Icons.school_outlined, 'Daraz University'),
            ]),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10),
        ],
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Image.network(
              'https://i.pravatar.cc/150?u=seller_profile',
              width: 80,
              height: 80,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'The Remote Experts',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Seller ID: PK2NBO6YSCW',
                  style: TextStyle(color: Colors.grey, fontSize: 13),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F8E9),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text(
                    '1138 Days as a seller',
                    style: TextStyle(color: Color(0xFF4CAF50), fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(String label, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: const Color(0xFF81C784), size: 20),
          const SizedBox(width: 8),
          Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        ],
      ),
    );
  }

  Widget _buildSettingsSection(List<Widget> items) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10),
        ],
      ),
      child: Column(
        children: items,
      ),
    );
  }

  Widget _buildSettingsItem(IconData icon, String title, {String? trailingLabel, Color? trailingColor, Color? textSecondary, bool hasDropdown = false}) {
    return ListTile(
      leading: Icon(icon, color: Colors.grey.shade600),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (trailingLabel != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: trailingColor ?? Colors.grey.shade200,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  if (hasDropdown) const Icon(Icons.help, size: 14, color: Color(0xFF4CAF50)),
                  if (hasDropdown) const SizedBox(width: 4),
                  Text(
                    trailingLabel,
                    style: TextStyle(
                      color: textSecondary ?? Colors.grey.shade700,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          const SizedBox(width: 4),
          const Icon(Icons.chevron_right, size: 20, color: Colors.grey),
        ],
      ),
      onTap: () {},
    );
  }
}

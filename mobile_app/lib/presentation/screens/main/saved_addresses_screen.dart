import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ecomapp/core/theme/app_theme.dart';
import 'package:ecomapp/presentation/controllers/address_controller.dart';
import 'package:ecomapp/data/models/address_model.dart';
import 'add_edit_address_screen.dart';

class SavedAddressesScreen extends StatelessWidget {
  const SavedAddressesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final AddressController controller = Get.find<AddressController>();

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: const BoxDecoration(
              color: Color(0xFFF0F2F5),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.arrow_back, size: 20),
          ),
          onPressed: () => Get.back(),
        ),
        title: const Text(
          'Saved Addresses',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: Obx(() {
        if (controller.isLoadingList.value && controller.addresses.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }
        
        if (controller.addresses.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.location_off_outlined, size: 64, color: Colors.grey[300]),
                const SizedBox(height: 16),
                const Text('No addresses saved yet', style: TextStyle(fontSize: 16, color: AppColors.textLight)),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: controller.addresses.length,
          itemBuilder: (context, index) {
            final address = controller.addresses[index];
            return _buildAddressCard(context, address, controller);
          },
        );
      }),
      floatingActionButton: Obx(() {
        final canAdd = controller.addresses.length < 3;
        return FloatingActionButton.extended(
          onPressed: canAdd ? () => Get.to(() => const AddEditAddressScreen()) : () {
            Get.snackbar('Limit Reached', 'You can only add up to 3 addresses', backgroundColor: Colors.orange, colorText: Colors.white);
          },
          label: Text(
            'Add New Address', 
            style: TextStyle(
              color: canAdd ? Colors.white : Colors.white.withValues(alpha: 0.6), 
              fontWeight: FontWeight.bold
            )
          ),
          icon: Icon(Icons.add, color: canAdd ? Colors.white : Colors.white.withValues(alpha: 0.6)),
          backgroundColor: canAdd ? AppColors.primary : Colors.grey,
        );
      }),
    );
  }

  Widget _buildAddressCard(BuildContext context, AddressModel address, AddressController controller) {
    return Obx(() {
      final isSelected = controller.selectedAddress.value?.id == address.id;
      return GestureDetector(
        onTap: () => controller.selectAddress(address),
        child: Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isSelected ? AppColors.primary : const Color(0xFFF0F2F5),
              width: 1.5,
            ),
          ),
          child: Row(
            children: [
              Radio<int>(
                value: address.id!,
                groupValue: controller.selectedAddress.value?.id,
                activeColor: AppColors.primary,
                onChanged: (_) => controller.selectAddress(address),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          address.fullName,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                        if (address.isDefault) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              'DEFAULT',
                              style: TextStyle(color: AppColors.primary, fontSize: 9, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ]
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${address.street}\n${address.city}, ${address.state} ${address.zipCode}',
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      address.phone,
                      style: const TextStyle(color: AppColors.textLight, fontSize: 12),
                    ),
                  ],
                ),
              ),
              Column(
                children: [
                  IconButton(
                    icon: const Icon(Icons.edit_outlined, size: 20),
                    onPressed: () => Get.to(() => AddEditAddressScreen(address: address)),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete_outline, size: 20, color: Colors.red),
                    onPressed: () => _showDeleteConfirm(context, address, controller),
                  ),
                ],
              ),
            ],
          ),
        ),
      );
    });
  }

  void _showDeleteConfirm(BuildContext context, AddressModel address, AddressController controller) {
    Get.dialog(
      AlertDialog(
        title: const Text('Delete Address?'),
        content: const Text('Are you sure you want to remove this address?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(), 
            child: const Text('Cancel')
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              controller.deleteAddress(address.id!);
            }, 
            child: const Text('Delete', style: TextStyle(color: Colors.red))
          ),
        ],
      ),
    );
  }
}

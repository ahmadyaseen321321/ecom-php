import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:logger/logger.dart';
import 'package:image_picker/image_picker.dart';
import 'package:ecomapp/core/theme/app_theme.dart';
import 'package:ecomapp/presentation/controllers/cart_controller.dart';
import 'order_success_screen.dart';
import 'saved_addresses_screen.dart';
import '../../controllers/address_controller.dart';
import '../../controllers/order_controller.dart';
import 'package:ecomapp/data/models/cart_item_model.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  int selectedPayment = 0; // 0: Easypaisa, 1: JazzCash, 2: COD

  @override
  Widget build(BuildContext context) {
    final CartController cartController = Get.find<CartController>();
    final AddressController addressController = Get.find<AddressController>();
    final OrderController orderController = Get.find<OrderController>();

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
          'Checkout',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Stepper
            _buildStepper(),
            const SizedBox(height: 32),

            const Text(
              'Shipping Address',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Obx(() => _buildAddressCard(addressController)),

            const SizedBox(height: 32),
            const Text(
              'Payment Method',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            _buildPaymentOption(
              0,
              'Easypaisa',
              'Fast mobile payment',
              Icons.account_balance_wallet_outlined,
            ),
            const SizedBox(height: 12),
            _buildPaymentOption(
              1,
              'JazzCash',
              'Secure mobile wallet',
              Icons.vibration,
            ),
            const SizedBox(height: 12),
            _buildPaymentOption(
              2,
              'Cash on Delivery',
              'Pay when you receive your order',
              Icons.local_shipping_outlined,
            ),

            const SizedBox(height: 32),
            const Text(
              'Order Summary',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            _buildOrderSummary(cartController),

            const SizedBox(height: 24),
            Center(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.lock_outline,
                    size: 14,
                    color: AppColors.textLight,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'SSL SECURE PAYMENT',
                    style: TextStyle(
                      color: AppColors.textLight,
                      fontSize: 10,
                      letterSpacing: 1.1,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            Obx(
              () => ElevatedButton(
                onPressed: orderController.isLoading
                    ? null
                    : () async {
                        try {
                          final address = addressController.selectedAddress.value;
                          if (address == null) {
                            Get.snackbar('Error', 'Please select a shipping address');
                            return;
                          }

                          final addressStr =
                              '${address.fullName}, ${address.street}, ${address.city}, ${address.state} ${address.zipCode}';

                          final total = cartController.total;
                          final count = cartController.totalItemCount;
                          final items = cartController.cartItems.toList();

                          if (items.isEmpty) {
                            Get.snackbar('Error', 'Your cart is empty');
                            return;
                          }

                          if (selectedPayment == 0 || selectedPayment == 1) {
                            // Manual Transfer (Easypaisa/JazzCash)
                            _showManualPaymentFlow(
                                total, items, addressStr, count, orderController, cartController);
                          } else {
                            // Cash on Delivery
                            final success = await orderController.placeOrder(
                              total: total,
                              items: items,
                              address: addressStr,
                            );

                            if (success) {
                              await cartController.fetchCart();
                              Get.off(
                                () => OrderSuccessScreen(
                                  totalAmount: total,
                                  itemCount: count,
                                ),
                              );
                            }
                          }
                        } catch (e) {
                          Logger().e('CRITICAL Checkout Error: $e');
                          Get.snackbar(
                            'Error',
                            'An unexpected error occurred: $e',
                          );
                        }
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryLight,
                  disabledBackgroundColor: AppColors.primaryLight.withValues(
                    alpha: 0.6,
                  ),
                  minimumSize: const Size(double.infinity, 56),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(28),
                  ),
                ),
                child: orderController.isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Place Order',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                              color: Colors.white,
                            ),
                          ),
                          SizedBox(width: 8),
                          Icon(
                            Icons.arrow_forward,
                            size: 20,
                            color: Colors.white,
                          ),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  void _showManualPaymentFlow(
      double total,
      List<CartItemModel> items,
      String addressStr,
      int count,
      OrderController orderController,
      CartController cartController) {
    Get.defaultDialog(
      title: 'Payment Details',
      contentPadding: const EdgeInsets.all(20),
      content: Column(
        children: [
          Text(
            'Pay PKR ${total.toStringAsFixed(0)} in the account below:',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 16),
          ),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF0F2F5),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Name: Muhmmad Ahmad',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                SizedBox(height: 8),
                Text('Account No: 0306831966',
                    style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: AppColors.primary)),
              ],
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              Get.back();
              _showUploadReceiptDialog(
                  total, items, addressStr, count, orderController, cartController);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              minimumSize: const Size(double.infinity, 48),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            ),
            child: const Text('I have paid',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showUploadReceiptDialog(
      double total,
      List<CartItemModel> items,
      String addressStr,
      int count,
      OrderController orderController,
      CartController cartController) {
    Get.defaultDialog(
      title: 'Upload Receipt',
      contentPadding: const EdgeInsets.all(20),
      content: Column(
        children: [
          const Text(
              'Please upload an image of your payment receipt for verification.',
              textAlign: TextAlign.center),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            icon: const Icon(Icons.upload_file, color: Colors.white),
            label: const Text('Select Image', style: TextStyle(color: Colors.white)),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            ),
            onPressed: () async {
              final picker = ImagePicker();
              final image = await picker.pickImage(source: ImageSource.gallery);
              if (image != null) {
                Get.back();
                _processManualOrder(
                    total, items, addressStr, count, orderController, cartController, image.path);
              }
            },
          ),
        ],
      ),
    );
  }

  Future<void> _processManualOrder(
      double total,
      List<CartItemModel> items,
      String addressStr,
      int count,
      OrderController orderController,
      CartController cartController,
      String? receiptPath) async {
    
    String paymentMethod = selectedPayment == 0 ? 'Easypaisa' : (selectedPayment == 1 ? 'JazzCash' : 'Cash on Delivery');

    final success = await orderController.placeOrder(
      total: total,
      items: items,
      address: addressStr,
      paymentMethod: paymentMethod,
      receiptPath: receiptPath,
    );

    if (success) {
      await cartController.fetchCart();
      await Get.defaultDialog(
        title: 'Payment Verifying',
        middleText:
            'Your order will be proceed once payment will be verified.',
        barrierDismissible: false,
        confirm: ElevatedButton(
          onPressed: () {
            Get.back();
            Get.off(() => OrderSuccessScreen(totalAmount: total, itemCount: count));
          },
          style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
          child: const Text('OK', style: TextStyle(color: Colors.white)),
        ),
      );
    }
  }

  Widget _buildStepper() {
    return Row(
      children: [
        _buildStep('1', 'SHIPPING', true),
        Expanded(
          child: Container(
            height: 2,
            color: AppColors.primary,
            margin: const EdgeInsets.symmetric(horizontal: 4),
          ),
        ),
        _buildStep('2', 'PAYMENT', true),
        Expanded(
          child: Container(
            height: 2,
            color: const Color(0xFFE0E0E0),
            margin: const EdgeInsets.symmetric(horizontal: 4),
          ),
        ),
        _buildStep('3', 'SUMMARY', false),
      ],
    );
  }

  Widget _buildStep(String num, String label, bool isActive) {
    return Column(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: isActive ? AppColors.primary : const Color(0xFFF0F2F5),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              num,
              style: TextStyle(
                color: isActive ? Colors.white : AppColors.textLight,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.bold,
            color: isActive ? AppColors.primary : AppColors.textLight,
          ),
        ),
      ],
    );
  }

  Widget _buildAddressCard(AddressController controller) {
    final address = controller.selectedAddress.value;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF0F2F5)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(
              color: Color(0xFFF0F2F5),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.location_on_outlined,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: address == null
                ? const Text(
                    'No shipping address selected',
                    style: TextStyle(color: AppColors.textLight, fontSize: 14),
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        address.fullName,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${address.street}\n${address.city}, ${address.state} ${address.zipCode}',
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 13,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
          ),
          TextButton(
            onPressed: () => Get.to(() => const SavedAddressesScreen()),
            style: TextButton.styleFrom(
              backgroundColor: const Color(0xFFF0F2F5),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              'Edit',
              style: TextStyle(
                color: Colors.black,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentOption(
    int index,
    String title,
    String subtitle,
    IconData icon,
  ) {
    final isSelected = selectedPayment == index;
    return GestureDetector(
      onTap: () {
        setState(() => selectedPayment = index);
      },
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isSelected ? AppColors.primary : const Color(0xFFF0F2F5),
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: const BoxDecoration(
                color: Color(0xFFF0F2F5),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: Colors.black),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected
                      ? AppColors.primary
                      : const Color(0xFFE0E0E0),
                  width: 2,
                ),
                color: isSelected ? AppColors.primary : Colors.transparent,
              ),
              child: isSelected
                  ? const Icon(Icons.check, color: Colors.white, size: 14)
                  : null,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderSummary(CartController controller) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF0F2F5)),
      ),
      child: Column(
        children: [
          _summaryRow(
            'Items (${controller.cartItems.length})',
            'PKR ${controller.subtotal.toStringAsFixed(0)}',
          ),
          const SizedBox(height: 12),
          _summaryRow('Shipping', 'Free', isGreen: true),
          const SizedBox(height: 12),
          _summaryRow('Taxes', 'PKR ${controller.tax.toStringAsFixed(0)}'),
          const Divider(height: 32),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Total Price',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
              Text(
                'PKR ${controller.total.toStringAsFixed(0)}',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 24,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _summaryRow(String label, String value, {bool isGreen = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
        ),
        Text(
          value,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 15,
            color: isGreen ? Colors.green : Colors.black,
          ),
        ),
      ],
    );
  }
}

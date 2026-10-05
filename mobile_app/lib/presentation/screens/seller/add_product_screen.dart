import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:ecomapp/presentation/controllers/seller_controller.dart';
import 'package:ecomapp/presentation/controllers/category_controller.dart';
import 'package:ecomapp/core/theme/app_theme.dart';

class AddProductScreen extends StatefulWidget {
  const AddProductScreen({super.key});

  @override
  State<AddProductScreen> createState() => _AddProductScreenState();
}

class _AddProductScreenState extends State<AddProductScreen> {
  final SellerController sellerController = Get.find<SellerController>();
  final CategoryController categoryController = Get.find<CategoryController>();

  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _priceController = TextEditingController();
  final _discountPriceController = TextEditingController();
  final _stockController = TextEditingController();
  int? _selectedCategoryId;

  @override
  void dispose() {
    sellerController.clearAddProductData();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Add New Product',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildLabel('Product Name'),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  hintText: 'e.g. Wireless Headphones',
                ),
                validator: (value) =>
                    value == null || value.isEmpty ? 'Please enter name' : null,
              ),
              const SizedBox(height: 20),

              _buildLabel('Category'),
              Obx(
                () => DropdownButtonFormField<int>(
                  value: _selectedCategoryId,
                  items: categoryController.allCategories
                      .map(
                        (cat) => DropdownMenuItem(
                          value: cat.id,
                          child: Text(cat.name),
                        ),
                      )
                      .toList(),
                  onChanged: (val) => setState(() => _selectedCategoryId = val),
                  decoration: const InputDecoration(
                    hintText: 'Select category',
                  ),
                  validator: (value) =>
                      value == null ? 'Please select category' : null,
                ),
              ),
              const SizedBox(height: 20),

              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildLabel('Price (PKR)'),
                        TextFormField(
                          controller: _priceController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(hintText: '0.00'),
                          validator: (value) => value == null || value.isEmpty
                              ? 'Required'
                              : null,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildLabel('Discount (PKR)'),
                        TextFormField(
                          controller: _discountPriceController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(hintText: 'Optional'),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              
              _buildLabel('Stock'),
              TextFormField(
                controller: _stockController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(hintText: '0'),
                validator: (value) => value == null || value.isEmpty
                    ? 'Required'
                    : null,
              ),
              const SizedBox(height: 20),

              _buildLabel('Description'),
              TextFormField(
                controller: _descriptionController,
                maxLines: 4,
                decoration: const InputDecoration(
                  hintText: 'Enter product details...',
                ),
                validator: (value) => value == null || value.isEmpty
                    ? 'Please enter description'
                    : null,
              ),
              const SizedBox(height: 24),

              _buildImageSection(),
              const SizedBox(height: 24),

              _buildVariantSection(),
              const SizedBox(height: 32),

              Obx(
                () => sellerController.isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : ElevatedButton(
                        onPressed: _submit,
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size(double.infinity, 56),
                        ),
                        child: const Text('Publish Product'),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      sellerController.addProduct(
        name: _nameController.text,
        description: _descriptionController.text,
        price: double.parse(_priceController.text),
        discountPrice: _discountPriceController.text.isNotEmpty
            ? double.parse(_discountPriceController.text)
            : null,
        stock: int.parse(_stockController.text),
        categoryId: _selectedCategoryId!,
      );
    }
  }

  Widget _buildImageSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _buildLabel('Product Images (3-10)'),
            Obx(() => Text(
              '${sellerController.selectedImages.length}/10',
              style: TextStyle(
                color: sellerController.selectedImages.length < 3 ? Colors.red : AppColors.primary,
                fontWeight: FontWeight.bold,
              ),
            )),
          ],
        ),
        const SizedBox(height: 8),
        Obx(() => SizedBox(
          height: 100,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: sellerController.selectedImages.length + 1,
            itemBuilder: (context, index) {
              if (index == sellerController.selectedImages.length) {
                if (index >= 10) return const SizedBox.shrink();
                return _buildAddImageButton();
              }
              return _buildImageItem(index);
            },
          ),
        )),
      ],
    );
  }

  Widget _buildAddImageButton() {
    return GestureDetector(
      onTap: () => _showImageSourceSheet(null),
      child: Container(
        width: 100,
        margin: const EdgeInsets.only(right: 12),
        decoration: BoxDecoration(
          color: Colors.grey[100],
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey[300]!, style: BorderStyle.solid),
        ),
        child: const Icon(Icons.add_a_photo_outlined, color: Colors.grey),
      ),
    );
  }

  Widget _buildImageItem(int index) {
    return Stack(
      children: [
        Container(
          width: 100,
          margin: const EdgeInsets.only(right: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            image: DecorationImage(
              image: FileImage(sellerController.selectedImages[index]),
              fit: BoxFit.cover,
            ),
          ),
        ),
        Positioned(
          top: 4,
          right: 16,
          child: GestureDetector(
            onTap: () => sellerController.selectedImages.removeAt(index),
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(
                color: Colors.black54,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.close, size: 16, color: Colors.white),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildVariantSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _buildLabel('Colour Variants'),
            TextButton.icon(
              onPressed: () => sellerController.addColorVariant(),
              icon: const Icon(Icons.add),
              label: const Text('Add Colour'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Obx(() => Column(
          children: List.generate(sellerController.colorVariants.length, (index) {
            final variant = sellerController.colorVariants[index];
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      initialValue: variant.colorName,
                      readOnly: index == 0,
                      decoration: InputDecoration(
                        hintText: 'Color Name',
                        filled: index == 0,
                        fillColor: index == 0 ? Colors.grey[50] : null,
                      ),
                      onChanged: (val) => sellerController.updateColorName(index, val),
                    ),
                  ),
                  const SizedBox(width: 12),
                  GestureDetector(
                    onTap: () => _showImageSourceSheet(index),
                    child: Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: variant.image == null && index > 0 ? Colors.red : Colors.grey[300]!),
                      ),
                      child: variant.image != null
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.file(variant.image!, fit: BoxFit.cover),
                            )
                          : Icon(Icons.image_outlined, color: index > 0 ? Colors.red : Colors.grey),
                    ),
                  ),
                  if (index > 0) ...[
                    const SizedBox(width: 8),
                    IconButton(
                      icon: const Icon(Icons.delete_outline, color: Colors.red),
                      onPressed: () => sellerController.removeColorVariant(index),
                    ),
                  ],
                ],
              ),
            );
          }),
        )),
      ],
    );
  }

  void _showImageSourceSheet(int? variantIndex) {
    Get.bottomSheet(
      Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Choose Image Source', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildSourceOption(Icons.camera_alt_outlined, 'Camera', () {
                  Get.back();
                  if (variantIndex != null) {
                    sellerController.pickVariantImage(variantIndex, ImageSource.camera);
                  } else {
                    sellerController.pickProductImages(ImageSource.camera);
                  }
                }),
                _buildSourceOption(Icons.photo_library_outlined, 'Gallery', () {
                  Get.back();
                  if (variantIndex != null) {
                    sellerController.pickVariantImage(variantIndex, ImageSource.gallery);
                  } else {
                    sellerController.pickProductImages(ImageSource.gallery);
                  }
                }),
              ],
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildSourceOption(IconData icon, String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: AppColors.primary, size: 32),
          ),
          const SizedBox(height: 8),
          Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        label,
        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
      ),
    );
  }
}

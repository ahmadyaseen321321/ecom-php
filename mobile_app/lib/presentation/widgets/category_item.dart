import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ecomapp/data/models/category_model.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:ecomapp/core/theme/app_theme.dart';
import 'package:ecomapp/presentation/screens/main/category_listing_screen.dart';

class CategoryAppearanceHelper {
  CategoryAppearanceHelper._();

  static String imageUrl(String categoryName) {
    switch (categoryName.toLowerCase()) {
      case 'fashion':
      case 'clothing':
        return 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=400&auto=format&fit=crop';
      case 'electronics':
      case 'devices':
      case 'smartphones':
      case 'laptops':
        return 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=400&auto=format&fit=crop';
      case 'home':
      case 'furniture':
        return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=400&auto=format&fit=crop';
      case 'beauty':
      case 'cosmetics':
        return 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=400&auto=format&fit=crop';
      case 'sports':
      case 'fitness':
        return 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400&auto=format&fit=crop';
      case 'groceries':
      case 'food':
        return 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop';
      case 'books':
        return 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=400&auto=format&fit=crop';
      case 'toys':
      case 'kids':
        return 'https://images.unsplash.com/photo-1566576912321-d58ddd9a6088?q=80&w=400&auto=format&fit=crop';
      default:
        return 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80&w=400&auto=format&fit=crop';
    }
  }
}

class CategoryItem extends StatelessWidget {
  final CategoryModel category;
  const CategoryItem({super.key, required this.category});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Get.to(() => CategoryListingScreen(category: category)),
      child: Container(
        width: 72,
        margin: const EdgeInsets.only(right: 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.border, width: 1.5),
                image: DecorationImage(
                  image: CachedNetworkImageProvider(
                    CategoryAppearanceHelper.imageUrl(category.name),
                  ),
                  fit: BoxFit.cover,
                ),
                boxShadow: const [
                  BoxShadow(
                    color: AppColors.cardShadow,
                    blurRadius: 10,
                    offset: Offset(0, 4),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              category.name,
              maxLines: 1,
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
                letterSpacing: 0.2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

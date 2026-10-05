import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ecomapp/core/theme/app_theme.dart';
import 'package:ecomapp/data/models/review_model.dart';
import 'package:ecomapp/presentation/widgets/review_item.dart';

class AllReviewsScreen extends StatelessWidget {
  final String productName;
  final List<ReviewModel> reviews;
  
  const AllReviewsScreen({
    super.key, 
    required this.productName, 
    required this.reviews
  });

  @override
  Widget build(BuildContext context) {
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
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Customer Reviews',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
            Text(
              productName,
              style: const TextStyle(
                color: AppColors.textLight, 
                fontSize: 12, 
                fontWeight: FontWeight.normal
              ),
            ),
          ],
        ),
      ),
      body: reviews.isEmpty
          ? const Center(
              child: Text('No reviews yet'),
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: reviews.length,
              separatorBuilder: (context, index) => const SizedBox(height: 16),
              itemBuilder: (context, index) {
                return ReviewItem(review: reviews[index]);
              },
            ),
    );
  }
}

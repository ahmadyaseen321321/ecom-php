import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ecomapp/data/models/seller_review_model.dart';
import 'package:ecomapp/presentation/controllers/seller_controller.dart';

class SellerReviewsScreen extends StatelessWidget {
  final bool isStandalone;
  const SellerReviewsScreen({super.key, this.isStandalone = false});

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<SellerController>();
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  if (isStandalone)
                    IconButton(
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      icon: const Icon(Icons.arrow_back, color: Colors.black),
                      onPressed: () => Get.back(),
                    ),
                  if (isStandalone) const SizedBox(width: 12),
                  const Text(
                    'Reviews Management',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.black),
                  ),
                ],
              ),
              const SizedBox(height: 24),
            Obx(() => Row(
              children: [
                Expanded(
                  child: _buildReviewStatCard(
                    'Pending\nFeedback',
                    '${controller.stats.value?.pendingFeedbackCount ?? 0}',
                    'Action items',
                    const Color(0xFFE8F5E9),
                    const Color(0xFF4CAF50),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildReviewStatCard(
                    'Average Rating',
                    '${controller.stats.value?.avgRating.toStringAsFixed(1) ?? "0.0"}',
                    'From customer reviews',
                    Colors.white,
                    Colors.amber,
                    isRating: true,
                  ),
                ),
              ],
            )),
            const SizedBox(height: 24),
            Obx(() => SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                   _buildFilterChip('All', 
                     isSelected: controller.selectedReviewFilter.value == 'All',
                     onTap: () => controller.selectedReviewFilter.value = 'All'
                   ),
                   _buildFilterChip('Pending', 
                     isSelected: controller.selectedReviewFilter.value == 'Pending',
                     onTap: () => controller.selectedReviewFilter.value = 'Pending'
                   ),
                   _buildFilterChip('Completed', 
                     isSelected: controller.selectedReviewFilter.value == 'Completed',
                     onTap: () => controller.selectedReviewFilter.value = 'Completed'
                   ),
                   _buildFilterChip('Critical', 
                     isSelected: controller.selectedReviewFilter.value == 'Critical',
                     onTap: () => controller.selectedReviewFilter.value = 'Critical'
                   ),
                ],
              ),
            )),
            const SizedBox(height: 24),
            Obx(() {
              final reviews = controller.filteredReviews;
              if (reviews.isEmpty) {
                return Center(
                  child: Column(
                    children: [
                      const SizedBox(height: 40),
                      Icon(Icons.rate_review_outlined, size: 64, color: Colors.grey.shade300),
                      const SizedBox(height: 16),
                      Text(
                        'No reviews in this category',
                        style: TextStyle(color: Colors.grey.shade500, fontSize: 16),
                      ),
                    ],
                  ),
                );
              }
              return ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: reviews.length,
                itemBuilder: (context, index) {
                  return _buildReviewCard(context, reviews[index]);
                },
              );
            }),
          ],
        ),
      ),
      ),
    );
  }

  Widget _buildReviewStatCard(String label, String value, String subLabel, Color bgColor, Color iconColor, {bool isRating = false}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          if (bgColor == Colors.white) BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
          const SizedBox(height: 8),
          Row(
            children: [
              Text(
                value,
                style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
              ),
              if (isRating) ...[
                const SizedBox(width: 8),
                Icon(Icons.star, color: iconColor, size: 24),
              ],
            ],
          ),
          const SizedBox(height: 4),
          Text(subLabel, style: const TextStyle(color: Colors.grey, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, {required bool isSelected, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF81C784) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: isSelected ? null : Border.all(color: Colors.grey.shade200),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.grey.shade600,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildReviewCard(BuildContext context, SellerReviewModel review) {
    bool needsAttention = review.rating <= 2;
    final controller = Get.find<SellerController>();

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F8E9),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    review.userName.isNotEmpty ? review.userName[0].toUpperCase() : 'U',
                    style: const TextStyle(color: Color(0xFF4CAF50), fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      review.productName,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'by ${review.userName} · ${review.relativeTime}',
                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: List.generate(5, (index) {
              return Icon(
                index < review.rating ? Icons.star : Icons.star_border,
                color: Colors.amber,
                size: 20,
              );
            }),
          ),
          const SizedBox(height: 12),
          Text(
            review.comment,
            style: TextStyle(color: Colors.grey.shade700, height: 1.5),
          ),
          if (review.imageUrl != null) ...[
            const SizedBox(height: 12),
            GestureDetector(
              onTap: () {
                Get.dialog(
                  Dialog(
                    backgroundColor: Colors.transparent,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Align(
                          alignment: Alignment.centerRight,
                          child: IconButton(
                            icon: const Icon(Icons.close, color: Colors.white),
                            onPressed: () => Get.back(),
                          ),
                        ),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Image.network(
                            review.imageUrl!,
                            fit: BoxFit.contain,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
              child: Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.shade200),
                  image: DecorationImage(
                    image: NetworkImage(review.imageUrl!),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            ),
          ],
          if (review.reply != null && review.reply!.isNotEmpty) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF5F5F5),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.reply, size: 16, color: Color(0xFF4CAF50)),
                      const SizedBox(width: 8),
                      Text(
                        'Your Reply',
                        style: TextStyle(
                          color: const Color(0xFF4CAF50),
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    review.reply!,
                    style: TextStyle(color: Colors.grey.shade800, fontSize: 14),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 20),
          if (review.reply == null || review.reply!.isEmpty)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (needsAttention)
                  const Row(
                    children: [
                      Icon(Icons.error_outline, color: Colors.red, size: 20),
                      SizedBox(width: 8),
                      Text(
                        'NEEDS\nATTENTION',
                        style: TextStyle(color: Colors.red, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ],
                  )
                else
                  const SizedBox.shrink(),
                TextButton.icon(
                  onPressed: () => _showReplyDialog(context, controller, review),
                  icon: const Icon(Icons.reply, size: 18, color: Color(0xFF4CAF50)),
                  label: const Text(
                    'Reply to Review',
                    style: TextStyle(color: Color(0xFF4CAF50)),
                  ),
                ),
              ],
            )
          else
            Align(
              alignment: Alignment.centerRight,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFE8F5E9),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.check_circle, size: 14, color: Colors.green.shade700),
                    const SizedBox(width: 4),
                    Text(
                      'Replied',
                      style: TextStyle(color: Colors.green.shade700, fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _showReplyDialog(BuildContext context, SellerController controller, SellerReviewModel review) {
    final replyTextController = TextEditingController(text: review.reply);
    
    showDialog(
      context: context,
      builder: (dialogContext) {
        return Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                       const Text(
                        'Write a Reply',
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                      IconButton(
                        onPressed: () => Navigator.of(dialogContext).pop(),
                        icon: const Icon(Icons.close),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Review from ${review.userName}:',
                    style: const TextStyle(fontWeight: FontWeight.w500, color: Colors.grey),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: Text(
                      review.comment,
                      style: const TextStyle(fontStyle: FontStyle.italic),
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(height: 20),
                  TextField(
                    controller: replyTextController,
                    maxLines: 4,
                    decoration: InputDecoration(
                      hintText: 'Type your reply here...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide(color: Colors.grey.shade300),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: const BorderSide(color: Color(0xFF4CAF50), width: 2),
                      ),
                      filled: true,
                      fillColor: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        if (replyTextController.text.trim().isNotEmpty) {
                          Navigator.of(dialogContext).pop();
                          controller.replyToReview(review.id, replyTextController.text.trim());
                        } else {
                          Get.snackbar('Input Error', 'Please enter a reply message');
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF4CAF50),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        elevation: 0,
                      ),
                      child: const Text('Post Reply', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

}

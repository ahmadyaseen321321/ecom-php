import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:logger/logger.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart' as dio;
import 'package:ecomapp/core/network/api_client.dart';
import 'package:ecomapp/core/network/api_endpoints.dart';
import 'base_controller.dart';

class ReviewController extends BaseController {
  final ApiClient apiClient;
  ReviewController({required this.apiClient});

  final Rxn<File> selectedImage = Rxn<File>();
  final RxInt rating = 5.obs;
  final ImagePicker _picker = ImagePicker();
  final TextEditingController commentController = TextEditingController();

  @override
  void onClose() {
    commentController.dispose();
    super.onClose();
  }

  Future<void> pickImage() async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 70,
      );
      if (image != null) {
        selectedImage.value = File(image.path);
      }
    } catch (e) {
      Logger().e('Error picking image: $e');
      Get.snackbar('Error', 'Failed to pick image');
    }
  }

  void setRating(int value) {
    rating.value = value;
  }

  Future<void> submitReview({
    required int productId,
  }) async {
    final comment = commentController.text;
    if (comment.isEmpty) {
      Get.snackbar('Error', 'Please enter a comment');
      return;
    }

    showLoading();
    try {
      final formDataMap = {
        'product_id': productId,
        'rating': rating.value,
        'comment': comment,
      };

      if (selectedImage.value != null) {
        formDataMap['image'] = await dio.MultipartFile.fromFile(
          selectedImage.value!.path,
          filename: selectedImage.value!.path.split('/').last,
        );
      }

      final formData = dio.FormData.fromMap(formDataMap);
      final response = await apiClient.postData(ApiEndpoints.reviews, formData);

      if (response.data['status'] == 'success') {
        Get.back(); // Close bottom sheet
        Get.snackbar('Success', 'Review submitted successfully',
            backgroundColor: const Color(0xFFE8F5E9),
            colorText: const Color(0xFF2E7D32));
        
        // Reset values
        selectedImage.value = null;
        rating.value = 5;
        commentController.clear();
      } else {
        showError(response.data['message'] ?? 'Failed to submit review');
      }
    } catch (e) {
      Logger().e('Submit Review Error: $e');
      showError('An error occurred while submitting the review');
    } finally {
      hideLoading();
    }
  }
}

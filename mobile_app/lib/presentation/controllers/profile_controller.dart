import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:dio/dio.dart' as dio;
import 'package:logger/logger.dart';
import 'package:image_picker/image_picker.dart';
import 'base_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_endpoints.dart';
import '../../data/models/user_model.dart';
import '../screens/profile/crop_image_screen.dart';

class ProfileController extends BaseController {
  final ApiClient apiClient;

  ProfileController({required this.apiClient});

  final _user = Rxn<UserModel>();
  UserModel? get user => _user.value;

  final _isLoading = false.obs;
  bool get isLoading => _isLoading.value;

  @override
  void onInit() {
    super.onInit();
    fetchProfile();
  }

  Future<void> fetchProfile() async {
    _isLoading.value = true;
    try {
      final response = await apiClient.getData(ApiEndpoints.profile);
      if (response.statusCode == 200) {
        _user.value = UserModel.fromJson(response.data);
      }
    } catch (e) {
      Logger().e('Error fetching profile: $e');
    } finally {
      _isLoading.value = false;
    }
  }

  void clearProfile() {
    _user.value = null;
  }


  Future<bool> updateProfile({String? fullName, String? phone, File? image}) async {
    showLoading();
    try {
      Map<String, dynamic> data = {};
      if (fullName != null) data['full_name'] = fullName;
      if (phone != null) data['phone'] = phone;

      dio.FormData formData = dio.FormData.fromMap(data);

      if (image != null) {
        formData.files.add(MapEntry(
          'profile_image',
          await dio.MultipartFile.fromFile(image.path, filename: 'profile.jpg'),
        ));
      }

      final response = await apiClient.postData(ApiEndpoints.profile, formData);

      if (response.statusCode == 200) {
        await fetchProfile(); // Refresh profile
        Get.snackbar('Success', 'Profile updated successfully');
        return true;
      } else {
        Get.snackbar('Error', response.data['message'] ?? 'Failed to update profile');
        return false;
      }
    } catch (e) {
      Logger().e('Error updating profile: $e');
      Get.snackbar('Error', 'An error occurred while updating profile');
      return false;
    } finally {
      hideLoading();
    }
  }

  Future<void> pickImage() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.gallery);
    
    if (image != null) {
      final File? croppedImage = await showDialog<File>(
        context: Get.context!,
        barrierDismissible: false,
        builder: (_) => CropImageDialog(imageFile: File(image.path)),
      );
      if (croppedImage != null) {
        await updateProfile(image: croppedImage);
      }
    }
  }
}

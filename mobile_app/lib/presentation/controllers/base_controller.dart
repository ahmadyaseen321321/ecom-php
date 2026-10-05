import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:get/get.dart';

abstract class BaseController extends GetxController {
  final _isLoading = false.obs;
  bool get isLoading => _isLoading.value;
  set isLoading(bool value) => _isLoading.value = value;

  final _errorMessage = ''.obs;
  String get errorMessage => _errorMessage.value;
  set errorMessage(String value) => _errorMessage.value = value;

  void showLoading() {
    if (!_isLoading.value) {
      if (WidgetsBinding.instance.schedulerPhase == SchedulerPhase.persistentCallbacks) {
        WidgetsBinding.instance.addPostFrameCallback((_) => _isLoading.value = true);
      } else {
        _isLoading.value = true;
      }
    }
  }

  void hideLoading() {
    if (_isLoading.value) {
      if (WidgetsBinding.instance.schedulerPhase == SchedulerPhase.persistentCallbacks) {
        WidgetsBinding.instance.addPostFrameCallback((_) => _isLoading.value = false);
      } else {
        _isLoading.value = false;
      }
    }
  }

  void showError(String message) {
    if (WidgetsBinding.instance.schedulerPhase == SchedulerPhase.persistentCallbacks) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _displayErrorSnackbar(message));
    } else {
      _displayErrorSnackbar(message);
    }
  }

  void _displayErrorSnackbar(String message) {
    errorMessage = message;
    Get.snackbar(
      'Error', 
      message, 
      backgroundColor: const Color(0xFFFFEBEE), 
      colorText: const Color(0xFFC62828),
      icon: const Icon(Icons.error_outline, color: Color(0xFFC62828)),
      duration: const Duration(seconds: 4),
      snackPosition: SnackPosition.BOTTOM,
    );
  }

  void clearError() {
    if (_errorMessage.value.isNotEmpty) {
      if (WidgetsBinding.instance.schedulerPhase == SchedulerPhase.persistentCallbacks) {
        WidgetsBinding.instance.addPostFrameCallback((_) => _errorMessage.value = '');
      } else {
        _errorMessage.value = '';
      }
    }
  }
}

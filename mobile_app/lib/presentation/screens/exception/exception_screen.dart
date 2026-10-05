import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/global_exception_handler.dart';

class ExceptionScreen extends StatefulWidget {
  const ExceptionScreen({super.key});

  @override
  State<ExceptionScreen> createState() => _ExceptionScreenState();
}

class _ExceptionScreenState extends State<ExceptionScreen> {
  bool _isLoading = false;

  Future<void> _checkConnection() async {
    setState(() {
      _isLoading = true;
    });

    bool isConnected = false;

    try {
      final apiClient = Get.find<ApiClient>();
      // Attempting to hit the base URL to verify connection
      await apiClient.dio.get(apiClient.appBaseUrl);
      isConnected = true;
    } catch (e) {
      if (e is DioException) {
        // If it's a server error but we get a response, we have an internet connection
        if (e.type != DioExceptionType.connectionTimeout && 
            e.type != DioExceptionType.receiveTimeout && 
            e.type != DioExceptionType.unknown) {
          isConnected = true;
        }
      }
    }

    if (!mounted) return;

    if (isConnected) {
      GlobalExceptionHandler.hideExceptionScreen();
    } else {
      setState(() {
        _isLoading = false;
      });
      // Show again / Keep showing the screen
      Get.snackbar(
        'Connection Failed',
        'Still unable to connect. Please check your internet and try again.',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.redAccent,
        colorText: Colors.white,
        margin: const EdgeInsets.all(16),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false, // Prevent physical/system back button from dismissing
      child: Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.wifi_off_rounded,
                  size: 100,
                  color: Colors.grey.shade400,
                ),
                const SizedBox(height: 32),
                Text(
                  'Connection Error',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                Text(
                  'We are having trouble connecting to the server. Please check your internet connection and try again.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: Colors.grey.shade600,
                        height: 1.5,
                      ),
                ),
                const SizedBox(height: 48),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _checkConnection,
                    style: ElevatedButton.styleFrom(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: 0,
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            height: 24,
                            width: 24,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2.5,
                            ),
                          )
                        : const Text(
                            'Try Again',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

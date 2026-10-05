import 'dart:async';
import 'package:get/get.dart';
import 'package:ecomapp/core/network/api_client.dart';
import 'package:ecomapp/core/network/api_endpoints.dart';
import 'package:ecomapp/data/models/chat_message_model.dart';
import 'package:dio/dio.dart' as dio;

class ChatController extends GetxController {
  final ApiClient apiClient;
  ChatController({required this.apiClient});

  final RxList<ChatMessageModel> messages = <ChatMessageModel>[].obs;
  final RxBool isLoading = false.obs;
  final RxBool isSending = false.obs;

  String? _currentOrderId;
  Timer? _pollTimer;

  /// Call this when entering the chat screen
  void initChat(String orderId) {
    _currentOrderId = orderId;
    loadMessages();
    _startPolling();
  }

  void _startPolling() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (_currentOrderId != null) loadMessages(silent: true);
    });
  }

  @override
  void onClose() {
    _pollTimer?.cancel();
    super.onClose();
  }

  Future<void> loadMessages({bool silent = false}) async {
    if (_currentOrderId == null) return;
    if (!silent) isLoading.value = true;
    try {
      final response = await apiClient.getData(
        ApiEndpoints.chat,
        query: {'order_id': _currentOrderId},
      );
      final data = response.data;
      if (data != null && data['status'] == 'success') {
        final List list = data['messages'] ?? [];
        messages.value = list.map((e) => ChatMessageModel.fromJson(e)).toList();
      }
    } catch (e) {
      Get.log('Chat load error: $e');
    } finally {
      if (!silent) isLoading.value = false;
    }
  }

  Future<void> sendMessage(String senderType, String text, {List<String>? filePaths}) async {
    if (_currentOrderId == null || (text.trim().isEmpty && (filePaths == null || filePaths.isEmpty))) return;
    isSending.value = true;
    try {
      dynamic data;
      if (filePaths != null && filePaths.isNotEmpty) {
        // Ensure ApiEndpoints.chat uses properly formatted formdata
        final formData = dio.FormData.fromMap({
          'order_id': _currentOrderId,
          'sender_type': senderType,
          'message': text.trim(),
        });

        for (var i = 0; i < filePaths.length; i++) {
          formData.files.add(MapEntry(
            'files[]',
            await dio.MultipartFile.fromFile(
              filePaths[i],
              filename: filePaths[i].split('/').last,
            ),
          ));
        }
        data = formData;
      } else {
        data = {
          'order_id': _currentOrderId,
          'sender_type': senderType,
          'message': text.trim(),
        };
      }

      final response = await apiClient.postData(ApiEndpoints.chat, data);
      final respData = response.data;
      if (respData != null && respData['status'] == 'success' && respData['data'] != null) {
        messages.add(ChatMessageModel.fromJson(respData['data']));
      }
    } catch (e) {
      Get.log('Chat send error: $e');
      Get.snackbar('Error', 'Failed to send message. Please try again.');
    } finally {
      isSending.value = false;
    }
  }
}

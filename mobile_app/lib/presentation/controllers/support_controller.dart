import 'package:get/get.dart';
import 'package:logger/logger.dart';
import 'package:ecomapp/core/network/api_client.dart';
import 'base_controller.dart';

class SupportTicketModel {
  final int id;
  final String subject;
  final String status;
  final DateTime createdAt;

  SupportTicketModel({
    required this.id,
    required this.subject,
    required this.status,
    required this.createdAt,
  });

  factory SupportTicketModel.fromJson(Map<String, dynamic> json) {
    return SupportTicketModel(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      subject: json['subject'],
      status: json['status'],
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}

class ChatMessageModel {
  final int id;
  final int? ticketId;
  final int senderId;
  final int receiverId;
  final String message;
  final String? attachment;
  final bool isRead;
  final DateTime createdAt;

  ChatMessageModel({
    required this.id,
    this.ticketId,
    required this.senderId,
    required this.receiverId,
    required this.message,
    this.attachment,
    required this.isRead,
    required this.createdAt,
  });

  factory ChatMessageModel.fromJson(Map<String, dynamic> json) {
    return ChatMessageModel(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      ticketId: json['ticket_id'] != null
          ? (json['ticket_id'] is int
                ? json['ticket_id']
                : int.parse(json['ticket_id'].toString()))
          : null,
      senderId: json['sender_id'] is int
          ? json['sender_id']
          : int.parse(json['sender_id'].toString()),
      receiverId: json['receiver_id'] is int
          ? json['receiver_id']
          : int.parse(json['receiver_id'].toString()),
      message: json['message'],
      attachment: json['attachment'],
      isRead: json['is_read'] == 1 || json['is_read'] == true,
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}

class SupportController extends BaseController {
  final ApiClient apiClient;
  SupportController({required this.apiClient});

  final RxList<SupportTicketModel> tickets = <SupportTicketModel>[].obs;
  final RxList<ChatMessageModel> messages = <ChatMessageModel>[].obs;

  @override
  void onInit() {
    super.onInit();
    fetchTickets();
  }

  Future<void> fetchTickets() async {
    showLoading();
    try {
      final response = await apiClient.getData(
        '/api/support.php?action=tickets',
      );
      if (response.data['status'] == 'success') {
        tickets.assignAll(
          (response.data['data'] as List)
              .map((item) => SupportTicketModel.fromJson(item))
              .toList(),
        );
      }
    } catch (e) {
      showError('Failed to load tickets');
    } finally {
      hideLoading();
    }
  }

  Future<void> createTicket(String subject) async {
    showLoading();
    try {
      final response = await apiClient.postData(
        '/api/support.php?action=create_ticket',
        {'subject': subject},
      );
      if (response.data['status'] == 'success') {
        fetchTickets();
        Get.back();
      }
    } catch (e) {
      showError('Failed to create ticket');
    } finally {
      hideLoading();
    }
  }

  Future<void> fetchMessages(int ticketId) async {
    try {
      final response = await apiClient.getData(
        '/api/support.php?action=messages&ticket_id=$ticketId',
      );
      if (response.data['status'] == 'success') {
        messages.assignAll(
          (response.data['data'] as List)
              .map((item) => ChatMessageModel.fromJson(item))
              .toList(),
        );
      }
    } catch (e) {
      Logger().e('Error fetching messages: $e');
    }
  }

  Future<void> sendMessage(int ticketId, String message) async {
    try {
      final response = await apiClient.postData(
        '/api/support.php?action=send_message',
        {'ticket_id': ticketId, 'message': message},
      );
      if (response.data['status'] == 'success') {
        fetchMessages(ticketId);
      }
    } catch (e) {
      showError('Failed to send message');
    }
  }
}

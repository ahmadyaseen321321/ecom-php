class ChatMessageModel {
  final String id;
  final String orderId;
  final String senderType; // 'seller' or 'customer'
  final String message;
  final String? attachmentUrl;
  final DateTime createdAt;

  ChatMessageModel({
    required this.id,
    required this.orderId,
    required this.senderType,
    required this.message,
    this.attachmentUrl,
    required this.createdAt,
  });

  factory ChatMessageModel.fromJson(Map<String, dynamic> json) {
    return ChatMessageModel(
      id: json['id'].toString(),
      orderId: json['order_id'].toString(),
      senderType: json['sender_type'] ?? 'customer',
      message: json['message'] ?? '',
      attachmentUrl: json['attachment_url'] ?? json['file_url'] ?? (json['file'] != null ? json['file'].toString() : null),
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  bool get isFromSeller => senderType == 'seller';
}

import 'package:ecomapp/core/network/api_endpoints.dart';

class SellerReviewModel {
  final int id;
  final String productName;
  final String userName;
  final double rating;
  final String comment;
  final String? reply;
  final DateTime? repliedAt;
  final String? imageUrl;
  final DateTime createdAt;

  SellerReviewModel({
    required this.id,
    required this.productName,
    required this.userName,
    required this.rating,
    required this.comment,
    this.reply,
    this.repliedAt,
    this.imageUrl,
    required this.createdAt,
  });

  factory SellerReviewModel.fromJson(Map<String, dynamic> json) {
    return SellerReviewModel(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      productName: json['product_name'] ?? 'Unknown Product',
      userName: json['user_name'] ?? 'Anonymous',
      rating: json['rating'] is double 
          ? json['rating'] 
          : double.tryParse(json['rating'].toString()) ?? 0.0,
      comment: json['comment'] ?? '',
      reply: json['reply'],
      repliedAt: json['replied_at'] != null 
          ? DateTime.tryParse(json['replied_at'].toString()) 
          : null,
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at'].toString()) 
          : DateTime.now(),
      imageUrl: json['image_url'] != null && json['image_url'].toString().isNotEmpty
          ? (json['image_url'].toString().startsWith('http')
              ? json['image_url'].toString()
              : '${ApiEndpoints.baseUrl}/${json['image_url']}')
          : null,
    );
  }

  String get relativeTime {
    final diff = DateTime.now().difference(createdAt);
    if (diff.inDays > 365) return '${(diff.inDays / 365).floor()}y ago';
    if (diff.inDays > 30) return '${(diff.inDays / 30).floor()}mo ago';
    if (diff.inDays > 0) return '${diff.inDays}d ago';
    if (diff.inHours > 0) return '${diff.inHours}h ago';
    if (diff.inMinutes > 0) return '${diff.inMinutes}m ago';
    return 'Just now';
  }
}

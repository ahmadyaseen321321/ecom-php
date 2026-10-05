class ReviewModel {
  final int id;
  final int userId;
  final int productId;
  final double rating;
  final String comment;
  final String userName;
  final String? imageUrl;
  final String? reply;
  final DateTime? repliedAt;
  final DateTime createdAt;

  ReviewModel({
    required this.id,
    required this.userId,
    required this.productId,
    required this.rating,
    required this.comment,
    required this.userName,
    this.imageUrl,
    this.reply,
    this.repliedAt,
    required this.createdAt,
  });

  String get userInitial {
    if (userName.trim().isEmpty) return 'U';
    final parts = userName.trim().split(' ').where((p) => p.isNotEmpty);
    if (parts.isEmpty) return 'U';
    return parts.map((l) => l[0]).take(2).join().toUpperCase();
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

  factory ReviewModel.fromJson(Map<String, dynamic> json) {
    return ReviewModel(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      userId: json['user_id'] is int ? json['user_id'] : int.parse(json['user_id'].toString()),
      productId: json['product_id'] is int ? json['product_id'] : int.parse(json['product_id'].toString()),
      rating: json['rating'] is double ? json['rating'] : double.parse(json['rating'].toString()),
      comment: json['comment'] ?? '',
      userName: json['user_name'] ?? 'Anonymous',
      imageUrl: json['image_url'],
      reply: json['reply'],
      repliedAt: json['replied_at'] != null 
          ? DateTime.tryParse(json['replied_at'].toString()) 
          : null,
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at'].toString()) 
          : DateTime.now(),
    );
  }
}


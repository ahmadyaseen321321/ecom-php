import 'package:ecomapp/core/network/api_endpoints.dart';
import 'package:logger/logger.dart';

class ProductModel {
  final int id;
  final int categoryId;
  final String name;
  final String description;
  final double price;
  final double? discountPrice;
  final int stock;
  final String? mainImage;
  final List<String> images;
  final double rating;
  final int reviewCount;
  final double? userReviewRating;
  final String? userReviewComment;
  final String? userReviewImage;
  final String? sellerReply;
  final String? sellerReplyDate;

  ProductModel({
    required this.id,
    required this.categoryId,
    required this.name,
    required this.description,
    required this.price,
    this.discountPrice,
    required this.stock,
    this.mainImage,
    required this.images,
    this.rating = 0.0,
    this.reviewCount = 0,
    this.userReviewRating,
    this.userReviewComment,
    this.userReviewImage,
    this.sellerReply,
    this.sellerReplyDate,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    final String? mainImageUrl = json['main_image'] != null && json['main_image'].toString().isNotEmpty
          ? (json['main_image'].toString().startsWith('http')
                ? json['main_image'].toString()
                : '${ApiEndpoints.baseUrl}/${json['main_image']}')
          : null;

    return ProductModel(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      categoryId: json['category_id'] is int
          ? json['category_id']
          : int.parse(json['category_id'].toString()),
      name: json['name'],
      description: json['description'] ?? '',
      price: json['price'] is double
          ? json['price']
          : double.parse(json['price'].toString()),
      discountPrice: json['discount_price'] != null
          ? (json['discount_price'] is double
                ? json['discount_price']
                : double.parse(json['discount_price'].toString()))
          : null,
      stock: json['stock'] is int
          ? json['stock']
          : int.parse(json['stock'].toString()),
      mainImage: mainImageUrl,
      images: (() {
        if (json['id'].toString() == '334') {
          Logger().d("DEBUG_IMAGE: ID 334 raw all_images = ${json['all_images']}");
          Logger().d("DEBUG_IMAGE: ID 334 raw main_image = ${json['main_image']}");
        }
        final List<String> imgs = json['all_images'] != null && json['all_images'].toString().trim().isNotEmpty
            ? json['all_images']
                .toString()
                .split(',')
                .where((img) => img.trim().isNotEmpty)
                .map((img) {
                  String cleanImg = img.trim();
                  if (cleanImg.startsWith('http')) return cleanImg;
                  if (cleanImg.startsWith('/')) cleanImg = cleanImg.substring(1);
                  String base = ApiEndpoints.baseUrl;
                  if (base.endsWith('/')) base = base.substring(0, base.length - 1);
                  return '$base/$cleanImg';
                })
                .toList()
            : (mainImageUrl != null ? [mainImageUrl] : []);
        return imgs;
      })(),
      rating: json['rating'] != null
          ? double.parse(json['rating'].toString())
          : 0.0,
      reviewCount: json['review_count'] != null
          ? int.parse(json['review_count'].toString())
          : 0,
      userReviewRating: json['user_rating'] != null ? double.tryParse(json['user_rating'].toString()) : null,
      userReviewComment: json['user_comment'],
      userReviewImage: json['review_image'] != null && json['review_image'].toString().isNotEmpty
          ? (json['review_image'].toString().startsWith('http')
              ? json['review_image'].toString()
              : '${ApiEndpoints.baseUrl}/${json['review_image']}')
          : null,
      sellerReply: json['seller_reply'],
      sellerReplyDate: json['replied_at'],
    );
  }
}

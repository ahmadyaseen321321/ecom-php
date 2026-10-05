import 'package:ecomapp/core/network/api_endpoints.dart';

class UserModel {
  final int id;
  final String fullName;
  final String email;
  final String? phone;
  final String role;
  final String? profileImage;

  UserModel({
    required this.id,
    required this.fullName,
    required this.email,
    this.phone,
    required this.role,
    this.profileImage,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      fullName: json['full_name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'],
      role: json['role'] ?? 'user',
      profileImage: json['profile_image'] != null && json['profile_image'].toString().isNotEmpty
          ? (json['profile_image'].toString().startsWith('http')
              ? json['profile_image'].toString()
              : '${ApiEndpoints.baseUrl}/${json['profile_image']}')
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'full_name': fullName,
      'email': email,
      'phone': phone,
      'role': role,
      'profile_image': profileImage,
    };
  }
}

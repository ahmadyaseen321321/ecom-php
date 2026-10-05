class AddressModel {
  final int? id;
  final int? userId;
  final String fullName;
  final String phone;
  final String street;
  final String city;
  final String state;
  final String zipCode;
  final bool isDefault;

  AddressModel({
    this.id,
    this.userId,
    required this.fullName,
    required this.phone,
    required this.street,
    required this.city,
    required this.state,
    required this.zipCode,
    this.isDefault = false,
  });

  factory AddressModel.fromJson(Map<String, dynamic> json) {
    return AddressModel(
      id: json['id'] != null ? int.parse(json['id'].toString()) : null,
      userId: json['user_id'] != null ? int.parse(json['user_id'].toString()) : null,
      fullName: json['full_name'],
      phone: json['phone'],
      street: json['street'],
      city: json['city'],
      state: json['state'],
      zipCode: json['zip_code'],
      isDefault: json['is_default'] == 1 || json['is_default'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'full_name': fullName,
      'phone': phone,
      'street': street,
      'city': city,
      'state': state,
      'zip_code': zipCode,
      'is_default': isDefault ? 1 : 0,
    };
  }
}

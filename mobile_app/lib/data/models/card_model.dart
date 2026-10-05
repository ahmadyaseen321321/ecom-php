class CardModel {
  final int? id;
  final int? userId;
  final String cardholderName;
  final String cardNumber; // May be masked when fetched
  final String? last4;
  final String expiryDate;
  final String? cvv;
  final bool isDefault;

  CardModel({
    this.id,
    this.userId,
    required this.cardholderName,
    required this.cardNumber,
    this.last4,
    required this.expiryDate,
    this.cvv,
    this.isDefault = false,
  });

  factory CardModel.fromJson(Map<String, dynamic> json) {
    return CardModel(
      id: json['id'] != null ? int.parse(json['id'].toString()) : null,
      userId: json['user_id'] != null ? int.parse(json['user_id'].toString()) : null,
      cardholderName: json['cardholder_name'] ?? '',
      cardNumber: json['card_number_masked'] ?? json['card_number'] ?? '',
      last4: json['last4']?.toString(),
      expiryDate: json['expiry_date'] ?? '',
      cvv: json['cvv']?.toString(),
      isDefault: json['is_default'].toString() == '1',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'cardholder_name': cardholderName,
      'card_number': cardNumber,
      'expiry_date': expiryDate,
      'cvv': cvv,
      'is_default': isDefault ? 1 : 0,
    };
  }
}

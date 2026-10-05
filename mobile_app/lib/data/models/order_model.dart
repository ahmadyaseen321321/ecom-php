import 'package:ecomapp/data/models/product_model.dart';

class OrderModel {
  final String id;
  final String status;
  final String date;
  final double total;
  final List<ProductModel> products;
  final String? deliveryDate;
  final String? customerName;
  final String? customerPhone;
  final String? shippingAddress;
  final String? cancellationReason;
  final String? paymentMethod;
  final String? paymentStatus;

  OrderModel({
    required this.id,
    required this.status,
    required this.date,
    required this.total,
    required this.products,
    this.deliveryDate,
    this.customerName,
    this.customerPhone,
    this.shippingAddress,
    this.cancellationReason,
    this.paymentMethod,
    this.paymentStatus,
  });


  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id'].toString(),
      status: json['status'],
      date: json['date'] ?? json['created_at'],
      total: double.parse((json['total'] ?? json['total_amount']).toString()),
      products: json['items'] != null
          ? (json['items'] as List)
              .map((p) => ProductModel.fromJson(Map<String, dynamic>.from(p as Map)))
              .toList()
          : (json['products'] != null
              ? (json['products'] as List)
                  .map((p) => ProductModel.fromJson(Map<String, dynamic>.from(p as Map)))
                  .toList()
              : []),
      deliveryDate: json['delivery_date'],
      customerName: json['customer_name'],
      customerPhone: json['customer_phone'],
      shippingAddress: json['shipping_address'],
      cancellationReason: json['cancellation_reason'],
      paymentMethod: json['payment_method'],
      paymentStatus: json['payment_status'],
    );
  }
  bool get isReturnExpired {
    if ((status.toUpperCase() != 'DELIVERED' && status.toUpperCase() != 'COMPLETED') || deliveryDate == null) {
      return false;
    }
    try {
      final deliveredAt = DateTime.parse(deliveryDate!);
      final now = DateTime.now();
      return now.difference(deliveredAt).inDays > 7;
    } catch (e) {
      return false;
    }
  }

}


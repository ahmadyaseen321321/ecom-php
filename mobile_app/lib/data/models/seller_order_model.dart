import 'package:ecomapp/data/models/product_model.dart';
import 'package:ecomapp/data/models/order_model.dart';

class SellerOrderItem {
  final String id;
  final String productName;
  final String productId;
  final int quantity;
  final double price;
  final String? mainImage;

  SellerOrderItem({
    required this.id,
    required this.productName,
    required this.productId,
    required this.quantity,
    required this.price,
    this.mainImage,
  });

  factory SellerOrderItem.fromJson(Map<String, dynamic> json) {
    return SellerOrderItem(
      id: json['id'].toString(),
      productName: json['name'] ?? '',
      productId: json['product_id'].toString(),
      quantity: json['quantity'] != null ? int.parse(json['quantity'].toString()) : 0,
      price: json['price'] != null ? double.parse(json['price'].toString()) : 0.0,
      mainImage: json['main_image'],
    );
  }
}

class SellerOrderModel {
  final String id;
  final String customerName;
  final String status;
  final String date;
  final double total;
  final int itemCount;
  final List<SellerOrderItem> items;
  final String productSummary;
  final List<String> images;
  final String shippingAddress;
  final String? customerPhone;
  final String? paymentMethod;
  final String? paymentStatus;
  final String? receiptUrl;
  final String? cancellationReason;

  SellerOrderModel({
    required this.id,
    required this.customerName,
    required this.status,
    required this.date,
    required this.total,
    required this.itemCount,
    required this.items,
    required this.productSummary,
    required this.images,
    required this.shippingAddress,
    this.customerPhone,
    this.paymentMethod,
    this.paymentStatus,
    this.receiptUrl,
    this.cancellationReason,
  });


  factory SellerOrderModel.fromJson(Map<String, dynamic> json) {
    return SellerOrderModel(
      id: json['id'].toString(),
      customerName: json['customerName'] ?? json['customer_name'] ?? '',
      status: json['status'] ?? 'pending',
      date: json['date'] ?? json['created_at'] ?? '',
      total: json['total'] != null ? double.parse(json['total'].toString()) : 0.0,
      itemCount: json['itemCount'] != null ? int.parse(json['itemCount'].toString()) : 0,
      items: json['items'] != null
          ? (json['items'] as List).map((i) => SellerOrderItem.fromJson(i)).toList()
          : [],
      productSummary: json['productSummary'] ?? '',
      images: json['images'] != null ? List<String>.from(json['images']) : [],
      shippingAddress: json['shipping'] ?? json['shipping_address'] ?? json['address'] ?? '',
      customerPhone: json['customer_phone'] ?? json['phone'],
      paymentMethod: json['payment_method'] ?? 'Cash on Delivery',
      paymentStatus: json['payment_status'] ?? 'pending',
      receiptUrl: json['receipt_url'],
      cancellationReason: json['cancellation_reason'],
    );
  }

  OrderModel toOrderModel() {
    return OrderModel(
      id: id,
      status: status,
      date: date,
      total: total,
      products: items.map((item) => ProductModel(
        id: int.tryParse(item.productId) ?? 0,
        categoryId: 0,
        name: item.productName,
        description: '',
        price: item.price,
        stock: 0,
        images: [],
        mainImage: item.mainImage,
      )).toList(),
      customerName: customerName,
      customerPhone: customerPhone,
      shippingAddress: shippingAddress,
      cancellationReason: cancellationReason,
    );
  }
}


import 'package:ecomapp/data/models/product_model.dart';
import 'package:ecomapp/data/models/product_model.dart';

class CartItemModel {
  final int cartLineId;
  final ProductModel product;
  int quantity;

  CartItemModel({
    required this.cartLineId,
    required this.product,
    this.quantity = 1,
  });

  double get total => product.price * quantity;
}

class CategoryModel {
  final int id;
  final String name;
  final String? icon;
  final int? productCount;

  CategoryModel({
    required this.id,
    required this.name,
    this.icon,
    this.productCount,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    final rawCount = json['product_count'];
    return CategoryModel(
      id: int.parse(json['id'].toString()),
      name: _parseName(json['name']),
      icon: json['icon']?.toString() ?? json['image']?.toString(),
      productCount: rawCount == null
          ? null
          : int.tryParse(rawCount.toString()),
    );
  }

  static String _parseName(dynamic value) {
    final s = value?.toString().trim() ?? '';
    return s.isEmpty ? 'Category' : s;
  }
}

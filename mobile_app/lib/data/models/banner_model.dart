class BannerModel {
  final int id;
  final String imageUrl;
  final String? title;
  final String? subtitle;
  final String? link;

  BannerModel({
    required this.id,
    required this.imageUrl,
    this.title,
    this.subtitle,
    this.link,
  });

  factory BannerModel.fromJson(Map<String, dynamic> json) {
    return BannerModel(
      id: json['id'] is int ? json['id'] : int.parse(json['id']),
      imageUrl: json['image_url'],
      title: json['title'],
      subtitle: json['subtitle'],
      link: json['link'],
    );
  }
}

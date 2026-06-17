class Category {
  final String id;
  final String name;
  final String? slug;
  final String? description;
  final String? parentId;
  final String? image;
  final bool isActive;
  final int sortOrder;
  final int? productCount;

  Category({
    required this.id,
    required this.name,
    this.slug,
    this.description,
    this.parentId,
    this.image,
    this.isActive = true,
    this.sortOrder = 0,
    this.productCount,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    final parent = json['parent'];
    String? parentId;
    if (parent is Map<String, dynamic>) {
      parentId = parent['_id'] as String?;
    } else if (parent is String) {
      parentId = parent;
    }

    return Category(
      id: json['_id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      slug: json['slug'] as String?,
      description: json['description'] as String?,
      parentId: parentId,
      image: json['image'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      sortOrder: json['sortOrder'] as int? ?? 0,
      productCount: json['productCount'] as int?,
    );
  }
}

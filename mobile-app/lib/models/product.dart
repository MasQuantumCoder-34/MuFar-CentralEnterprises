class ProductSize {
  final String name;
  final double mrp;
  final double salesPrice;

  ProductSize({
    required this.name,
    required this.mrp,
    required this.salesPrice,
  });

  factory ProductSize.fromJson(dynamic json) {
    if (json is String) {
      return ProductSize(name: json, mrp: 0, salesPrice: 0);
    }
    final map = json as Map<String, dynamic>;
    return ProductSize(
      name: map['name'] as String? ?? '',
      mrp: (map['mrp'] as num?)?.toDouble() ?? 0,
      salesPrice: (map['salesPrice'] as num?)?.toDouble() ?? 0,
    );
  }
}

class Product {
  final String id;
  final String name;
  final String sku;
  final String? categoryId;
  final String? categoryName;
  final double mrp;
  final double salesPrice;
  final List<String> images;
  final List<ProductSize> sizes;
  final int stockQuantity;
  final int lowStockThreshold;
  final bool isActive;

  Product({
    required this.id,
    required this.name,
    this.sku = '',
    this.categoryId,
    this.categoryName,
    this.mrp = 0,
    this.salesPrice = 0,
    this.images = const [],
    this.sizes = const [],
    this.stockQuantity = 0,
    this.lowStockThreshold = 10,
    this.isActive = true,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    final category = json['category'];
    String? catId;
    String? catName;
    if (category is Map<String, dynamic>) {
      catId = category['_id'] as String?;
      catName = category['name'] as String?;
    } else if (category is String) {
      catId = category;
    }

    List<ProductSize> sizes = [];
    if (json['sizes'] != null) {
      final raw = json['sizes'] as List;
      sizes = raw.map((e) => ProductSize.fromJson(e)).toList();
    }

    return Product(
      id: json['_id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      sku: json['sku'] as String? ?? '',
      categoryId: catId,
      categoryName: catName,
      mrp: (json['mrp'] as num?)?.toDouble() ?? 0,
      salesPrice: (json['salesPrice'] as num?)?.toDouble() ?? 0,
      images: json['images'] != null ? List<String>.from(json['images'] as List) : [],
      sizes: sizes,
      stockQuantity: json['stockQuantity'] as int? ?? 0,
      lowStockThreshold: json['lowStockThreshold'] as int? ?? 10,
      isActive: json['isActive'] as bool? ?? true,
    );
  }

  double getPriceForSize(String? sizeName) {
    if (sizeName != null && sizes.isNotEmpty) {
      final found = sizes.where((s) => s.name == sizeName);
      if (found.isNotEmpty && found.first.salesPrice > 0) {
        return found.first.salesPrice;
      }
    }
    return salesPrice > 0 ? salesPrice : mrp;
  }

  double getMrpForSize(String? sizeName) {
    if (sizeName != null && sizes.isNotEmpty) {
      final found = sizes.where((s) => s.name == sizeName);
      if (found.isNotEmpty && found.first.mrp > 0) {
        return found.first.mrp;
      }
    }
    return mrp;
  }
}

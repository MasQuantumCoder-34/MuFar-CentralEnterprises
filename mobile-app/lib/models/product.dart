class ProductSize {
  final String name;
  final double mrp;
  final double salesPrice;
  final int stockQuantity;
  final int lowStockThreshold;

  ProductSize({
    required this.name,
    required this.mrp,
    required this.salesPrice,
    this.stockQuantity = 0,
    this.lowStockThreshold = 10,
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
      stockQuantity: map['stockQuantity'] as int? ?? 0,
      lowStockThreshold: map['lowStockThreshold'] as int? ?? 10,
    );
  }
}

class Product {
  final String id;
  final String name;
  final int pieces;
  final String? categoryId;
  final String? categoryName;
  final List<String> images;
  final List<ProductSize> sizes;
  final int totalStockFallback;
  final int lowStockThresholdFallback;
  final bool isActive;

  Product({
    required this.id,
    required this.name,
    this.pieces = 1,
    this.categoryId,
    this.categoryName,
    this.images = const [],
    this.sizes = const [],
    this.totalStockFallback = 0,
    this.lowStockThresholdFallback = 10,
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
      pieces: json['pieces'] as int? ?? 1,
      categoryId: catId,
      categoryName: catName,
      images: json['images'] != null ? List<String>.from(json['images'] as List) : [],
      sizes: sizes,
      totalStockFallback: json['stockQuantity'] as int? ?? 0,
      lowStockThresholdFallback: json['lowStockThreshold'] as int? ?? 10,
      isActive: json['isActive'] as bool? ?? true,
    );
  }

  int get totalStock {
    final sizeSum = sizes.fold(0, (sum, s) => sum + s.stockQuantity);
    return sizeSum > 0 ? sizeSum : totalStockFallback;
  }

  String stockDisplay() {
    if (sizes.isEmpty) return totalStockFallback > 0 ? 'Total: $totalStockFallback' : '0';
    final sizeSum = sizes.fold(0, (sum, s) => sum + s.stockQuantity);
    if (sizeSum > 0) {
      final perSize = sizes.map((s) => '${s.name}:${s.stockQuantity}').join(' | ');
      return '$perSize | Total: $sizeSum';
    }
    if (totalStockFallback > 0) {
      if (sizes.length == 1) return '${sizes.first.name}:$totalStockFallback | Total: $totalStockFallback';
      return 'Total: $totalStockFallback';
    }
    return sizes.map((s) => '${s.name}:0').join(' | ');
  }

  double getPriceForSize(String? sizeName) {
    if (sizeName != null && sizes.isNotEmpty) {
      final found = sizes.where((s) => s.name == sizeName);
      if (found.isNotEmpty && found.first.salesPrice > 0) {
        return found.first.salesPrice;
      }
    }
    return sizes.isNotEmpty ? sizes.first.salesPrice : 0;
  }

  double getMrpForSize(String? sizeName) {
    if (sizeName != null && sizes.isNotEmpty) {
      final found = sizes.where((s) => s.name == sizeName);
      if (found.isNotEmpty && found.first.mrp > 0) {
        return found.first.mrp;
      }
    }
    return sizes.isNotEmpty ? sizes.first.mrp : 0;
  }
}

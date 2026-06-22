class OrderItem {
  final String? productId;
  final String productName;
  final String sku;
  final int quantity;
  final double price;
  final double total;
  final String? size;

  OrderItem({
    this.productId,
    required this.productName,
    this.sku = '',
    required this.quantity,
    required this.price,
    required this.total,
    this.size,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    final product = json['product'];
    String? productId;
    if (product is Map<String, dynamic>) {
      productId = (product['_id'] ?? product['id']) as String?;
    } else if (product is String) {
      productId = product;
    }

    return OrderItem(
      productId: productId,
      productName: json['productName'] as String? ?? '',
      sku: json['sku'] as String? ?? '',
      quantity: json['quantity'] as int? ?? 0,
      price: (json['price'] as num?)?.toDouble() ?? 0,
      total: (json['total'] as num?)?.toDouble() ?? 0,
      size: json['size'] as String?,
    );
  }
}

class TimelineEntry {
  final String status;
  final String? note;
  final String timestamp;

  TimelineEntry({
    required this.status,
    this.note,
    required this.timestamp,
  });

  factory TimelineEntry.fromJson(Map<String, dynamic> json) {
    return TimelineEntry(
      status: json['status'] as String? ?? '',
      note: json['note'] as String?,
      timestamp: json['timestamp'] as String? ?? '',
    );
  }
}

class Order {
  final String id;
  final String orderNumber;
  final String invoiceNumber;
  final String? clientId;
  final String? clientName;
  final List<OrderItem> items;
  final String deliveryAddress;
  final String contactNumber;
  final String? notes;
  final String status;
  final String? expectedDeliveryDate;
  final String? deliveredAt;
  final String? cancelledAt;
  final String? cancellationReason;
  final double subtotal;
  final double discount;
  final double tax;
  final double total;
  final List<TimelineEntry> timeline;
  final String createdAt;
  final String updatedAt;

  Order({
    required this.id,
    required this.orderNumber,
    this.invoiceNumber = '',
    this.clientId,
    this.clientName,
    this.items = const [],
    this.deliveryAddress = '',
    this.contactNumber = '',
    this.notes,
    this.status = 'pending',
    this.expectedDeliveryDate,
    this.deliveredAt,
    this.cancelledAt,
    this.cancellationReason,
    this.subtotal = 0,
    this.discount = 0,
    this.tax = 0,
    this.total = 0,
    this.timeline = const [],
    this.createdAt = '',
    this.updatedAt = '',
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    final client = json['client'];
    String? clientId;
    String? clientName;
    if (client is Map<String, dynamic>) {
      clientId = client['_id'] as String?;
      clientName = client['storeName'] as String? ?? client['name'] as String? ?? client['email'] as String?;
    } else if (client is String) {
      clientId = client;
    }

    return Order(
      id: json['_id'] as String? ?? '',
      orderNumber: json['orderNumber'] as String? ?? '',
      invoiceNumber: json['invoiceNumber'] as String? ?? '',
      clientId: clientId,
      clientName: clientName,
      items: json['items'] != null
          ? (json['items'] as List).map((e) => OrderItem.fromJson(e as Map<String, dynamic>)).toList()
          : [],
      deliveryAddress: json['deliveryAddress'] as String? ?? '',
      contactNumber: json['contactNumber'] as String? ?? '',
      notes: json['notes'] as String?,
      status: json['status'] as String? ?? 'pending',
      expectedDeliveryDate: json['expectedDeliveryDate'] as String?,
      deliveredAt: json['deliveredAt'] as String?,
      cancelledAt: json['cancelledAt'] as String?,
      cancellationReason: json['cancellationReason'] as String?,
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0,
      discount: (json['discount'] as num?)?.toDouble() ?? 0,
      tax: (json['tax'] as num?)?.toDouble() ?? 0,
      total: (json['total'] as num?)?.toDouble() ?? 0,
      timeline: json['timeline'] != null
          ? (json['timeline'] as List).map((e) => TimelineEntry.fromJson(e as Map<String, dynamic>)).toList()
          : [],
      createdAt: json['createdAt'] as String? ?? '',
      updatedAt: json['updatedAt'] as String? ?? '',
    );
  }
}

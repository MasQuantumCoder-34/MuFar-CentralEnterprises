class ApiResponse<T> {
  final bool success;
  final String? message;
  final T? data;
  final String? error;
  final Map<String, List<String>>? errors;
  final Meta? meta;

  ApiResponse({
    required this.success,
    this.message,
    this.data,
    this.error,
    this.errors,
    this.meta,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T? Function(dynamic)? dataParser,
  ) {
    return ApiResponse(
      success: json['success'] as bool? ?? false,
      message: json['message'] as String?,
      data: json['data'] != null && dataParser != null
          ? dataParser(json['data'])
          : null,
      error: json['error'] as String?,
      errors: json['errors'] != null
          ? (json['errors'] as Map<String, dynamic>).map(
              (k, v) => MapEntry(k, List<String>.from(v as List)),
            )
          : null,
      meta: json['meta'] != null
          ? Meta.fromJson(json['meta'] as Map<String, dynamic>)
          : null,
    );
  }
}

class Meta {
  final int page;
  final int limit;
  final int total;
  final int totalPages;

  Meta({
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
  });

  factory Meta.fromJson(Map<String, dynamic> json) {
    return Meta(
      page: json['page'] as int? ?? 1,
      limit: json['limit'] as int? ?? 10,
      total: json['total'] as int? ?? 0,
      totalPages: json['totalPages'] as int? ?? 0,
    );
  }
}

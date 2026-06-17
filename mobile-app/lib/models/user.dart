class User {
  final String id;
  final String? storeName;
  final String? ownerName;
  final String? name;
  final String? email;
  final String? mobile;
  final String? role;
  final String? gstNumber;
  final String? address;
  final String? city;
  final String? state;
  final String? pincode;
  final String? profileImage;
  final int totalOrders;
  final bool isActive;

  User({
    required this.id,
    this.storeName,
    this.ownerName,
    this.name,
    this.email,
    this.mobile,
    this.role,
    this.gstNumber,
    this.address,
    this.city,
    this.state,
    this.pincode,
    this.profileImage,
    this.totalOrders = 0,
    this.isActive = true,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'] as String? ?? '',
      storeName: json['storeName'] as String?,
      ownerName: json['ownerName'] as String?,
      name: json['name'] as String?,
      email: json['email'] as String?,
      mobile: json['mobile'] as String?,
      role: json['role'] as String?,
      gstNumber: json['gstNumber'] as String?,
      address: json['address'] as String?,
      city: json['city'] as String?,
      state: json['state'] as String?,
      pincode: json['pincode'] as String?,
      profileImage: json['profileImage'] as String?,
      totalOrders: json['totalOrders'] as int? ?? 0,
      isActive: json['isActive'] as bool? ?? true,
    );
  }

  String get displayName => storeName ?? name ?? ownerName ?? email ?? 'User';
}

class LoginResponse {
  final String accessToken;
  final String refreshToken;
  final User user;

  LoginResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      accessToken: json['accessToken'] as String? ?? '',
      refreshToken: json['refreshToken'] as String? ?? '',
      user: User.fromJson(json['user'] as Map<String, dynamic>? ?? {}),
    );
  }
}

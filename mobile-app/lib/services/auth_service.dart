import 'dart:convert';
import '../models/user.dart';
import '../models/api_response.dart';
import 'api_client.dart';
import 'api_endpoints.dart';

class AuthService {
  final ApiClient _api = ApiClient();

  Future<ApiResponse<LoginResponse>> login(String email, String password) async {
    try {
      final res = await _api.post(ApiEndpoints.login, body: {
        'email': email,
        'password': password,
      }, auth: false);

      final body = jsonDecode(res.body) as Map<String, dynamic>;

      if (res.statusCode == 200 && body['success'] == true) {
        final loginRes = LoginResponse.fromJson(body['data'] as Map<String, dynamic>);
        await _api.saveTokens(loginRes.accessToken, loginRes.refreshToken);
        return ApiResponse(success: true, data: loginRes);
      }

      return ApiResponse(
        success: false,
        message: body['message'] as String? ?? 'Invalid credentials',
        error: body['error'] as String?,
      );
    } catch (e) {
      return ApiResponse(success: false, message: 'Network error. Please try again.');
    }
  }

  Future<ApiResponse<User>> getProfile() async {
    try {
      final res = await _api.get(ApiEndpoints.me);
      final body = jsonDecode(res.body) as Map<String, dynamic>;

      if (res.statusCode == 200 && body['success'] == true) {
        final user = User.fromJson(body['data'] as Map<String, dynamic>);
        return ApiResponse(success: true, data: user);
      }

      return ApiResponse(success: false, message: body['message'] as String?);
    } catch (e) {
      return ApiResponse(success: false, message: 'Failed to load profile');
    }
  }

  Future<void> logout() async {
    await _api.clearTokens();
  }

  Future<bool> isLoggedIn() async {
    final token = await _api.accessToken;
    return token != null && token.isNotEmpty;
  }
}

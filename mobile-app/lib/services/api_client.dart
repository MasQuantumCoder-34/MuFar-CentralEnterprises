import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_endpoints.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  final _storage = const FlutterSecureStorage();
  final _client = http.Client();
  bool _isRefreshing = false;
  final List<void Function(String)> _refreshQueue = [];

  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';

  Future<String?> get accessToken => _storage.read(key: _accessTokenKey);
  Future<String?> get refreshToken => _storage.read(key: _refreshTokenKey);

  Future<void> saveTokens(String access, String refresh) async {
    await _storage.write(key: _accessTokenKey, value: access);
    await _storage.write(key: _refreshTokenKey, value: refresh);
  }

  Future<void> clearTokens() async {
    await _storage.delete(key: _accessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
  }

  Future<Map<String, String>> _headers({bool auth = true}) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (auth) {
      final token = await accessToken;
      if (token != null) headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Future<http.Response> _requestWithRefresh(Future<http.Response> Function() request) async {
    var response = await request();
    if (response.statusCode == 401) {
      final newToken = await _refreshAccessToken();
      if (newToken != null) {
        response = await request();
      }
    }
    return response;
  }

  Future<String?> _refreshAccessToken() async {
    if (_isRefreshing) {
      return await Future.delayed(const Duration(milliseconds: 300), () => null);
    }
    _isRefreshing = true;
    try {
      final rt = await refreshToken;
      if (rt == null) return null;
      final res = await http.post(
        Uri.parse('${ApiEndpoints.baseUrl}${ApiEndpoints.refresh}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': rt}),
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        final newAccess = data['accessToken'] as String?;
        final newRefresh = data['refreshToken'] as String?;
        if (newAccess != null) {
          await saveTokens(newAccess, newRefresh ?? rt);
          return newAccess;
        }
      }
      await clearTokens();
      return null;
    } catch (_) {
      await clearTokens();
      return null;
    } finally {
      _isRefreshing = false;
    }
  }

  Future<http.Response> get(String endpoint, {Map<String, String>? queryParams, bool auth = true}) async {
    var uri = Uri.parse('${ApiEndpoints.baseUrl}$endpoint');
    if (queryParams != null) uri = uri.replace(queryParameters: queryParams);
    return _requestWithRefresh(() async {
      return _client.get(uri, headers: await _headers(auth: auth));
    });
  }

  Future<http.Response> post(String endpoint, {Map<String, dynamic>? body, bool auth = true}) async {
    return _requestWithRefresh(() async {
      return _client.post(
        Uri.parse('${ApiEndpoints.baseUrl}$endpoint'),
        headers: await _headers(auth: auth),
        body: body != null ? jsonEncode(body) : null,
      );
    });
  }

  Future<http.Response> put(String endpoint, {Map<String, dynamic>? body, bool auth = true}) async {
    return _requestWithRefresh(() async {
      return _client.put(
        Uri.parse('${ApiEndpoints.baseUrl}$endpoint'),
        headers: await _headers(auth: auth),
        body: body != null ? jsonEncode(body) : null,
      );
    });
  }

  Future<http.Response> delete(String endpoint, {bool auth = true}) async {
    return _requestWithRefresh(() async {
      return _client.delete(
        Uri.parse('${ApiEndpoints.baseUrl}$endpoint'),
        headers: await _headers(auth: auth),
      );
    });
  }
}

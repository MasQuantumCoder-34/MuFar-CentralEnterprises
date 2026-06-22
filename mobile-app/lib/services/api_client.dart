import 'dart:async';
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

  static const _emailKey = 'saved_email';
  static const _passwordKey = 'saved_password';

  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _isLoggedInKey = 'is_logged_in';

  // Refresh queue: multiple callers wait on the same refresh attempt
  Completer<String?>? _refreshCompleter;

  Future<String?> get accessToken => _storage.read(key: _accessTokenKey);
  Future<String?> get refreshToken => _storage.read(key: _refreshTokenKey);
  Future<bool> get isLoggedIn async {
    final flag = await _storage.read(key: _isLoggedInKey);
    return flag == 'true';
  }

  Future<void> saveTokens(String access, String refresh) async {
    await _storage.write(key: _accessTokenKey, value: access);
    await _storage.write(key: _refreshTokenKey, value: refresh);
    await _storage.write(key: _isLoggedInKey, value: 'true');
  }

  Future<void> clearTokens() async {
    await _storage.delete(key: _accessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
    await _storage.delete(key: _isLoggedInKey);
  }

  Future<void> saveCredentials(String email, String password) async {
    await _storage.write(key: _emailKey, value: email);
    await _storage.write(key: _passwordKey, value: password);
  }

  Future<void> clearCredentials() async {
    await _storage.delete(key: _emailKey);
    await _storage.delete(key: _passwordKey);
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

  Future<http.Response> _requestWithRefresh(Future<http.Response> Function() request, {bool auth = true}) async {
    try {
      var response = await request();
      if (response.statusCode == 401 && auth) {
        final newToken = await _refreshAccessToken();
        if (newToken != null) {
          response = await request();
        }
      }
      return response;
    } on TimeoutException {
      rethrow;
    } on http.ClientException {
      rethrow;
    }
  }

  Future<String?> _refreshAccessToken() async {
    // If a refresh is already in progress, wait for it
    if (_refreshCompleter != null) {
      return _refreshCompleter!.future;
    }

    _refreshCompleter = Completer<String?>();
    try {
      final rt = await refreshToken;
      if (rt == null) {
        final autoResult = await _tryAutoLogin();
        _refreshCompleter!.complete(autoResult);
        return autoResult;
      }
      final res = await http.post(
        Uri.parse('${ApiEndpoints.baseUrl}${ApiEndpoints.refresh}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': rt}),
      ).timeout(const Duration(seconds: 15));
      if (res.statusCode == 200) {
        final body = jsonDecode(res.body) as Map<String, dynamic>;
        final data = body['data'] as Map<String, dynamic>?;
        final newAccess = data?['accessToken'] as String?;
        final newRefresh = data?['refreshToken'] as String?;
        if (newAccess != null) {
          await saveTokens(newAccess, newRefresh ?? rt);
          _refreshCompleter!.complete(newAccess);
          return newAccess;
        }
      }
      // Refresh token expired — try auto-login
      final autoResult = await _tryAutoLogin();
      _refreshCompleter!.complete(autoResult);
      return autoResult;
    } catch (_) {
      final autoResult = await _tryAutoLogin();
      _refreshCompleter!.complete(autoResult);
      return autoResult;
    } finally {
      _refreshCompleter = null;
    }
  }

  Future<String?> _tryAutoLogin() async {
    try {
      final email = await _storage.read(key: _emailKey);
      final password = await _storage.read(key: _passwordKey);
      if (email == null || password == null) return null;
      final res = await http.post(
        Uri.parse('${ApiEndpoints.baseUrl}${ApiEndpoints.login}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      ).timeout(const Duration(seconds: 15));
      if (res.statusCode == 200) {
        final body = jsonDecode(res.body) as Map<String, dynamic>;
        if (body['success'] == true) {
          final data = body['data'] as Map<String, dynamic>;
          final access = data['accessToken'] as String;
          final refresh = data['refreshToken'] as String;
          await saveTokens(access, refresh);
          return access;
        }
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<http.Response> get(String endpoint, {Map<String, String>? queryParams, bool auth = true}) async {
    var uri = Uri.parse('${ApiEndpoints.baseUrl}$endpoint');
    if (queryParams != null) uri = uri.replace(queryParameters: queryParams);
    return _requestWithRefresh(() async {
      final headers = await _headers(auth: auth);
      return _client.get(uri, headers: headers).timeout(const Duration(seconds: 15));
    }, auth: auth);
  }

  Future<http.Response> post(String endpoint, {Map<String, dynamic>? body, bool auth = true}) async {
    return _requestWithRefresh(() async {
      final headers = await _headers(auth: auth);
      return _client.post(
        Uri.parse('${ApiEndpoints.baseUrl}$endpoint'),
        headers: headers,
        body: body != null ? jsonEncode(body) : null,
      ).timeout(const Duration(seconds: 15));
    }, auth: auth);
  }

  Future<http.Response> put(String endpoint, {Map<String, dynamic>? body, bool auth = true}) async {
    return _requestWithRefresh(() async {
      final headers = await _headers(auth: auth);
      return _client.put(
        Uri.parse('${ApiEndpoints.baseUrl}$endpoint'),
        headers: headers,
        body: body != null ? jsonEncode(body) : null,
      ).timeout(const Duration(seconds: 15));
    }, auth: auth);
  }

  Future<http.Response> delete(String endpoint, {bool auth = true}) async {
    return _requestWithRefresh(() async {
      final headers = await _headers(auth: auth);
      return _client.delete(
        Uri.parse('${ApiEndpoints.baseUrl}$endpoint'),
        headers: headers,
      ).timeout(const Duration(seconds: 15));
    }, auth: auth);
  }

  Future<http.Response> uploadFiles(String endpoint, List<MapEntry<String, String>> files, {bool auth = true}) async {
    return _requestWithRefresh(() async {
      final uri = Uri.parse('${ApiEndpoints.baseUrl}$endpoint');
      final request = http.MultipartRequest('POST', uri);
      final token = await accessToken;
      if (auth && token != null) {
        request.headers['Authorization'] = 'Bearer $token';
      }
      for (final entry in files) {
        request.files.add(await http.MultipartFile.fromPath(entry.key, entry.value));
      }
      final streamed = await request.send().timeout(const Duration(seconds: 30));
      return http.Response.fromStream(streamed);
    }, auth: auth);
  }
}

import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/auth_service.dart';

enum AuthStatus { uninitialized, authenticated, unauthenticated, loading }

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();

  AuthStatus _status = AuthStatus.uninitialized;
  User? _user;
  String? _error;

  AuthStatus get status => _status;
  User? get user => _user;
  String? get error => _error;

  Future<void> tryAutoLogin() async {
    final loggedIn = await _authService.isLoggedIn();
    if (!loggedIn) {
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return;
    }
    _status = AuthStatus.authenticated;
    notifyListeners();
    loadProfile();
  }

  Future<bool> login(String email, String password) async {
    _status = AuthStatus.loading;
    _error = null;
    notifyListeners();

    final result = await _authService.login(email, password);
    if (result.success && result.data != null) {
      _user = result.data!.user;
      _status = AuthStatus.authenticated;
      notifyListeners();
      return true;
    }

    _error = result.message ?? 'Login failed';
    _status = AuthStatus.unauthenticated;
    notifyListeners();
    return false;
  }

  Future<void> loadProfile() async {
    final result = await _authService.getProfile();
    if (result.success && result.data != null) {
      _user = result.data;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }
}

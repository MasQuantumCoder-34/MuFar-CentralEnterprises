import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'screens/login/login_screen.dart';
import 'screens/main_shell.dart';
import 'theme/app_theme.dart';

class CentralEnterprisesApp extends StatelessWidget {
  const CentralEnterprisesApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Mufar Central Enterprises',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          switch (auth.status) {
            case AuthStatus.uninitialized:
              return const Scaffold(
                body: Center(
                  child: CircularProgressIndicator(),
                ),
              );
            case AuthStatus.authenticated:
              return const MainShell();
            case AuthStatus.unauthenticated:
            case AuthStatus.loading:
              return const LoginScreen();
          }
        },
      ),
    );
  }
}

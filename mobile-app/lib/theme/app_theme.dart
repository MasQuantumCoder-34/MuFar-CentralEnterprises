import 'package:flutter/material.dart';

class AppTheme {
  static const Color primary = Color(0xFF164A62);
  static const Color primaryLight = Color(0xFF2E6B84);
  static const Color primaryDark = Color(0xFF0E3446);
  static const Color accent = Color(0xFF78B46A);
  static const Color accentDark = Color(0xFF5A9A4E);
  static const Color background = Color(0xFFF8F9FA);
  static const Color surface = Colors.white;
  static const Color surfaceVariant = Color(0xFFF1F3F5);
  static const Color textPrimary = Color(0xFF1A1A2E);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color textTertiary = Color(0xFF9CA3AF);
  static const Color error = Color(0xFFDC2626);
  static const Color warning = Color(0xFFF59E0B);
  static const Color success = Color(0xFF10B981);
  static const Color border = Color(0xFFE5E7EB);

  static const TextStyle _heading1 = TextStyle(
    fontSize: 26, fontWeight: FontWeight.w700, color: textPrimary, height: 1.3,
  );
  static const TextStyle _heading2 = TextStyle(
    fontSize: 20, fontWeight: FontWeight.w700, color: textPrimary, height: 1.3,
  );
  static const TextStyle _heading3 = TextStyle(
    fontSize: 17, fontWeight: FontWeight.w600, color: textPrimary, height: 1.3,
  );
  static const TextStyle _body = TextStyle(
    fontSize: 14, fontWeight: FontWeight.w400, color: textPrimary, height: 1.5,
  );
  static const TextStyle _bodySmall = TextStyle(
    fontSize: 12, fontWeight: FontWeight.w400, color: textSecondary, height: 1.4,
  );
  static const TextStyle _caption = TextStyle(
    fontSize: 11, fontWeight: FontWeight.w500, color: textTertiary, height: 1.3,
  );

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.light(
        primary: primary,
        onPrimary: Colors.white,
        primaryContainer: primary.withOpacity(0.12),
        secondary: accent,
        onSecondary: Colors.white,
        secondaryContainer: accent.withOpacity(0.12),
        surface: surface,
        onSurface: textPrimary,
        surfaceContainerHighest: surfaceVariant,
        error: error,
        onError: Colors.white,
        outline: border,
      ),
      scaffoldBackgroundColor: background,
      textTheme: const TextTheme(
        displayLarge: _heading1,
        headlineLarge: _heading1,
        headlineMedium: _heading2,
        titleLarge: _heading2,
        titleMedium: _heading3,
        bodyLarge: _body,
        bodyMedium: _body,
        bodySmall: _bodySmall,
        labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: textPrimary),
        labelMedium: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: textPrimary),
        labelSmall: _caption,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: primary,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Colors.white),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(bottom: Radius.circular(16)),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 50),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(
            fontSize: 15, fontWeight: FontWeight.w600,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primary,
          side: const BorderSide(color: border),
          minimumSize: const Size(double.infinity, 50),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceVariant,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: error),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        labelStyle: const TextStyle(color: textSecondary, fontSize: 14),
        hintStyle: const TextStyle(color: textTertiary, fontSize: 14),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: border),
        ),
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      ),
      chipTheme: ChipThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        selectedColor: primary,
        backgroundColor: surfaceVariant,
        disabledColor: surfaceVariant,
        labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: textPrimary),
        secondaryLabelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Colors.white),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        side: const BorderSide(color: border),
      ),
      dividerTheme: const DividerThemeData(
        color: border,
        thickness: 1,
        space: 1,
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: surface,
        selectedItemColor: primary,
        unselectedItemColor: textTertiary,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
    );
  }
}

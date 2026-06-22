import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class AppDialog {
  static Future<bool?> showConfirm(
    BuildContext context, {
    required String title,
    required Widget content,
    String cancelLabel = 'Cancel',
    String confirmLabel = 'Confirm',
    Color confirmColor = AppTheme.primaryDark,
  }) {
    return showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          content,
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.error,
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 44),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: () => Navigator.pop(ctx, false),
              child: Text(cancelLabel,
                  style: const TextStyle(color: Colors.white)),
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: confirmColor,
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 44),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: () => Navigator.pop(ctx, true),
              child: Text(confirmLabel),
            ),
          ),
        ]),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class LoadingWidget extends StatelessWidget {
  final String? message;

  const LoadingWidget({super.key, this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(
            width: 36, height: 36,
            child: CircularProgressIndicator(
              strokeWidth: 3,
              color: AppTheme.primary,
            ),
          ),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(message!,
                style: const TextStyle(
                    color: AppTheme.textSecondary, fontSize: 14)),
          ],
        ],
      ),
    );
  }
}

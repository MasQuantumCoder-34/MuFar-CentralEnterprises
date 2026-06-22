import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class StatusBadge extends StatelessWidget {
  final String status;
  final double fontSize;

  const StatusBadge({super.key, required this.status, this.fontSize = 11});

  @override
  Widget build(BuildContext context) {
    final config = _getConfig(status);
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 10, vertical: fontSize > 11 ? 4 : 3),
      decoration: BoxDecoration(
        color: config.color,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        config.label,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          color: Colors.white,
          fontSize: fontSize,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.3,
        ),
      ),
    );
  }

  _StatusConfig _getConfig(String status) {
    switch (status) {
      case 'pending':
        return _StatusConfig(AppTheme.warning, 'Pending');
      case 'processing':
        return _StatusConfig(AppTheme.primaryLight, 'Processing');
      case 'out_for_delivery':
        return _StatusConfig(AppTheme.primary, 'Out for Delivery');
      case 'delivered':
        return _StatusConfig(AppTheme.success, 'Delivered');
      case 'cancelled':
        return _StatusConfig(AppTheme.error, 'Cancelled');
      default:
        return _StatusConfig(AppTheme.textSecondary, status);
    }
  }
}

class _StatusConfig {
  final Color color;
  final String label;
  _StatusConfig(this.color, this.label);
}

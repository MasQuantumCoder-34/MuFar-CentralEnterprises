import 'package:flutter/material.dart';
import 'dart:convert';
import '../../services/api_client.dart';
import '../../services/api_endpoints.dart';
import '../../theme/app_theme.dart';
import '../../widgets/loading_widget.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final ApiClient _api = ApiClient();
  List<Map<String, dynamic>> _notifications = [];
  bool _loading = true;
  String? _typeFilter;

  static const _allTypes = [
    'new_order',
    'order_processing',
    'order_out_for_delivery',
    'order_delivered',
    'order_cancelled',
    'low_stock',
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final params = <String, String>{};
      if (_typeFilter != null) params['type'] = _typeFilter!;
      final res = await _api.get(ApiEndpoints.notifications, queryParams: params);
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        final list = body['data'] as List;
        setState(() {
          _notifications = list.map((e) => e as Map<String, dynamic>).toList();
        });
      }
    } catch (_) {}
    setState(() => _loading = false);
  }

  int get _unreadCount => _notifications.where((n) => n['isRead'] != true).length;

  Future<void> _markRead(String id) async {
    try {
      await _api.put('${ApiEndpoints.notifications}/$id/read');
      _load();
    } catch (_) {}
  }

  Future<void> _markAllRead() async {
    try {
      await _api.put('${ApiEndpoints.notifications}/read-all');
      _load();
    } catch (_) {}
  }

  String _typeLabel(String? t) {
    if (t == null) return 'All';
    return t.replaceAll('_', ' ').replaceAll('order ', '');
  }

  IconData _typeIcon(String? type) {
    switch (type) {
      case 'new_order': return Icons.shopping_cart;
      case 'order_processing': return Icons.pending;
      case 'order_out_for_delivery': return Icons.local_shipping;
      case 'order_delivered': return Icons.check_circle;
      case 'order_cancelled': return Icons.cancel;
      case 'low_stock': return Icons.inventory;
      default: return Icons.notifications;
    }
  }

  Color _typeColor(String? type) {
    switch (type) {
      case 'new_order': return AppTheme.primary;
      case 'order_processing': return AppTheme.accent;
      case 'order_out_for_delivery': return Colors.orange;
      case 'order_delivered': return AppTheme.success;
      case 'order_cancelled': return AppTheme.error;
      case 'low_stock': return Colors.amber;
      default: return AppTheme.textTertiary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (_unreadCount > 0)
            Padding(
              padding: const EdgeInsets.only(right: 4),
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text('$_unreadCount new', style: const TextStyle(fontSize: 11, color: AppTheme.primary, fontWeight: FontWeight.w600)),
                ),
              ),
            ),
          if (_unreadCount > 0)
            IconButton(
              icon: const Icon(Icons.done_all, size: 20),
              tooltip: 'Mark all read',
              onPressed: _markAllRead,
            ),
        ],
      ),
      body: Column(
        children: [
          Container(
            height: 44,
            color: AppTheme.surface,
            child: ListView(
              scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              children: [null, ..._allTypes].map((t) {
                final isSelected = _typeFilter == t;
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: FilterChip(
                    avatar: Icon(_typeIcon(t), size: 13, color: isSelected ? Colors.white : _typeColor(t)),
                    label: Text(_typeLabel(t), style: TextStyle(fontSize: 10, color: isSelected ? Colors.white : AppTheme.textPrimary)),
                    selected: isSelected, showCheckmark: false,
                    selectedColor: _typeColor(t).withOpacity(0.8),
                    backgroundColor: AppTheme.surfaceVariant,
                    side: BorderSide.none,
                    onSelected: (_) { setState(() => _typeFilter = t); _load(); },
                  ),
                );
              }).toList(),
            ),
          ),
          Expanded(
            child: _loading
                ? const LoadingWidget()
                : _notifications.isEmpty
                    ? Center(
                        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                          Icon(Icons.notifications_off_outlined, size: 52, color: AppTheme.textTertiary.withOpacity(0.5)),
                          const SizedBox(height: 14),
                          const Text('No notifications', style: TextStyle(fontSize: 16, color: AppTheme.textSecondary)),
                          const SizedBox(height: 4),
                          const Text('Notifications will appear here', style: TextStyle(fontSize: 12, color: AppTheme.textTertiary)),
                        ]),
                      )
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.builder(
                          padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
                          itemCount: _notifications.length,
                          itemBuilder: (_, i) {
                            final n = _notifications[i];
                            final isRead = n['isRead'] == true;
                            final type = n['type'] as String? ?? '';
                            return Card(
                              color: isRead ? null : AppTheme.primary.withOpacity(0.03),
                              elevation: isRead ? 0.5 : 1.5,
                              margin: const EdgeInsets.only(bottom: 6),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                                side: isRead ? BorderSide.none : BorderSide(color: AppTheme.primary.withOpacity(0.15)),
                              ),
                              child: InkWell(
                                borderRadius: BorderRadius.circular(12),
                                onTap: () {
                                  final id = n['_id'] as String?;
                                  if (id != null && !isRead) _markRead(id);
                                },
                                child: Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        width: 40, height: 40,
                                        decoration: BoxDecoration(
                                          color: (isRead ? AppTheme.surfaceVariant : _typeColor(type)).withOpacity(0.12),
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: Icon(_typeIcon(type),
                                            color: isRead ? AppTheme.textTertiary : _typeColor(type), size: 18),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              children: [
                                                Expanded(
                                                  child: Text(n['title'] as String? ?? '',
                                                      style: TextStyle(fontWeight: isRead ? FontWeight.normal : FontWeight.w600, fontSize: 13),
                                                      maxLines: 1, overflow: TextOverflow.ellipsis),
                                                ),
                                                if (!isRead)
                                                  Container(
                                                    width: 7, height: 7,
                                                    decoration: const BoxDecoration(color: AppTheme.primary, shape: BoxShape.circle),
                                                  ),
                                              ],
                                            ),
                                            const SizedBox(height: 4),
                                            Text(n['message'] as String? ?? '',
                                                style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                                                maxLines: 2, overflow: TextOverflow.ellipsis),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}

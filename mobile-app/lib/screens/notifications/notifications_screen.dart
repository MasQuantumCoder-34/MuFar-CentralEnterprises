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
  String _typeFilter = '';

  final _types = ['', 'new_order', 'processing', 'out_for_delivery', 'delivered', 'cancelled', 'low_stock'];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final params = <String, String>{};
      if (_typeFilter.isNotEmpty) params['type'] = _typeFilter;
      final res = await _api.get(ApiEndpoints.notifications, queryParams: params);
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        setState(() {
          _notifications = (body['data'] as List).map((e) => e as Map<String, dynamic>).toList();
          _loading = false;
        });
      }
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  int get _unreadCount => _notifications.where((n) => n['isRead'] != true).length;

  Future<void> _markRead(String id) async {
    try {
      await _api.put('/notifications/$id/read');
      _load();
    } catch (_) {}
  }

  Future<void> _markAllRead() async {
    try {
      await _api.put('/notifications/read-all');
      _load();
    } catch (_) {}
  }

  String _typeLabel(String t) => t.isEmpty ? 'All Types' : t.replaceAll('_', ' ');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (_unreadCount > 0)
            TextButton(onPressed: _markAllRead, child: const Text('Mark All Read', style: TextStyle(fontSize: 12))),
        ],
      ),
      body: Column(
        children: [
          Container(
            height: 48, color: AppTheme.surface,
            child: ListView(
              scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              children: _types.map((t) {
                final isSelected = _typeFilter == t;
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: FilterChip(
                    label: Text(_typeLabel(t), style: TextStyle(fontSize: 11, color: isSelected ? Colors.white : AppTheme.textPrimary)),
                    selected: isSelected, showCheckmark: false,
                    selectedColor: AppTheme.primary, backgroundColor: AppTheme.surfaceVariant,
                    side: BorderSide(color: isSelected ? AppTheme.primary : AppTheme.border),
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
                          Icon(Icons.notifications_off_outlined, size: 48, color: AppTheme.textTertiary),
                          const SizedBox(height: 12),
                          const Text('No notifications', style: TextStyle(color: AppTheme.textSecondary)),
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
                            return Card(
                              color: isRead ? null : AppTheme.primary.withOpacity(0.03),
                              margin: const EdgeInsets.only(bottom: 6),
                              child: ListTile(
                                leading: Stack(
                                  children: [
                                    Container(
                                      width: 40, height: 40,
                                      decoration: BoxDecoration(
                                        color: isRead ? AppTheme.surfaceVariant : AppTheme.primary.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Icon(isRead ? Icons.mail_outline : Icons.notifications_outlined,
                                          color: isRead ? AppTheme.textTertiary : AppTheme.primary, size: 20),
                                    ),
                                    if (!isRead)
                                      Positioned(right: 2, top: 2, child: Container(
                                        width: 8, height: 8,
                                        decoration: const BoxDecoration(color: AppTheme.primary, shape: BoxShape.circle),
                                      )),
                                  ],
                                ),
                                title: Text(n['title'] as String? ?? '', style: TextStyle(fontWeight: isRead ? null : FontWeight.w600, fontSize: 13)),
                                subtitle: Text(n['message'] as String? ?? '', style: const TextStyle(fontSize: 11)),
                                trailing: !isRead
                                    ? TextButton(
                                        onPressed: () => _markRead(n['_id'] as String),
                                        child: const Text('Read', style: TextStyle(fontSize: 11)),
                                      )
                                    : null,
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

import 'package:flutter/material.dart';
import 'dart:convert';
import '../../models/user.dart';
import '../../services/api_client.dart';
import '../../services/api_endpoints.dart';
import '../../theme/app_theme.dart';
import '../../widgets/loading_widget.dart';
import '../orders/create_order_screen.dart';
import 'add_client_screen.dart';

class ClientsScreen extends StatefulWidget {
  const ClientsScreen({super.key});

  @override
  State<ClientsScreen> createState() => _ClientsScreenState();
}

class _ClientsScreenState extends State<ClientsScreen> {
  final ApiClient _api = ApiClient();
  List<User> _clients = [];
  bool _loading = true;
  String? _error;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _loadClients();
  }

  Future<void> _loadClients() async {
    setState(() => _loading = true);
    try {
      final params = <String, String>{'role': 'client', 'limit': '100'};
      if (_search.isNotEmpty) params['search'] = _search;
      final res = await _api.get(ApiEndpoints.users, queryParams: params);
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        setState(() {
          _clients = (body['data'] as List)
              .map((e) => User.fromJson(e as Map<String, dynamic>))
              .toList();
          _loading = false;
        });
      } else {
        setState(() { _error = body['message'] as String?; _loading = false; });
      }
    } catch (_) {
      setState(() { _error = 'Network error'; _loading = false; });
    }
  }

  Future<void> _editClient(User client) async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => AddClientScreen(client: client)),
    );
    if (result == true) _loadClients();
  }

  Future<void> _deleteClient(User client) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Client'),
        content: Text('Delete "${client.storeName ?? client.name}"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await _api.delete('/users/${client.id}');
      _loadClients();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Client deleted'), backgroundColor: AppTheme.success, behavior: SnackBarBehavior.floating,
      ));
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Clients'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline),
            tooltip: 'Add Client',
            onPressed: () async {
              final result = await Navigator.push<bool>(context, MaterialPageRoute(builder: (_) => const AddClientScreen()));
              if (result == true) _loadClients();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search clients...', prefixIcon: const Icon(Icons.search, size: 20),
                filled: true, fillColor: AppTheme.surfaceVariant,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
              ),
              onChanged: (v) { _search = v; _loadClients(); },
            ),
          ),
          Expanded(
            child: _loading
                ? const LoadingWidget()
                : _error != null
                    ? Center(
                        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                          Icon(Icons.error_outline, size: 48, color: AppTheme.error),
                          const SizedBox(height: 12),
                          Text(_error!, style: const TextStyle(color: AppTheme.textSecondary)),
                          const SizedBox(height: 16),
                          ElevatedButton.icon(onPressed: _loadClients, icon: const Icon(Icons.refresh, size: 18), label: const Text('Retry')),
                        ]),
                      )
                    : _clients.isEmpty
                        ? Center(
                            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                              Icon(Icons.people_outline, size: 48, color: AppTheme.textTertiary),
                              const SizedBox(height: 12),
                              const Text('No clients found', style: TextStyle(color: AppTheme.textSecondary)),
                            ]),
                          )
                        : RefreshIndicator(
                            onRefresh: _loadClients,
                            child: ListView.builder(
                              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                              itemCount: _clients.length,
                              itemBuilder: (_, i) {
                                final client = _clients[i];
                                return Card(
                                  margin: const EdgeInsets.only(top: 6),
                                  child: Padding(
                                    padding: const EdgeInsets.all(10),
                                    child: Row(children: [
                                      CircleAvatar(
                                        backgroundColor: AppTheme.primary.withOpacity(0.1), radius: 18,
                                        child: Text(client.displayName.substring(0, 1).toUpperCase(),
                                            style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold)),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                          Text(client.storeName ?? client.name ?? client.email ?? '',
                                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                          if (client.ownerName != null)
                                            Text(client.ownerName!, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                                          if (client.mobile != null)
                                            Text(client.mobile!, style: const TextStyle(fontSize: 10, color: AppTheme.textTertiary)),
                                        ]),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: client.isActive ? AppTheme.success.withOpacity(0.1) : AppTheme.textTertiary.withOpacity(0.1),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(client.isActive ? 'Active' : 'Inactive',
                                            style: TextStyle(fontSize: 9, color: client.isActive ? AppTheme.success : AppTheme.textTertiary, fontWeight: FontWeight.w600)),
                                      ),
                                      PopupMenuButton<String>(
                                        icon: const Icon(Icons.more_vert, size: 18),
                                        onSelected: (v) {
                                          if (v == 'order') Navigator.push(context, MaterialPageRoute(builder: (_) => const CreateOrderScreen()));
                                          if (v == 'edit') _editClient(client);
                                          if (v == 'delete') _deleteClient(client);
                                        },
                                        itemBuilder: (_) => [
                                          const PopupMenuItem(value: 'order', child: Row(children: [Icon(Icons.shopping_cart_outlined, size: 16), SizedBox(width: 8), Text('Create Order')])),
                                          const PopupMenuItem(value: 'edit', child: Row(children: [Icon(Icons.edit_outlined, size: 16), SizedBox(width: 8), Text('Edit')])),
                                          const PopupMenuItem(value: 'delete', child: Row(children: [Icon(Icons.delete_outline, size: 16, color: AppTheme.error), SizedBox(width: 8), Text('Delete', style: TextStyle(color: AppTheme.error))])),
                                        ],
                                      ),
                                    ]),
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

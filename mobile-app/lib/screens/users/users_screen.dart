import 'package:flutter/material.dart';
import 'dart:convert';
import '../../models/user.dart';
import '../../services/api_client.dart';
import '../../services/api_endpoints.dart';
import '../../theme/app_theme.dart';
import '../../widgets/loading_widget.dart';

class UsersScreen extends StatefulWidget {
  const UsersScreen({super.key});

  @override
  State<UsersScreen> createState() => _UsersScreenState();
}

class _UsersScreenState extends State<UsersScreen> {
  final ApiClient _api = ApiClient();
  List<User> _users = [];
  bool _loading = true;
  String? _error;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final params = <String, String>{'limit': '100'};
      if (_search.isNotEmpty) params['search'] = _search;
      final res = await _api.get(ApiEndpoints.users, queryParams: params);
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        setState(() {
          _users = (body['data'] as List)
              .map((e) => User.fromJson(e as Map<String, dynamic>))
              .where((u) => u.role != 'client')
              .toList();
          _loading = false;
        });
      }
    } catch (_) {
      setState(() { _error = 'Network error'; _loading = false; });
    }
  }

  Future<void> _addUser() async {
    final nameCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    final mobileCtrl = TextEditingController();
    final passCtrl = TextEditingController();
    String selectedRole = 'sales_executive';
    final formKey = GlobalKey<FormState>();

    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add User'), contentPadding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
        content: Form(
          key: formKey,
          child: SingleChildScrollView(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              TextFormField(
                controller: nameCtrl, decoration: _inputDec('Name *'),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: emailCtrl, decoration: _inputDec('Email *'), keyboardType: TextInputType.emailAddress,
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 8),
              TextFormField(controller: mobileCtrl, decoration: _inputDec('Mobile'), keyboardType: TextInputType.phone),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: selectedRole, decoration: _inputDec('Role *'),
                items: ['sales_executive', 'manager', 'admin'].map((r) => DropdownMenuItem(value: r, child: Text(r.replaceAll('_', ' ')))).toList(),
                onChanged: (v) => selectedRole = v!,
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: passCtrl, decoration: _inputDec('Password (leave blank to auto-generate)'), obscureText: true,
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.error,
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 44),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () => Navigator.pop(ctx, false),
                  child: const Text('Cancel', style: TextStyle(color: Colors.white)),
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryDark,
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 44),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () { if (formKey.currentState!.validate()) Navigator.pop(ctx, true); },
                  child: const Text('Create'),
                ),
              ),
            ]),
          ),
        ),
      ),
    );

    if (result != true) { nameCtrl.dispose(); emailCtrl.dispose(); mobileCtrl.dispose(); passCtrl.dispose(); return; }
    try {
      final body = <String, dynamic>{
        'name': nameCtrl.text.trim(), 'email': emailCtrl.text.trim(), 'role': selectedRole,
      };
      if (mobileCtrl.text.trim().isNotEmpty) body['mobile'] = mobileCtrl.text.trim();
      if (passCtrl.text.trim().isNotEmpty) body['password'] = passCtrl.text.trim();
      final res = await _api.post('/auth/register', body: body);
      final resp = jsonDecode(res.body) as Map<String, dynamic>;
      if (resp['success'] == true) { _load(); if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('User created'), backgroundColor: AppTheme.success, behavior: SnackBarBehavior.floating)); }
    } catch (_) {}
    nameCtrl.dispose(); emailCtrl.dispose(); mobileCtrl.dispose(); passCtrl.dispose();
  }

  InputDecoration _inputDec(String label) => InputDecoration(
    labelText: label, filled: true, fillColor: AppTheme.surfaceVariant,
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
  );

  Color _roleColor(String role) {
    switch (role) {
      case 'super_admin': return AppTheme.error;
      case 'admin': return AppTheme.primary;
      case 'manager': return AppTheme.accent;
      default: return AppTheme.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Users'),
        actions: [
          IconButton(icon: const Icon(Icons.add_circle_outline), tooltip: 'Add User', onPressed: _addUser),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search users...', prefixIcon: const Icon(Icons.search, size: 20),
                filled: true, fillColor: AppTheme.surfaceVariant,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
              ),
              onChanged: (v) { _search = v; _load(); },
            ),
          ),
          Expanded(
            child: _loading
                ? const LoadingWidget()
                : _error != null
                    ? Center(child: Text(_error!))
                    : _users.isEmpty
                        ? const Center(child: Text('No users found'))
                        : RefreshIndicator(
                            onRefresh: _load,
                            child: ListView.builder(
                              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                              itemCount: _users.length,
                              itemBuilder: (_, i) {
                                final u = _users[i];
                                return Card(
                                  margin: const EdgeInsets.only(top: 6),
                                  child: ListTile(
                                    leading: CircleAvatar(
                                      backgroundColor: _roleColor(u.role ?? '').withOpacity(0.1), radius: 18,
                                      child: Text((u.name ?? '?').substring(0, 1).toUpperCase(), style: TextStyle(color: _roleColor(u.role ?? ''), fontWeight: FontWeight.bold)),
                                    ),
                                    title: Text(u.name ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                    subtitle: Text(u.email ?? '', style: const TextStyle(fontSize: 11)),
                                    trailing: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: _roleColor(u.role ?? '').withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(u.role?.replaceAll('_', ' ') ?? '', style: TextStyle(fontSize: 10, color: _roleColor(u.role ?? ''), fontWeight: FontWeight.w600)),
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

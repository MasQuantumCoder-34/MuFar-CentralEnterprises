import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final ApiClient _api = ApiClient();
  String _companyName = 'Central Enterprises';

  @override
  void initState() {
    super.initState();
    _loadCompany();
  }

  Future<void> _loadCompany() async {
    try {
      final res = await _api.get('/settings');
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        final d = body['data'] as Map<String, dynamic>;
        final name = d['companyName'] as String?;
        if (name != null && name.isNotEmpty) {
          setState(() => _companyName = name);
        }
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 24, 16, 32),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [AppTheme.primary, AppTheme.primary.withOpacity(0.75)],
                begin: Alignment.topLeft, end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              children: [
                CircleAvatar(
                  radius: 36,
                  backgroundColor: Colors.white.withOpacity(0.2),
                  child: Text(
                    (user?.displayName ?? 'U').substring(0, 1).toUpperCase(),
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 32),
                  ),
                ),
                const SizedBox(height: 12),
                Text(user?.displayName ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20)),
                if (user?.email != null)
                  Text(user!.email!, style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 14)),
              ],
            ),
          ),
          const SizedBox(height: 20),
          if (user?.mobile != null && user!.mobile!.isNotEmpty)
            _infoTile(Icons.phone_outlined, 'Mobile', user.mobile!),
          if (user?.gstNumber != null && user!.gstNumber!.isNotEmpty)
            _infoTile(Icons.description_outlined, 'GST', user.gstNumber!),
          if (user?.address != null && user!.address!.isNotEmpty)
            _infoTile(Icons.location_on_outlined, 'Address', user.address!),
          const SizedBox(height: 12),
          Card(
            child: ListTile(
              leading: Container(
                width: 40, height: 40,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.business, color: AppTheme.primary, size: 20),
              ),
              title: const Text('Company', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
              subtitle: Text(_companyName, style: const TextStyle(fontWeight: FontWeight.w500, color: AppTheme.textPrimary)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoTile(IconData icon, String label, String value) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          width: 40, height: 40,
          decoration: BoxDecoration(
            color: AppTheme.primary.withOpacity(0.08),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: AppTheme.primary, size: 20),
        ),
        title: Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
        subtitle: Text(value, style: const TextStyle(fontWeight: FontWeight.w500, color: AppTheme.textPrimary)),
      ),
    );
  }
}

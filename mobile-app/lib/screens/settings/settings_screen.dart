import 'package:flutter/material.dart';
import 'dart:convert';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/loading_widget.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _formKey = GlobalKey<FormState>();
  final ApiClient _api = ApiClient();

  final _companyCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _gstCtrl = TextEditingController();
  final _prefixCtrl = TextEditingController();
  final _thresholdCtrl = TextEditingController(text: '10');
  final _addressCtrl = TextEditingController();

  bool _loading = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _companyCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _gstCtrl.dispose();
    _prefixCtrl.dispose();
    _thresholdCtrl.dispose();
    _addressCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final res = await _api.get('/settings');
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        final d = body['data'] as Map<String, dynamic>;
        _companyCtrl.text = d['companyName'] as String? ?? '';
        _phoneCtrl.text = d['contactNumber'] as String? ?? '';
        _emailCtrl.text = d['email'] as String? ?? '';
        _gstCtrl.text = d['gstNumber'] as String? ?? '';
        _prefixCtrl.text = d['invoicePrefix'] as String? ?? '';
        _thresholdCtrl.text = (d['lowStockThreshold'] as int?)?.toString() ?? '10';
        _addressCtrl.text = d['address'] as String? ?? '';
      }
    } catch (_) {}
    setState(() => _loading = false);
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      final body = <String, dynamic>{
        'companyName': _companyCtrl.text.trim(),
        'contactNumber': _phoneCtrl.text.trim(),
        'email': _emailCtrl.text.trim(),
        'invoicePrefix': _prefixCtrl.text.trim(),
        'lowStockThreshold': int.tryParse(_thresholdCtrl.text.trim()) ?? 10,
      };
      if (_gstCtrl.text.trim().isNotEmpty) body['gstNumber'] = _gstCtrl.text.trim();
      if (_addressCtrl.text.trim().isNotEmpty) body['address'] = _addressCtrl.text.trim();

      final res = await _api.put('/settings', body: body);
      final resp = jsonDecode(res.body) as Map<String, dynamic>;
      if (resp['success'] == true) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Settings saved'), backgroundColor: AppTheme.success, behavior: SnackBarBehavior.floating,
        ));
      }
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Network error'), backgroundColor: AppTheme.error, behavior: SnackBarBehavior.floating,
      ));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: _loading
          ? const LoadingWidget()
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Company Information', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 16),
                    _field('Company Name *', _companyCtrl, required: true),
                    _field('Contact Number *', _phoneCtrl, required: true, keyboardType: TextInputType.phone),
                    _field('Email *', _emailCtrl, required: true, keyboardType: TextInputType.emailAddress),
                    _field('GST Number', _gstCtrl),
                    _field('Invoice Prefix *', _prefixCtrl, required: true),
                    _field('Low Stock Threshold *', _thresholdCtrl, required: true, keyboardType: TextInputType.number),
                    _field('Address', _addressCtrl, maxLines: 3),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _saving ? null : _save,
                        style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 50)),
                        child: _saving
                            ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Text('Save Settings'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _field(String label, TextEditingController ctrl, {bool required = false, TextInputType keyboardType = TextInputType.text, int maxLines = 1}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: ctrl, keyboardType: keyboardType, maxLines: maxLines,
        decoration: InputDecoration(
          labelText: required ? '$label *' : label, filled: true, fillColor: AppTheme.surfaceVariant,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        ),
        validator: required ? (v) => (v == null || v.trim().isEmpty) ? 'Required' : null : null,
      ),
    );
  }
}

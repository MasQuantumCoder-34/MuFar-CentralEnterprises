import 'package:flutter/material.dart';
import 'dart:convert';
import '../../services/api_client.dart';
import '../../services/api_endpoints.dart';
import '../../theme/app_theme.dart';

class AddClientScreen extends StatefulWidget {
  const AddClientScreen({super.key});

  @override
  State<AddClientScreen> createState() => _AddClientScreenState();
}

class _AddClientScreenState extends State<AddClientScreen> {
  final _formKey = GlobalKey<FormState>();
  final ApiClient _api = ApiClient();

  final _storeNameCtrl = TextEditingController();
  final _ownerNameCtrl = TextEditingController();
  final _mobileCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _gstCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  final _stateCtrl = TextEditingController();
  final _pincodeCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();

  bool _loading = false;

  @override
  void dispose() {
    _storeNameCtrl.dispose();
    _ownerNameCtrl.dispose();
    _mobileCtrl.dispose();
    _emailCtrl.dispose();
    _gstCtrl.dispose();
    _addressCtrl.dispose();
    _cityCtrl.dispose();
    _stateCtrl.dispose();
    _pincodeCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final body = <String, dynamic>{
        'storeName': _storeNameCtrl.text.trim(),
        'ownerName': _ownerNameCtrl.text.trim(),
        'role': 'client',
      };
      if (_mobileCtrl.text.trim().isNotEmpty) body['mobile'] = _mobileCtrl.text.trim();
      if (_emailCtrl.text.trim().isNotEmpty) body['email'] = _emailCtrl.text.trim();
      if (_gstCtrl.text.trim().isNotEmpty) body['gstNumber'] = _gstCtrl.text.trim();
      if (_addressCtrl.text.trim().isNotEmpty) body['address'] = _addressCtrl.text.trim();
      if (_cityCtrl.text.trim().isNotEmpty) body['city'] = _cityCtrl.text.trim();
      if (_stateCtrl.text.trim().isNotEmpty) body['state'] = _stateCtrl.text.trim();
      if (_pincodeCtrl.text.trim().isNotEmpty) body['pincode'] = _pincodeCtrl.text.trim();
      if (_passwordCtrl.text.trim().isNotEmpty) body['password'] = _passwordCtrl.text.trim();

      final res = await _api.post(ApiEndpoints.users, body: body);
      final resp = jsonDecode(res.body) as Map<String, dynamic>;
      if (resp['success'] == true) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Client created successfully'),
            backgroundColor: AppTheme.success,
            behavior: SnackBarBehavior.floating,
          ),
        );
        Navigator.pop(context, true);
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(resp['message'] as String? ?? 'Failed to create client'),
            backgroundColor: AppTheme.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Network error'),
          backgroundColor: AppTheme.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add Client')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Client Information',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 16),
              _buildField('Store Name', _storeNameCtrl, required: true),
              _buildField('Owner Name', _ownerNameCtrl, required: true),
              _buildField('Mobile', _mobileCtrl, keyboardType: TextInputType.phone),
              _buildField('Email', _emailCtrl, keyboardType: TextInputType.emailAddress),
              const SizedBox(height: 16),
              const Text('Additional Details',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 8),
              _buildField('GST Number', _gstCtrl),
              _buildField('Address', _addressCtrl),
              Row(
                children: [
                  Expanded(child: _buildField('City', _cityCtrl)),
                  const SizedBox(width: 8),
                  Expanded(child: _buildField('State', _stateCtrl)),
                ],
              ),
              _buildField('Pincode', _pincodeCtrl, keyboardType: TextInputType.number),
              const SizedBox(height: 16),
              _buildField('Password (leave blank for auto-generate)', _passwordCtrl,
                  obscureText: true),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _loading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 50),
                  ),
                  child: _loading
                      ? const SizedBox(
                          width: 22, height: 22,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white))
                      : const Text('Create Client'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildField(String label, TextEditingController ctrl,
      {bool required = false,
      TextInputType keyboardType = TextInputType.text,
      bool obscureText = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: ctrl,
        keyboardType: keyboardType,
        obscureText: obscureText,
        decoration: InputDecoration(
          labelText: required ? '$label *' : label,
          filled: true,
          fillColor: AppTheme.surfaceVariant,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        ),
        validator: required
            ? (v) => (v == null || v.trim().isEmpty) ? 'Required' : null
            : null,
      ),
    );
  }
}

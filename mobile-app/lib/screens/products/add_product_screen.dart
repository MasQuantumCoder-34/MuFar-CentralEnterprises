import 'package:flutter/material.dart';
import 'dart:convert';
import '../../models/category.dart';
import '../../services/api_client.dart';
import '../../services/api_endpoints.dart';
import '../../theme/app_theme.dart';

class _SizeEntry {
  final TextEditingController nameCtrl;
  final TextEditingController mrpCtrl;
  final TextEditingController salesPriceCtrl;
  _SizeEntry({required String name, required double mrp, required double salesPrice})
      : nameCtrl = TextEditingController(text: name),
        mrpCtrl = TextEditingController(text: mrp.toString()),
        salesPriceCtrl = TextEditingController(text: salesPrice.toString());
  void dispose() {
    nameCtrl.dispose();
    mrpCtrl.dispose();
    salesPriceCtrl.dispose();
  }
}

class AddProductScreen extends StatefulWidget {
  const AddProductScreen({super.key});

  @override
  State<AddProductScreen> createState() => _AddProductScreenState();
}

class _AddProductScreenState extends State<AddProductScreen> {
  final _formKey = GlobalKey<FormState>();
  final ApiClient _api = ApiClient();

  final _nameCtrl = TextEditingController();
  final _skuCtrl = TextEditingController();
  final _mrpCtrl = TextEditingController();
  final _salesPriceCtrl = TextEditingController();
  final _stockCtrl = TextEditingController();
  final _lowStockCtrl = TextEditingController(text: '10');
  final _imageCtrl = TextEditingController();

  String? _selectedCategoryId;
  List<Category> _categories = [];
  bool _loadingCategories = true;

  final List<_SizeEntry> _sizes = [];
  final _availableSizeNames = ['SM', 'M', 'L', 'XL', 'XXL'];

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _skuCtrl.dispose();
    _mrpCtrl.dispose();
    _salesPriceCtrl.dispose();
    _stockCtrl.dispose();
    _lowStockCtrl.dispose();
    _imageCtrl.dispose();
    for (final s in _sizes) {
      s.dispose();
    }
    super.dispose();
  }

  Future<void> _loadCategories() async {
    try {
      final res = await _api.get(ApiEndpoints.categories);
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        setState(() {
          _categories = (body['data'] as List)
              .map((e) => Category.fromJson(e as Map<String, dynamic>))
              .toList();
          _loadingCategories = false;
        });
      }
    } catch (_) {
      setState(() => _loadingCategories = false);
    }
  }

  List<String> get _remainingSizeNames =>
      _availableSizeNames.where((n) => !_sizes.any((s) => s.nameCtrl.text == n)).toList();

  void _addSize(String name) {
    setState(() {
      _sizes.add(_SizeEntry(name: name, mrp: double.tryParse(_mrpCtrl.text) ?? 0,
          salesPrice: double.tryParse(_salesPriceCtrl.text) ?? 0));
    });
  }

  void _removeSize(int index) {
    _sizes[index].dispose();
    setState(() => _sizes.removeAt(index));
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCategoryId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a category'),
          backgroundColor: AppTheme.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    setState(() => _loading = true);
    try {
      final body = <String, dynamic>{
        'name': _nameCtrl.text.trim(),
        'category': _selectedCategoryId,
        'mrp': double.parse(_mrpCtrl.text.trim()),
        'salesPrice': double.parse(_salesPriceCtrl.text.trim()),
        'stockQuantity': int.parse(_stockCtrl.text.trim()),
        'lowStockThreshold': int.parse(_lowStockCtrl.text.trim()),
      };
      if (_skuCtrl.text.trim().isNotEmpty) body['sku'] = _skuCtrl.text.trim();
      if (_imageCtrl.text.trim().isNotEmpty) {
        body['images'] = [_imageCtrl.text.trim()];
      }
      if (_sizes.isNotEmpty) {
        body['sizes'] = _sizes.map((s) => {
          'name': s.nameCtrl.text.trim(),
          'mrp': double.parse(s.mrpCtrl.text.trim()),
          'salesPrice': double.parse(s.salesPriceCtrl.text.trim()),
        }).toList();
      }

      final res = await _api.post(ApiEndpoints.products, body: body);
      final resp = jsonDecode(res.body) as Map<String, dynamic>;
      if (resp['success'] == true) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Product created successfully'),
            backgroundColor: AppTheme.success,
            behavior: SnackBarBehavior.floating,
          ),
        );
        Navigator.pop(context, true);
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(resp['message'] as String? ?? 'Failed to create product'),
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

  bool _loading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add Product')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildField('Product Name', _nameCtrl, required: true),
              _buildField('SKU (optional)', _skuCtrl),
              if (_loadingCategories)
                const Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: LinearProgressIndicator(),
                )
              else
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: DropdownButtonFormField<String>(
                    value: _selectedCategoryId,
                    decoration: _inputDecoration('Category *'),
                    items: _categories
                        .map((c) => DropdownMenuItem(value: c.id, child: Text(c.name)))
                        .toList(),
                    onChanged: (v) => setState(() => _selectedCategoryId = v),
                    validator: (v) => v == null ? 'Required' : null,
                  ),
                ),
              Row(
                children: [
                  Expanded(child: _buildField('MRP *', _mrpCtrl,
                      keyboardType: TextInputType.number, required: true)),
                  const SizedBox(width: 8),
                  Expanded(child: _buildField('Sales Price *', _salesPriceCtrl,
                      keyboardType: TextInputType.number, required: true)),
                ],
              ),
              Row(
                children: [
                  Expanded(child: _buildField('Stock *', _stockCtrl,
                      keyboardType: TextInputType.number, required: true)),
                  const SizedBox(width: 8),
                  Expanded(child: _buildField('Low Stock Threshold', _lowStockCtrl,
                      keyboardType: TextInputType.number)),
                ],
              ),
              _buildField('Image URL (optional)', _imageCtrl),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Sizes', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  if (_remainingSizeNames.isNotEmpty)
                    PopupMenuButton<String>(
                      icon: const Icon(Icons.add_circle_outline, color: AppTheme.primary),
                      tooltip: 'Add size',
                      onSelected: _addSize,
                      itemBuilder: (_) => _remainingSizeNames
                          .map((n) => PopupMenuItem(value: n, child: Text(n)))
                          .toList(),
                    ),
                ],
              ),
              if (_sizes.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 8),
                  child: Text('No sizes added. Product will be size-less.',
                      style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                )
              else
                ..._sizes.asMap().entries.map((e) => _buildSizeCard(e.key, e.value)),
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
                      : const Text('Create Product'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSizeCard(int index, _SizeEntry size) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(size.nameCtrl.text,
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, color: AppTheme.primary)),
                ),
                const Spacer(),
                InkWell(
                  onTap: () => _removeSize(index),
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: AppTheme.error.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Icon(Icons.close, size: 16, color: AppTheme.error),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: size.mrpCtrl,
                    keyboardType: TextInputType.number,
                    decoration: _inputDecoration('MRP'),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextFormField(
                    controller: size.salesPriceCtrl,
                    keyboardType: TextInputType.number,
                    decoration: _inputDecoration('Sales Price'),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String label) {
    return InputDecoration(
      labelText: label,
      filled: true,
      fillColor: AppTheme.surfaceVariant,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
    );
  }

  Widget _buildField(String label, TextEditingController ctrl,
      {bool required = false,
      TextInputType keyboardType = TextInputType.text}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: ctrl,
        keyboardType: keyboardType,
        decoration: _inputDecoration(required ? '$label *' : label),
        validator: required
            ? (v) => (v == null || v.trim().isEmpty) ? 'Required' : null
            : null,
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'dart:convert';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import '../../models/category.dart';
import '../../models/product.dart';
import '../../services/api_client.dart';
import '../../services/api_endpoints.dart';
import '../../theme/app_theme.dart';

class _SizeEntry {
  final TextEditingController nameCtrl;
  final TextEditingController mrpCtrl;
  final TextEditingController salesPriceCtrl;
  final TextEditingController stockCtrl;
  final TextEditingController lowStockCtrl;
  _SizeEntry({
    required String name,
    required double mrp,
    required double salesPrice,
    int stockQuantity = 0,
    int lowStockThreshold = 10,
  })  : nameCtrl = TextEditingController(text: name),
        mrpCtrl = TextEditingController(text: mrp.toString()),
        salesPriceCtrl = TextEditingController(text: salesPrice.toString()),
        stockCtrl = TextEditingController(text: stockQuantity.toString()),
        lowStockCtrl = TextEditingController(text: lowStockThreshold.toString());
  void dispose() {
    nameCtrl.dispose();
    mrpCtrl.dispose();
    salesPriceCtrl.dispose();
    stockCtrl.dispose();
    lowStockCtrl.dispose();
  }
}

class AddProductScreen extends StatefulWidget {
  final Product? product;
  const AddProductScreen({super.key, this.product});

  @override
  State<AddProductScreen> createState() => _AddProductScreenState();
}

class _AddProductScreenState extends State<AddProductScreen> {
  final _formKey = GlobalKey<FormState>();
  final ApiClient _api = ApiClient();

  final _nameCtrl = TextEditingController();
  final _skuCtrl = TextEditingController();
  String? _imagePath;
  String? _imageUrl;
  bool _uploadingImage = false;

  String? _selectedCategoryId;
  List<Category> _categories = [];
  bool _loadingCategories = true;

  bool get _isEditing => widget.product != null;

  final List<_SizeEntry> _sizes = [];
  final _availableSizeNames = ['Standard', 'SM', 'M', 'L', 'XL', 'XXL'];

  @override
  void initState() {
    super.initState();
    _loadCategories();
    if (_isEditing) {
      final p = widget.product!;
      _nameCtrl.text = p.name;
      _skuCtrl.text = p.sku;
      if (p.images.isNotEmpty) _imageUrl = p.images.first;
      final allZero = p.sizes.every((s) => s.stockQuantity == 0);
      final hasFallback = p.totalStockFallback > 0;
      for (int i = 0; i < p.sizes.length; i++) {
        final s = p.sizes[i];
        var stock = s.stockQuantity;
        if (allZero && hasFallback) {
          final perSize = p.totalStockFallback ~/ p.sizes.length;
          final remainder = p.totalStockFallback % p.sizes.length;
          stock = perSize + (i < remainder ? 1 : 0);
        }
        _sizes.add(_SizeEntry(
          name: s.name,
          mrp: s.mrp,
          salesPrice: s.salesPrice,
          stockQuantity: stock,
          lowStockThreshold: s.lowStockThreshold,
        ));
      }
    } else {
      _sizes.add(_SizeEntry(name: 'Standard', mrp: 0, salesPrice: 0));
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _skuCtrl.dispose();
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
        final cats = (body['data'] as List)
            .map((e) => Category.fromJson(e as Map<String, dynamic>))
            .toList();
        setState(() {
          _categories = cats;
          _loadingCategories = false;
          if (_isEditing && widget.product!.categoryId != null) {
            final match = cats.indexWhere((c) => c.id == widget.product!.categoryId);
            if (match >= 0) _selectedCategoryId = cats[match].id;
          }
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
      _sizes.add(_SizeEntry(name: name, mrp: 0, salesPrice: 0));
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
    if (_sizes.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('At least one size is required'),
          backgroundColor: AppTheme.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    setState(() => _loading = true);
    try {
      final sizeData = _sizes.map((s) => {
        'name': s.nameCtrl.text.trim(),
        'mrp': double.parse(s.mrpCtrl.text.trim()),
        'salesPrice': double.parse(s.salesPriceCtrl.text.trim()),
        'stockQuantity': int.parse(s.stockCtrl.text.trim()),
        'lowStockThreshold': int.parse(s.lowStockCtrl.text.trim()),
      }).toList();

      final totalStock = sizeData.fold<int>(0, (sum, s) => sum + (s['stockQuantity'] as int));

      final body = <String, dynamic>{
        'name': _nameCtrl.text.trim(),
        'category': _selectedCategoryId,
        'sizes': sizeData,
        'mrp': sizeData.first['mrp'],
        'salesPrice': sizeData.first['salesPrice'],
        'stockQuantity': totalStock,
        'lowStockThreshold': sizeData.first['lowStockThreshold'],
      };
      if (_skuCtrl.text.trim().isNotEmpty) body['sku'] = _skuCtrl.text.trim();
      if (_imageUrl != null && _imageUrl!.isNotEmpty) {
        body['images'] = [_imageUrl];
      }

      final res = _isEditing
          ? await _api.put('/products/${widget.product!.id}', body: body)
          : await _api.post(ApiEndpoints.products, body: body);
      final resp = jsonDecode(res.body) as Map<String, dynamic>;
      if (resp['success'] == true) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_isEditing ? 'Product updated successfully' : 'Product created successfully'),
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
  bool _uploadError = false;

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, maxWidth: 1024);
    if (picked != null) {
      setState(() {
        _imagePath = picked.path;
        _imageUrl = null;
        _uploadError = false;
      });
      _uploadImage();
    }
  }

  Future<void> _uploadImage() async {
    if (_imagePath == null) return;
    setState(() {
      _uploadingImage = true;
      _uploadError = false;
    });
    try {
      final res = await _api.uploadFiles(ApiEndpoints.upload, [
        MapEntry('images', _imagePath!),
      ]);
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        final data = body['data'] as Map<String, dynamic>;
        final urls = (data['urls'] as List).cast<String>();
        if (urls.isNotEmpty) {
          if (mounted) setState(() => _imageUrl = urls.first);
        } else {
          if (mounted) setState(() => _uploadError = true);
        }
      } else {
        if (mounted) setState(() => _uploadError = true);
      }
    } catch (_) {
      if (mounted) setState(() => _uploadError = true);
    }
    if (mounted) setState(() => _uploadingImage = false);
    if (_uploadError && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Image upload failed. Try a different image or check connection.'),
          backgroundColor: AppTheme.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isEditing ? 'Edit Product' : 'Add Product')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildField('Product Name', _nameCtrl, required: true),
              _buildField('Piece (optional)', _skuCtrl),
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
              const SizedBox(height: 8),
              const Text('Product Image', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: _uploadingImage ? null : _pickImage,
                child: Container(
                  width: double.infinity,
                  height: 140,
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceVariant,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: _imagePath != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              Image.file(File(_imagePath!), fit: BoxFit.cover),
                              if (_uploadingImage)
                                Container(
                                  color: Colors.black38,
                                  child: const Center(
                                    child: CircularProgressIndicator(color: Colors.white),
                                  ),
                                )
                              else if (_uploadError)
                                Container(
                                  color: Colors.black38,
                                  child: const Center(
                                    child: Icon(Icons.error_outline, color: Colors.red, size: 40),
                                  ),
                                )
                              else if (_imageUrl != null)
                                Positioned(
                                  top: 6, right: 6,
                                  child: Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: const BoxDecoration(
                                      color: Colors.green,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(Icons.check, color: Colors.white, size: 18),
                                  ),
                                ),
                            ],
                          ),
                        )
                      : Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(_imageUrl != null ? Icons.check_circle : Icons.add_photo_alternate_outlined,
                                size: 36, color: _imageUrl != null ? AppTheme.success : AppTheme.textTertiary),
              if (_isEditing && widget.product!.totalStockFallback > 0 && widget.product!.sizes.length > 1)
                Padding(
                  padding: const EdgeInsets.only(top: 4, bottom: 4),
                  child: Text(
                    'Previous total: ${widget.product!.totalStockFallback} — distribute across sizes',
                    style: const TextStyle(fontSize: 12, color: AppTheme.warning, fontStyle: FontStyle.italic),
                  ),
                ),
              const SizedBox(height: 8),
                            Text(
                              _imageUrl != null ? 'Image uploaded' : 'Tap to pick image',
                              style: TextStyle(fontSize: 13, color: _imageUrl != null ? AppTheme.success : AppTheme.textSecondary),
                            ),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Sizes & Pricing', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
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
              const SizedBox(height: 8),
              ..._sizes.asMap().entries.map((e) => _buildSizeCard(e.key, e.value)),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: (_loading || _uploadingImage) ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 50),
                  ),
                  child: _loading
                      ? const SizedBox(
                          width: 22, height: 22,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white))
                      : Text(_isEditing ? 'Update Product' : 'Create Product'),
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
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text('Size: ${size.nameCtrl.text}',
                      style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary, fontSize: 13)),
                ),
                const Spacer(),
                if (_sizes.length > 1)
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
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: size.mrpCtrl,
                    keyboardType: TextInputType.number,
                    decoration: _inputDecoration('MRP *'),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextFormField(
                    controller: size.salesPriceCtrl,
                    keyboardType: TextInputType.number,
                    decoration: _inputDecoration('Sales Price *'),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: size.stockCtrl,
                    keyboardType: TextInputType.number,
                    decoration: _inputDecoration('Stock *'),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextFormField(
                    controller: size.lowStockCtrl,
                    keyboardType: TextInputType.number,
                    decoration: _inputDecoration('Low Stock Threshold'),
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
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
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

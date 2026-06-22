import 'package:flutter/material.dart';
import 'dart:convert';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import '../../models/category.dart';
import '../../services/api_client.dart';
import '../../services/api_endpoints.dart';
import '../../theme/app_theme.dart';

class AddCategoryScreen extends StatefulWidget {
  final Category? category;
  const AddCategoryScreen({super.key, this.category});

  @override
  State<AddCategoryScreen> createState() => _AddCategoryScreenState();
}

class _AddCategoryScreenState extends State<AddCategoryScreen> {
  final _formKey = GlobalKey<FormState>();
  final ApiClient _api = ApiClient();

  final _nameCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _sortOrderCtrl = TextEditingController(text: '0');
  String? _imagePath;
  String? _imageUrl;
  bool _uploadingImage = false;

  bool _loading = false;
  bool _uploadError = false;
  bool get _isEditing => widget.category != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      final c = widget.category!;
      _nameCtrl.text = c.name;
      _descCtrl.text = c.description ?? '';
      _sortOrderCtrl.text = c.sortOrder.toString();
      if (c.image != null && c.image!.isNotEmpty) _imageUrl = c.image;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
    _sortOrderCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final body = <String, dynamic>{
        'name': _nameCtrl.text.trim(),
      };
      if (_descCtrl.text.trim().isNotEmpty) body['description'] = _descCtrl.text.trim();
      if (_imageUrl != null && _imageUrl!.isNotEmpty) body['image'] = _imageUrl;
      body['sortOrder'] = int.tryParse(_sortOrderCtrl.text.trim()) ?? 0;

      final res = _isEditing
          ? await _api.put('/categories/${widget.category!.id}', body: body)
          : await _api.post(ApiEndpoints.categories, body: body);
      final resp = jsonDecode(res.body) as Map<String, dynamic>;
      if (resp['success'] == true) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_isEditing ? 'Category updated successfully' : 'Category created successfully'),
            backgroundColor: AppTheme.success,
            behavior: SnackBarBehavior.floating,
          ),
        );
        Navigator.pop(context, true);
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(resp['message'] as String? ?? 'Failed to create category'),
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
      appBar: AppBar(title: Text(_isEditing ? 'Edit Category' : 'Add Category')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              _buildField('Category Name *', _nameCtrl, required: true),
              _buildField('Description', _descCtrl, maxLines: 3),
              const Text('Category Image', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
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
                            const SizedBox(height: 8),
                            Text(
                              _imageUrl != null ? 'Image uploaded' : 'Tap to pick image',
                              style: TextStyle(fontSize: 13, color: _imageUrl != null ? AppTheme.success : AppTheme.textSecondary),
                            ),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 12),
              _buildField('Sort Order', _sortOrderCtrl, keyboardType: TextInputType.number),
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
                      : Text(_isEditing ? 'Update Category' : 'Create Category'),
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
      int maxLines = 1}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: ctrl,
        keyboardType: keyboardType,
        maxLines: maxLines,
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

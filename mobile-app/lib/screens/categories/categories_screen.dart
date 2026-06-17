import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:cached_network_image/cached_network_image.dart';
import '../../models/category.dart';
import '../../services/api_client.dart';
import '../../services/api_endpoints.dart';
import '../../theme/app_theme.dart';
import '../../widgets/loading_widget.dart';
import 'add_category_screen.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  final ApiClient _api = ApiClient();
  List<Category> _categories = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await _api.get(ApiEndpoints.categories);
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        setState(() {
          _categories = (body['data'] as List).map((e) => Category.fromJson(e as Map<String, dynamic>)).toList();
          _loading = false;
        });
      }
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _deleteCategory(Category cat) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Category'),
        content: Text('Delete "${cat.name}"? Products in this category may be affected.'),
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
      await _api.delete('/categories/${cat.id}');
      _load();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Category deleted'), backgroundColor: AppTheme.success, behavior: SnackBarBehavior.floating,
      ));
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Categories'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline),
            tooltip: 'Add Category',
            onPressed: () async {
              final result = await Navigator.push<bool>(context, MaterialPageRoute(builder: (_) => const AddCategoryScreen()));
              if (result == true) _load();
            },
          ),
        ],
      ),
      body: _loading
          ? const LoadingWidget()
          : _categories.isEmpty
              ? const Center(child: Text('No categories'))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: GridView.builder(
                    padding: const EdgeInsets.all(16),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 1.2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                    ),
                    itemCount: _categories.length,
                    itemBuilder: (_, i) {
                      final cat = _categories[i];
                      return Card(
                        child: Stack(
                          children: [
                            InkWell(
                              borderRadius: BorderRadius.circular(12),
                              onTap: () {},
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: Container(
                                      width: 64, height: 64,
                                      color: AppTheme.background,
                                      child: cat.image != null && cat.image!.isNotEmpty
                                          ? CachedNetworkImage(
                                              imageUrl: cat.image!, fit: BoxFit.cover,
                                              placeholder: (_, __) => const Icon(Icons.folder, color: AppTheme.textSecondary),
                                              errorWidget: (_, __, ___) => const Icon(Icons.folder, color: AppTheme.textSecondary),
                                            )
                                          : const Icon(Icons.folder, color: AppTheme.textSecondary, size: 32),
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(cat.name,
                                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                                      textAlign: TextAlign.center),
                                  if (cat.productCount != null)
                                    Text('${cat.productCount} products',
                                        style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
                                ],
                              ),
                            ),
                            Positioned(
                              top: 4, right: 4,
                              child: PopupMenuButton<String>(
                                icon: const Icon(Icons.more_vert, size: 16),
                                onSelected: (v) {
                                  if (v == 'delete') _deleteCategory(cat);
                                },
                                itemBuilder: (_) => [
                                  const PopupMenuItem(value: 'delete', child: Row(children: [
                                    Icon(Icons.delete_outline, size: 16, color: AppTheme.error),
                                    SizedBox(width: 8),
                                    Text('Delete', style: TextStyle(color: AppTheme.error)),
                                  ])),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}

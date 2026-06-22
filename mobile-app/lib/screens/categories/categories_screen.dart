import 'package:flutter/material.dart';
import 'dart:convert';
import '../../models/category.dart';
import '../../services/api_client.dart';
import '../../services/api_endpoints.dart';
import '../../theme/app_theme.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/app_network_image.dart';
import '../../widgets/app_dialog.dart';
import 'add_category_screen.dart';
import 'category_products_screen.dart';

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

  Future<void> _editCategory(Category cat) async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => AddCategoryScreen(category: cat)),
    );
    if (result == true) _load();
  }

  Future<void> _deleteCategory(Category cat) async {
    final confirmed = await AppDialog.showConfirm(
      context,
      title: 'Delete Category',
      content: Text('Delete "${cat.name}"? Products in this category may be affected.'),
      confirmLabel: 'Delete',
      confirmColor: AppTheme.error,
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
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(12, 8, 12, 80),
                    itemCount: _categories.length,
                    itemBuilder: (_, i) {
                      final cat = _categories[i];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Card(
                          clipBehavior: Clip.antiAlias,
                          elevation: 1,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          child: InkWell(
                            onTap: () async {
                              await Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => CategoryProductsScreen(category: cat),
                                ),
                              );
                            },
                            child: Row(
                              children: [
                                ClipRRect(
                                  borderRadius: const BorderRadius.horizontal(left: Radius.circular(12)),
                                  child: AppNetworkImage(
                                    imageUrl: cat.image,
                                    width: 100, height: 100, borderRadius: 0,
                                  ),
                                ),
                                Expanded(
                                  child: Padding(
                                    padding: const EdgeInsets.fromLTRB(14, 12, 8, 12),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Text(cat.name,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                                        if (cat.description != null && cat.description!.isNotEmpty)
                                          Padding(
                                            padding: const EdgeInsets.only(top: 4),
                                            child: Text(cat.description!,
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                                style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                                          ),
                                        const SizedBox(height: 6),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                                          decoration: BoxDecoration(
                                            color: AppTheme.primary.withOpacity(0.1),
                                            borderRadius: BorderRadius.circular(20),
                                          ),
                                          child: Text(
                                            '${cat.productCount ?? 0} products',
                                            style: const TextStyle(color: AppTheme.primary, fontSize: 11, fontWeight: FontWeight.w600),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                PopupMenuButton<String>(
                                  icon: const Icon(Icons.more_vert, size: 22, color: AppTheme.textSecondary),
                                  onSelected: (v) {
                                    if (v == 'edit') _editCategory(cat);
                                    if (v == 'delete') _deleteCategory(cat);
                                  },
                                  itemBuilder: (_) => [
                                    const PopupMenuItem(value: 'edit', child: Row(children: [Icon(Icons.edit_outlined, size: 16), SizedBox(width: 8), Text('Edit')])),
                                    const PopupMenuItem(value: 'delete', child: Row(children: [Icon(Icons.delete_outline, size: 16, color: AppTheme.error), SizedBox(width: 8), Text('Delete', style: TextStyle(color: AppTheme.error))])),
                                  ],
                                ),
                                const SizedBox(width: 4),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}

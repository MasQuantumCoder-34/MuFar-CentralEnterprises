import 'package:flutter/material.dart';
import 'dart:convert';
import '../../models/product.dart';
import '../../models/category.dart';
import '../../services/api_client.dart';
import '../../services/api_endpoints.dart';
import '../../theme/app_theme.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/app_network_image.dart';
import '../../widgets/app_dialog.dart';
import 'add_product_screen.dart';
import 'product_detail_screen.dart';

class ProductsScreen extends StatefulWidget {
  const ProductsScreen({super.key});

  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  final ApiClient _api = ApiClient();
  List<Product> _products = [];
  List<Category> _categories = [];
  Category? _selectedCategory;
  bool _loading = true;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final params = <String, String>{'limit': '100', 'isActive': 'true'};
      if (_search.isNotEmpty) params['search'] = _search;
      final results = await Future.wait([
        _api.get(ApiEndpoints.categories),
        _api.get(ApiEndpoints.products, queryParams: params),
      ]);
      final catBody = jsonDecode(results[0].body) as Map<String, dynamic>;
      final prodBody = jsonDecode(results[1].body) as Map<String, dynamic>;
      setState(() {
        if (catBody['data'] != null) {
          _categories = (catBody['data'] as List).map((e) => Category.fromJson(e as Map<String, dynamic>)).toList();
        }
        if (prodBody['data'] != null) {
          _products = (prodBody['data'] as List).map((e) => Product.fromJson(e as Map<String, dynamic>)).toList();
        }
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  List<Product> get _filteredProducts {
    var result = _products;
    if (_search.isNotEmpty) {
      final q = _search.toLowerCase();
      result = result.where((p) => p.name.toLowerCase().contains(q)).toList();
    }
    if (_selectedCategory != null) {
      result = result.where((p) => p.categoryId == _selectedCategory!.id).toList();
    }
    return result;
  }

  Future<void> _editProduct(Product product) async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => AddProductScreen(product: product, initialCategories: _categories)),
    );
    if (result == true) _loadData();
  }

  Future<void> _deleteProduct(Product product) async {
    final confirmed = await AppDialog.showConfirm(
      context,
      title: 'Delete Product',
      content: Text('Delete "${product.name}"? This cannot be undone.'),
      confirmLabel: 'Delete',
      confirmColor: AppTheme.error,
    );
    if (confirmed != true) return;
    try {
      await _api.delete('/products/${product.id}');
      _loadData();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Product deleted'), backgroundColor: AppTheme.success, behavior: SnackBarBehavior.floating,
      ));
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Products'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline),
            tooltip: 'Add Product',
            onPressed: () async {
              final result = await Navigator.push<bool>(context, MaterialPageRoute(builder: (_) => AddProductScreen(initialCategories: _categories)));
              if (result == true) _loadData();
            },
          ),
        ],
      ),
      body: _loading
          ? const LoadingWidget()
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
                  child: TextField(
                    decoration: InputDecoration(
                      hintText: 'Search products...', prefixIcon: const Icon(Icons.search, size: 20),
                      filled: true, fillColor: AppTheme.surfaceVariant,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      contentPadding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    onChanged: (v) { _search = v; _loadData(); },
                  ),
                ),
                SizedBox(
                  height: 44,
                  child: ListView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: ChoiceChip(
                          label: const Text('All', style: TextStyle(fontSize: 12)),
                          selected: _selectedCategory == null,
                          onSelected: (_) => setState(() => _selectedCategory = null),
                          selectedColor: AppTheme.primary,
                          backgroundColor: AppTheme.surfaceVariant,
                          labelStyle: TextStyle(color: _selectedCategory == null ? Colors.white : AppTheme.textPrimary),
                        ),
                      ),
                      ..._categories.map((cat) {
                        final isSelected = _selectedCategory?.id == cat.id;
                        return Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: ChoiceChip(
                            label: Text(cat.name, style: const TextStyle(fontSize: 12)),
                            selected: isSelected,
                            onSelected: (_) => setState(() => _selectedCategory = cat),
                            selectedColor: AppTheme.primary,
                            backgroundColor: AppTheme.surfaceVariant,
                            labelStyle: TextStyle(color: isSelected ? Colors.white : AppTheme.textPrimary),
                          ),
                        );
                      }),
                    ],
                  ),
                ),
                Expanded(
                  child: _filteredProducts.isEmpty
                      ? const Center(child: Text('No products found'))
                      : RefreshIndicator(
                          onRefresh: _loadData,
                          child: ListView.builder(
                            padding: const EdgeInsets.fromLTRB(12, 8, 12, 80),
                            itemCount: _filteredProducts.length,
                            itemBuilder: (_, i) {
                              final p = _filteredProducts[i];
                              return GestureDetector(
                                onTap: () async {
                                  final r = await Navigator.push<bool>(
                                    context,
                                    MaterialPageRoute(builder: (_) => ProductDetailScreen(product: p)),
                                  );
                                  if (r == true) _loadData();
                                },
                                child: Card(
                                  clipBehavior: Clip.antiAlias,
                                  elevation: 1,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  child: Row(
                                    children: [
                                      ClipRRect(
                                        borderRadius: const BorderRadius.horizontal(left: Radius.circular(12)),
                                        child: AppNetworkImage(
                                          imageUrl: p.images.isNotEmpty ? p.images.first : null,
                                          width: 100, height: 100,
                                          borderRadius: 0,
                                        ),
                                      ),
                                      Expanded(
                                        child: Padding(
                                          padding: const EdgeInsets.fromLTRB(14, 12, 8, 12),
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: [
                                              Text(p.name, maxLines: 2, overflow: TextOverflow.ellipsis,
                                                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                                              const SizedBox(height: 6),
                                              Text('\u20B9${p.sizes.isNotEmpty ? p.sizes.first.salesPrice.toStringAsFixed(0) : '0'}',
                                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppTheme.primary)),
                                              if (p.sizes.isNotEmpty)
                                                Padding(
                                                  padding: const EdgeInsets.only(top: 4),
                                                  child: Text(
                                                    p.stockDisplay(),
                                                    maxLines: 1, overflow: TextOverflow.ellipsis,
                                                    style: TextStyle(fontSize: 12, color: p.totalStock <= 0 ? AppTheme.error : AppTheme.textSecondary),
                                                  ),
                                                ),
                                            ],
                                          ),
                                        ),
                                      ),
                                      PopupMenuButton<String>(
                                        icon: const Icon(Icons.more_vert, size: 22, color: AppTheme.textSecondary),
                                        onSelected: (v) {
                                          if (v == 'edit') _editProduct(p);
                                          if (v == 'delete') _deleteProduct(p);
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

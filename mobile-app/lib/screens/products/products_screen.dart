import 'package:flutter/material.dart';
import 'dart:convert';
import '../../models/product.dart';
import '../../models/category.dart';
import '../../services/api_client.dart';
import '../../services/api_endpoints.dart';
import '../../theme/app_theme.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/product_card.dart';
import 'add_product_screen.dart';

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
      final params = <String, String>{'limit': '100'};
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
    if (_selectedCategory != null) {
      result = result.where((p) => p.categoryId == _selectedCategory!.id).toList();
    }
    return result;
  }

  Future<void> _toggleActive(Product product) async {
    try {
      await _api.put('/products/${product.id}', body: {'isActive': !product.isActive});
      _loadData();
    } catch (_) {}
  }

  Future<void> _deleteProduct(Product product) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Product'),
        content: Text('Delete "${product.name}"? This cannot be undone.'),
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
              final result = await Navigator.push<bool>(context, MaterialPageRoute(builder: (_) => const AddProductScreen()));
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
                            padding: const EdgeInsets.fromLTRB(12, 4, 12, 60),
                            itemCount: _filteredProducts.length,
                            itemBuilder: (_, i) {
                              final p = _filteredProducts[i];
                              return Card(
                                margin: const EdgeInsets.only(bottom: 6),
                                child: Padding(
                                  padding: const EdgeInsets.all(10),
                                  child: Row(children: [
                                    Container(
                                      width: 44, height: 44,
                                      decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.08), borderRadius: BorderRadius.circular(10)),
                                      child: p.images.isNotEmpty
                                          ? ClipRRect(borderRadius: BorderRadius.circular(10), child: Image.network(p.images.first, fit: BoxFit.cover, width: 44, height: 44, errorBuilder: (_, __, ___) => const Icon(Icons.inventory_2_outlined, color: AppTheme.primary, size: 22)))
                                          : const Icon(Icons.inventory_2_outlined, color: AppTheme.primary, size: 22),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                        Text(p.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis),
                                        Text('SKU: ${p.sku.isNotEmpty ? p.sku : 'N/A'} · ${p.stockQuantity} in stock',
                                            style: TextStyle(fontSize: 10, color: p.stockQuantity <= p.lowStockThreshold ? AppTheme.error : AppTheme.textSecondary)),
                                        Text('₹${p.salesPrice.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppTheme.primary)),
                                      ]),
                                    ),
                                    PopupMenuButton<String>(
                                      icon: const Icon(Icons.more_vert, size: 18),
                                      onSelected: (v) {
                                        if (v == 'toggle') _toggleActive(p);
                                        if (v == 'delete') _deleteProduct(p);
                                      },
                                      itemBuilder: (_) => [
                                        const PopupMenuItem(value: 'toggle', child: Row(children: [Icon(Icons.visibility_outlined, size: 16), SizedBox(width: 8), Text('Toggle Active')])),
                                        const PopupMenuItem(value: 'delete', child: Row(children: [Icon(Icons.delete_outline, size: 16, color: AppTheme.error), SizedBox(width: 8), Text('Delete', style: TextStyle(color: AppTheme.error))])),
                                      ],
                                    ),
                                  ]),
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

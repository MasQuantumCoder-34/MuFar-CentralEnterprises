import 'package:flutter/material.dart';
import 'dart:convert';
import '../../models/category.dart';
import '../../models/product.dart';
import '../../services/api_client.dart';
import '../../services/api_endpoints.dart';
import '../../theme/app_theme.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/app_network_image.dart';
import '../products/product_detail_screen.dart';

class CategoryProductsScreen extends StatefulWidget {
  final Category category;
  const CategoryProductsScreen({super.key, required this.category});

  @override
  State<CategoryProductsScreen> createState() => _CategoryProductsScreenState();
}

class _CategoryProductsScreenState extends State<CategoryProductsScreen> {
  final ApiClient _api = ApiClient();
  List<Product> _products = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await _api.get(ApiEndpoints.products, queryParams: {'limit': '100'});
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        final all = (body['data'] as List).map((e) => Product.fromJson(e as Map<String, dynamic>)).toList();
        setState(() {
          _products = all.where((p) => p.categoryId == widget.category.id).toList();
          _loading = false;
        });
      }
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.category.name)),
      body: _loading
          ? const LoadingWidget()
          : _products.isEmpty
              ? const Center(child: Text('No products in this category'))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
                    itemCount: _products.length,
                    itemBuilder: (_, i) {
                      final p = _products[i];
                      return GestureDetector(
                        onTap: () async {
                          final r = await Navigator.push<bool>(
                            context,
                            MaterialPageRoute(builder: (_) => ProductDetailScreen(product: p)),
                          );
                          if (r == true) _load();
                        },
                        child: Card(
                          elevation: 1,
                          shadowColor: AppTheme.primary.withOpacity(0.15),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          margin: const EdgeInsets.only(bottom: 10),
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Row(
                              children: [
                                AppNetworkImage(
                                  imageUrl: p.images.isNotEmpty ? p.images.first : null,
                                  width: 60, height: 60, borderRadius: 12,
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(p.name,
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                                      const SizedBox(height: 4),
                                      if (p.pieces > 0)
                                        Text('Pieces: ${p.pieces}',
                                            style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                                      const SizedBox(height: 2),
                                      Row(
                                        children: [
                                          Text('\u20B9${p.sizes.isNotEmpty ? p.sizes.first.salesPrice.toStringAsFixed(0) : '0'}',
                                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.primary)),
                                          const SizedBox(width: 6),
                                          Expanded(
                                            child: Text(
                                              p.sizes.map((s) => '${s.name}:${s.stockQuantity}').join(' '),
                                              maxLines: 1, overflow: TextOverflow.ellipsis,
                                              style: TextStyle(fontSize: 10, color: p.totalStock <= 0 ? AppTheme.error : AppTheme.textSecondary),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
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

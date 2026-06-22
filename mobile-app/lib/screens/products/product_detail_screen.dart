import 'package:flutter/material.dart';
import '../../models/product.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_network_image.dart';
import 'add_product_screen.dart';

class ProductDetailScreen extends StatefulWidget {
  final Product product;
  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  late Product _product;

  @override
  void initState() {
    super.initState();
    _product = widget.product;
  }

  Future<void> _edit() async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => AddProductScreen(product: _product)),
    );
    if (result == true && mounted) Navigator.pop(context, true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_product.name),
        actions: [
          IconButton(icon: const Icon(Icons.edit_outlined), onPressed: _edit),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 1.2,
              child: AppNetworkImage(
                imageUrl: _product.images.isNotEmpty ? _product.images.first : null,
                borderRadius: 0,
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_product.name, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                  if (_product.pieces > 0)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text('Pieces: ${_product.pieces}', style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                    ),
                  if (_product.categoryName != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text('Category: ${_product.categoryName}', style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                    ),
                ],
              ),
            ),
            const Padding(
              padding: EdgeInsets.fromLTRB(16, 20, 16, 8),
              child: Text('Sizes & Pricing', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
            ),
            ..._product.sizes.map((s) => Card(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(s.name, style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary, fontSize: 14)),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (s.mrp > 0)
                            Text('\u20B9${s.mrp.toStringAsFixed(0)}', style: const TextStyle(decoration: TextDecoration.lineThrough, color: AppTheme.textTertiary, fontSize: 12)),
                          Text('\u20B9${s.salesPrice.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.textPrimary)),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('Stock', style: TextStyle(fontSize: 11, color: AppTheme.textTertiary)),
                        const SizedBox(height: 2),
                        if (_product.totalStockFallback > 0 && _product.sizes.every((e) => e.stockQuantity == 0))
                          Text('—', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.textTertiary))
                        else
                          Text('${s.stockQuantity}', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: s.stockQuantity <= 0 ? AppTheme.error : AppTheme.textPrimary)),
                      ],
                    ),
                  ],
                ),
              ),
            )),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Row(
                children: [
                  const Text('Total Stock: ', style: TextStyle(fontSize: 14, color: AppTheme.textSecondary)),
                  Text('${_product.totalStock}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppTheme.textPrimary)),
                ],
              ),
            ),
            if (_product.totalStockFallback > 0 && _product.sizes.every((s) => s.stockQuantity == 0))
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
                child: Text('(per-size stock unknown — total available: ${_product.totalStockFallback})',
                    style: const TextStyle(fontSize: 11, color: AppTheme.warning, fontStyle: FontStyle.italic)),
              ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

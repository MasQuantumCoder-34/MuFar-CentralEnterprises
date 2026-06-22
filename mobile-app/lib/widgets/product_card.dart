import 'package:flutter/material.dart';
import '../models/product.dart';
import '../theme/app_theme.dart';
import 'app_network_image.dart';

class ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback? onTap;

  const ProductCard({
    super.key,
    required this.product,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final displayPrice = product.getPriceForSize(null);
    final displayMrp = product.getMrpForSize(null);
    final isOutOfStock = product.totalStock <= 0;

    return GestureDetector(
      onTap: isOutOfStock ? null : onTap,
      child: Card(
        margin: EdgeInsets.zero,
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 1.1,
              child: AppNetworkImage(
                imageUrl: product.images.isNotEmpty ? product.images.first : null,
                borderRadius: 0,
                backgroundColor: AppTheme.surfaceVariant,
              ),
            ),
            if (isOutOfStock)
              Container(
                color: Colors.black87,
                padding: const EdgeInsets.symmetric(vertical: 3),
                child: const Center(
                  child: Text('Out of Stock',
                      style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                ),
              ),
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 6, 8, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(product.name,
                      maxLines: 2, overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: AppTheme.textPrimary)),
                  const SizedBox(height: 2),
                  if (product.sizes.isNotEmpty)
                    Text(
                      product.sizes.map((s) => '${s.name}:${s.stockQuantity}').join('  '),
                      maxLines: 1, overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 10, color: isOutOfStock ? AppTheme.error : AppTheme.textSecondary),
                    ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Flexible(
                        child: Text('\u20B9${displayPrice.toStringAsFixed(0)}',
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold, fontSize: 14)),
                      ),
                      if (displayMrp > displayPrice) ...[
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text('\u20B9${displayMrp.toStringAsFixed(0)}',
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(color: AppTheme.textTertiary, decoration: TextDecoration.lineThrough, fontSize: 10)),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/product.dart';
import '../theme/app_theme.dart';

class ProductCard extends StatelessWidget {
  final Product product;
  final void Function(Product, String? size)? onAdd;
  final String? selectedSize;
  final void Function(String? size)? onSizeSelected;

  const ProductCard({
    super.key,
    required this.product,
    this.onAdd,
    this.selectedSize,
    this.onSizeSelected,
  });

  @override
  Widget build(BuildContext context) {
    final displayPrice = product.getPriceForSize(selectedSize);
    final displayMrp = product.getMrpForSize(selectedSize);
    final hasSizes = product.sizes.isNotEmpty;
    final isOutOfStock = product.stockQuantity <= 0;

    return Card(
      margin: EdgeInsets.zero,
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              AspectRatio(
                aspectRatio: 1.2,
                child: Container(
                  color: AppTheme.surfaceVariant,
                  child: product.images.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: product.images.first,
                          fit: BoxFit.cover,
                          placeholder: (_, __) => const Center(
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                          errorWidget: (_, __, ___) => const Icon(
                            Icons.image_outlined, color: AppTheme.textTertiary, size: 40,
                          ),
                        )
                      : const Icon(Icons.image_outlined, color: AppTheme.textTertiary, size: 40),
                ),
              ),
              if (isOutOfStock)
                Positioned.fill(
                  child: Container(
                    color: Colors.black.withOpacity(0.45),
                    child: const Center(
                      child: Text(
                        'OUT OF STOCK',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                  ),
                ),
              Positioned(
                top: 6, right: 6,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.92),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '${product.stockQuantity}',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: product.stockQuantity <= product.lowStockThreshold
                          ? AppTheme.error : AppTheme.primary,
                    ),
                  ),
                ),
              ),
            ],
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 12,
                      color: AppTheme.textPrimary,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '₹${displayPrice.toStringAsFixed(0)}',
                        style: const TextStyle(
                          color: AppTheme.primary,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                      if (displayMrp > displayPrice) ...[
                        const SizedBox(width: 4),
                        Text(
                          '₹${displayMrp.toStringAsFixed(0)}',
                          style: const TextStyle(
                            color: AppTheme.textTertiary,
                            decoration: TextDecoration.lineThrough,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ],
                  ),
                  if (hasSizes) ...[
                    const SizedBox(height: 6),
                    Expanded(
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: product.sizes.map((s) {
                            final isSel = selectedSize == s.name;
                            return GestureDetector(
                              onTap: () => onSizeSelected?.call(isSel ? null : s.name),
                              child: Container(
                                margin: const EdgeInsets.only(right: 4),
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: isSel ? AppTheme.primary : Colors.transparent,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: isSel ? AppTheme.primary : AppTheme.border,
                                  ),
                                ),
                                child: Text(
                                  s.name,
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: isSel ? Colors.white : AppTheme.textSecondary,
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ),
                  ],
                  if (onAdd != null) ...[
                    const SizedBox(height: 6),
                    SizedBox(
                      width: double.infinity,
                      height: 30,
                      child: ElevatedButton(
                        onPressed: isOutOfStock || (hasSizes && selectedSize == null)
                            ? null
                            : () => onAdd!(product, selectedSize),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.accent,
                          foregroundColor: Colors.white,
                          disabledBackgroundColor: AppTheme.border,
                          disabledForegroundColor: AppTheme.textTertiary,
                          elevation: 0,
                          padding: EdgeInsets.zero,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          textStyle: const TextStyle(
                            fontSize: 11, fontWeight: FontWeight.w600,
                          ),
                        ),
                        child: Text(
                          isOutOfStock
                              ? 'Out of Stock'
                              : hasSizes && selectedSize == null
                                  ? 'Select Size'
                                  : 'Add',
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

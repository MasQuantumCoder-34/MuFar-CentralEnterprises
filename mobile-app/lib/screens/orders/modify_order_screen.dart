import 'package:flutter/material.dart';
import 'dart:convert';

import '../../models/order.dart';
import '../../models/product.dart';
import '../../models/category.dart';
import '../../services/api_client.dart';
import '../../services/api_endpoints.dart';
import '../../theme/app_theme.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/app_dialog.dart';
import '../../widgets/status_badge.dart';
import 'order_detail_screen.dart';

class ModifyOrderScreen extends StatefulWidget {
  final String? initialOrderId;
  const ModifyOrderScreen({super.key, this.initialOrderId});

  @override
  State<ModifyOrderScreen> createState() => _ModifyOrderScreenState();
}

class _ModifyOrderScreenState extends State<ModifyOrderScreen> {
  final ApiClient _api = ApiClient();
  List<Order> _orders = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await _api.get(ApiEndpoints.orders, queryParams: {'status': 'pending,processing', 'limit': '100'});
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        setState(() {
          _orders = (body['data'] as List).map((e) => Order.fromJson(e as Map<String, dynamic>)).toList();
        });
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  void _openEdit(Order order) async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => _EditOrderPage(order: order)),
    );
    if (result == true) _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Modify Orders')),
      body: _loading
          ? const LoadingWidget()
          : _orders.isEmpty
              ? Center(
                  child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(Icons.edit_off_outlined, size: 48, color: AppTheme.textTertiary),
                    const SizedBox(height: 12),
                    const Text('No orders available to modify', style: TextStyle(color: AppTheme.textSecondary)),
                  ]),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: _orders.length,
                    itemBuilder: (_, i) {
                      final order = _orders[i];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Row(children: [
                            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text(order.clientName ?? order.orderNumber, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                              if (order.clientName != null) Text(order.orderNumber, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                              Text('${order.items.length} items · ₹${order.total.toStringAsFixed(0)}', style: const TextStyle(fontSize: 11, color: AppTheme.textTertiary)),
                            ])),
                            StatusBadge(status: order.status),
                            const SizedBox(width: 8),
                            IconButton(icon: const Icon(Icons.edit_outlined, size: 18), onPressed: () => _openEdit(order)),
                            IconButton(
                              icon: const Icon(Icons.visibility_outlined, size: 18),
                              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: order.id))),
                            ),
                          ]),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}

class _EditItem {
  String productId;
  String productName;
  String? size;
  double price;
  int quantity;

  _EditItem({
    required this.productId,
    required this.productName,
    this.size,
    required this.price,
    required this.quantity,
  });

  double get total => price * quantity;
}

class _EditOrderPage extends StatefulWidget {
  final Order order;
  const _EditOrderPage({required this.order});

  @override
  State<_EditOrderPage> createState() => _EditOrderPageState();
}

class _EditOrderPageState extends State<_EditOrderPage> {
  final ApiClient _api = ApiClient();
  late List<_EditItem> _items;
  final _notesCtrl = TextEditingController();
  bool _saving = false;
  List<Category> _categories = [];

  @override
  void initState() {
    super.initState();
    _items = widget.order.items.map((e) => _EditItem(
      productId: e.productId ?? '',
      productName: e.productName,
      size: e.size,
      price: e.price,
      quantity: e.quantity,
    )).toList();
    _notesCtrl.text = widget.order.notes ?? '';
  }

  @override
  void dispose() {
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Order must have at least one item'),
        backgroundColor: AppTheme.error, behavior: SnackBarBehavior.floating,
      ));
      return;
    }
    final validItems = _items.where((e) => e.productId.isNotEmpty).toList();
    final badCount = _items.length - validItems.length;
    if (badCount > 0) {
      final remove = await AppDialog.showConfirm(
        context,
        title: 'Missing Products',
        content: Text('$badCount item(s) in this order reference products that no longer exist. They will be removed when saving. Continue?'),
        confirmLabel: 'Remove & Save',
      );
      if (remove != true) return;
    }
    setState(() => _saving = true);
    try {
      final body = <String, dynamic>{
        'items': validItems.map((e) => <String, dynamic>{
          'product': e.productId,
          'quantity': e.quantity,
          if (e.size != null) 'size': e.size,
        }).toList(),
      };
      if (_notesCtrl.text.trim().isNotEmpty) body['notes'] = _notesCtrl.text.trim();
      final res = await _api.put(ApiEndpoints.order(widget.order.id), body: body);
      final resp = jsonDecode(res.body) as Map<String, dynamic>;
      if (resp['success'] == true) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Order updated'), backgroundColor: AppTheme.success, behavior: SnackBarBehavior.floating,
          ));
          Navigator.pop(context, true);
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text(resp['message'] as String? ?? 'Failed to update'),
            backgroundColor: AppTheme.error, behavior: SnackBarBehavior.floating,
          ));
        }
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Network error'), backgroundColor: AppTheme.error, behavior: SnackBarBehavior.floating,
        ));
      }
    }
    if (mounted) setState(() => _saving = false);
  }

  void _showAddProductSheet() async {
    try {
      final res = await _api.get(ApiEndpoints.categories);
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        _categories = (body['data'] as List)
            .map((e) => Category.fromJson(e as Map<String, dynamic>))
            .toList();
      }
    } catch (_) {}

    if (!mounted || _categories.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('No categories available'), behavior: SnackBarBehavior.floating,
        ));
      }
      return;
    }

    Category? selectedCat;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx1) => StatefulBuilder(
        builder: (ctx1, setSheet1) {
          if (selectedCat == null) {
            return _buildCategoryPicker(ctx1, setSheet1, (cat) {
              setSheet1(() => selectedCat = cat);
            });
          }
          return _buildProductPicker(ctx1, setSheet1, selectedCat!, (product, size, qty) {
            setState(() {
              _items.add(_EditItem(
                productId: product.id,
                productName: product.name,
                size: size,
                price: product.getPriceForSize(size),
                quantity: qty,
              ));
            });
            Navigator.pop(ctx1);
          }, () => setSheet1(() => selectedCat = null));
        },
      ),
    );
  }

  Widget _buildCategoryPicker(BuildContext ctx, StateSetter setSheet, void Function(Category) onSelect) {
    return SizedBox(
      height: MediaQuery.of(ctx).size.height * 0.7,
      child: Column(
        children: [
          Container(
            height: 4, width: 40,
            margin: const EdgeInsets.only(top: 12, bottom: 8),
            decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(2)),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(children: [
              const Icon(Icons.folder_outlined, size: 20, color: AppTheme.textPrimary),
              const SizedBox(width: 8),
              const Text('Select Category', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
            ]),
          ),
          const Divider(),
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2, childAspectRatio: 1.1, crossAxisSpacing: 12, mainAxisSpacing: 12,
              ),
              itemCount: _categories.length,
              itemBuilder: (_, i) {
                final cat = _categories[i];
                return Material(
                  color: Colors.transparent,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: () => onSelect(cat),
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceVariant,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppTheme.border),
                      ),
                      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: SizedBox(
                            width: 56, height: 56,
                            child: cat.image != null && cat.image!.isNotEmpty
                                ? Image.network(cat.image!, fit: BoxFit.cover, width: 56, height: 56, errorBuilder: (_, __, ___) => const Icon(Icons.image_outlined, size: 28, color: AppTheme.textTertiary))
                                : const Icon(Icons.image_outlined, size: 28, color: AppTheme.textTertiary),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(cat.name, maxLines: 2, overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
                            textAlign: TextAlign.center),
                      ]),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProductPicker(
    BuildContext ctx, StateSetter setSheet, Category cat,
    void Function(Product, String?, int) onAdd,
    VoidCallback onBack,
  ) {
    return FutureBuilder<List<Product>>(
      future: _loadProducts(cat.id),
      builder: (ctx, snap) {
        final products = snap.data ?? [];
        final loading = snap.connectionState == ConnectionState.waiting;

        return SizedBox(
          height: MediaQuery.of(ctx).size.height * 0.8,
          child: Column(
            children: [
              Container(
                height: 4, width: 40,
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(2)),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Row(children: [
                  IconButton(icon: const Icon(Icons.arrow_back, size: 22), onPressed: onBack, padding: EdgeInsets.zero, constraints: const BoxConstraints()),
                  const SizedBox(width: 8),
                  Expanded(child: Text(cat.name, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700))),
                ]),
              ),
              const Divider(),
              Expanded(
                child: loading
                    ? const LoadingWidget()
                    : products.isEmpty
                        ? Center(
                            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                              Icon(Icons.inventory_2_outlined, size: 48, color: AppTheme.textTertiary),
                              const SizedBox(height: 12),
                              const Text('No products', style: TextStyle(color: AppTheme.textSecondary)),
                            ]),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: products.length,
                            itemBuilder: (_, i) {
                              final product = products[i];
                              if (product.totalStock <= 0) return const SizedBox();
                              return Card(
                                margin: const EdgeInsets.only(bottom: 6),
                                child: ListTile(
                                  leading: ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: SizedBox(
                                      width: 44, height: 44,
                                      child: product.images.isNotEmpty
                                          ? Image.network(product.images.first, fit: BoxFit.cover, width: 44, height: 44, errorBuilder: (_, __, ___) => const Icon(Icons.image_outlined, color: AppTheme.textTertiary))
                                          : const Icon(Icons.image_outlined, color: AppTheme.textTertiary),
                                    ),
                                  ),
                                  title: Text(product.name, maxLines: 1, overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                  subtitle: Text('₹${product.getPriceForSize(null).toStringAsFixed(0)} · ${product.sizes.map((s) => '${s.name}:${s.stockQuantity}').join(' ')}',
                                      style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                                  trailing: IconButton(
                                    icon: const Icon(Icons.add_circle_outline, color: AppTheme.primary),
                                    onPressed: () => _showAddItemDetail(ctx, product, onAdd, () => setSheet(() {})),
                                  ),
                                ),
                              );
                            },
                          ),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<List<Product>> _loadProducts(String categoryId) async {
    try {
      final res = await _api.get(ApiEndpoints.products, queryParams: {'category': categoryId, 'limit': '100'});
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        return (body['data'] as List)
            .map((e) => Product.fromJson(e as Map<String, dynamic>))
            .toList();
      }
    } catch (_) {}
    return [];
  }

  void _showAddItemDetail(
    BuildContext ctx, Product product,
    void Function(Product, String?, int) onAdd,
    VoidCallback refresh,
  ) {
    String? selSize;
    int qty = 1;
    final hasSizes = product.sizes.isNotEmpty;

    showModalBottomSheet(
      context: ctx,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx2) => StatefulBuilder(
        builder: (ctx2, setSheet2) {
          final price = selSize != null ? product.getPriceForSize(selSize) : product.getPriceForSize(null);
          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(ctx2).viewInsets.bottom),
            child: SingleChildScrollView(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Container(height: 4, width: 40, margin: const EdgeInsets.only(top: 12, bottom: 8),
                    decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(2))),
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(product.name, maxLines: 2, overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    Row(children: [
                      Text('₹${price.toStringAsFixed(0)}',
                          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppTheme.primary)),
                      const SizedBox(width: 8),
                      Text(product.sizes.map((s) => '${s.name}:${s.stockQuantity}').join('  '),
                          maxLines: 2, overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 11, color: product.totalStock <= 0 ? AppTheme.error : AppTheme.textSecondary)),
                    ]),
                    if (hasSizes) ...[
                      const SizedBox(height: 16),
                      const Text('Select Size', style: TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8, runSpacing: 8,
                        children: product.sizes.map((s) {
                          final isSel = selSize == s.name;
                          return GestureDetector(
                            onTap: () => setSheet2(() => selSize = isSel ? null : s.name),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                              decoration: BoxDecoration(
                                color: isSel ? AppTheme.primary : AppTheme.surfaceVariant,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: isSel ? AppTheme.primary : AppTheme.border),
                              ),
                              child: Text(s.name,
                                  style: TextStyle(fontWeight: FontWeight.w600,
                                      color: isSel ? Colors.white : AppTheme.textPrimary)),
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                    const SizedBox(height: 20),
                    Row(children: [
                      Container(
                        decoration: BoxDecoration(
                          border: Border.all(color: AppTheme.border),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(children: [
                          InkWell(
                            onTap: qty > 1 ? () => setSheet2(() => qty--) : null,
                            child: Container(padding: const EdgeInsets.all(12),
                                child: Icon(Icons.remove, size: 20, color: qty > 1 ? AppTheme.textPrimary : AppTheme.textTertiary)),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                            decoration: BoxDecoration(
                              border: Border.symmetric(horizontal: BorderSide(color: AppTheme.border)),
                            ),
                            child: Text('$qty', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          ),
                          InkWell(
                            onTap: qty < product.totalStock ? () => setSheet2(() => qty++) : null,
                            child: Container(padding: const EdgeInsets.all(12),
                                child: Icon(Icons.add, size: 20, color: qty < product.totalStock ? AppTheme.textPrimary : AppTheme.textTertiary)),
                          ),
                        ]),
                      ),
                      const Spacer(),
                      Text('₹${(price * qty).toStringAsFixed(0)}',
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.primary)),
                    ]),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity, height: 50,
                      child: ElevatedButton(
                        onPressed: (hasSizes && selSize == null) ? null : () {
                          onAdd(product, selSize, qty);
                          Navigator.pop(ctx2);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.accent, foregroundColor: Colors.white,
                          disabledBackgroundColor: AppTheme.border, disabledForegroundColor: AppTheme.textTertiary,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        child: Text(hasSizes && selSize == null ? 'Select a Size' : 'Add ${qty} × ${product.name}'),
                      ),
                    ),
                  ]),
                ),
              ]),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final orderTotal = _items.fold(0.0, (s, e) => s + e.total);
    return Scaffold(
      appBar: AppBar(
        title: Text('Edit ${widget.order.orderNumber}'),
        actions: [
          TextButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Save', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            color: AppTheme.surface,
            child: Row(children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(widget.order.clientName ?? widget.order.orderNumber, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                if (widget.order.clientName != null)
                  Text(widget.order.orderNumber, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
              ])),
              StatusBadge(status: widget.order.status),
            ]),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: Row(children: [
              const Icon(Icons.shopping_cart_outlined, size: 18, color: AppTheme.textPrimary),
              const SizedBox(width: 6),
              Text('Items (${_items.length})', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
              const Spacer(),
              Text('₹${orderTotal.toStringAsFixed(0)}',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.primary)),
            ]),
          ),
          Expanded(
            child: _items.isEmpty
                ? Center(
                    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Icon(Icons.inventory_2_outlined, size: 44, color: AppTheme.textTertiary),
                      const SizedBox(height: 8),
                      const Text('No items', style: TextStyle(color: AppTheme.textSecondary)),
                    ]),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _items.length,
                    itemBuilder: (_, i) {
                      final item = _items[i];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 6),
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(12, 8, 8, 8),
                          child: Row(children: [
                            Expanded(
                              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Row(children: [
                                  Expanded(child: Text(item.productName, maxLines: 1, overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13))),
                                  if (item.productId.isEmpty)
                                    Container(
                                      margin: const EdgeInsets.only(left: 4),
                                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                      decoration: BoxDecoration(
                                        color: AppTheme.error.withOpacity(0.12),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                                        Icon(Icons.warning_amber_rounded, size: 11, color: AppTheme.error),
                                        const SizedBox(width: 2),
                                        Text('Deleted', style: TextStyle(color: AppTheme.error, fontSize: 9, fontWeight: FontWeight.w600)),
                                      ]),
                                    ),
                                ]),
                                Row(children: [
                                  if (item.size != null)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                      decoration: BoxDecoration(
                                        color: AppTheme.primary.withOpacity(0.08),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(item.size!, style: const TextStyle(color: AppTheme.primary, fontSize: 10, fontWeight: FontWeight.w600)),
                                    ),
                                  if (item.size != null) const SizedBox(width: 6),
                                  Text('₹${item.price.toStringAsFixed(0)} ea',
                                      style: const TextStyle(fontSize: 10, color: AppTheme.textTertiary)),
                                ]),
                              ]),
                            ),
                            Container(
                              decoration: BoxDecoration(
                                border: Border.all(color: AppTheme.border),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(children: [
                                InkWell(
                                  onTap: item.quantity > 1 ? () => setState(() => item.quantity--) : null,
                                  child: Container(padding: const EdgeInsets.all(6),
                                      child: Icon(Icons.remove, size: 16, color: item.quantity > 1 ? AppTheme.textPrimary : AppTheme.textTertiary)),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  decoration: BoxDecoration(
                                    border: Border.symmetric(horizontal: BorderSide(color: AppTheme.border)),
                                  ),
                                  child: Text('${item.quantity}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                                ),
                                InkWell(
                                  onTap: () => setState(() => item.quantity++),
                                  child: Container(padding: const EdgeInsets.all(6),
                                      child: const Icon(Icons.add, size: 16, color: AppTheme.textPrimary)),
                                ),
                              ]),
                            ),
                            const SizedBox(width: 8),
                            IconButton(
                              icon: const Icon(Icons.delete_outline, size: 20, color: AppTheme.error),
                              onPressed: () => setState(() => _items.removeAt(i)),
                            ),
                          ]),
                        ),
                      );
                    },
                  ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: _showAddProductSheet,
                    icon: const Icon(Icons.add, size: 18),
                    label: const Text('Add Products'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      side: BorderSide(color: AppTheme.primary.withOpacity(0.4)),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _saving ? null : _save,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary, foregroundColor: Colors.white,
                      disabledBackgroundColor: AppTheme.primary.withOpacity(0.5),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 0,
                      textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                    ),
                    child: _saving
                        ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                        : Text('Save Changes — ₹${orderTotal.toStringAsFixed(0)}'),
                  ),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

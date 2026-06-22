import 'package:flutter/material.dart';
import 'dart:convert';
import '../../models/product.dart';
import '../../services/api_client.dart';
import '../../services/api_endpoints.dart';
import '../../theme/app_theme.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/app_network_image.dart';
import '../../widgets/app_dialog.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> with SingleTickerProviderStateMixin {
  final ApiClient _api = ApiClient();
  late TabController _tabController;

  List<Product> _products = [];
  List<Map<String, dynamic>> _logs = [];
  bool _loadingProducts = true;
  bool _loadingLogs = true;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadProducts();
    _loadLogs();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadProducts() async {
    setState(() => _loadingProducts = true);
    try {
      final params = <String, String>{'limit': '200', 'isActive': 'true'};
      if (_search.isNotEmpty) params['search'] = _search;
      final res = await _api.get(ApiEndpoints.products, queryParams: params);
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      setState(() {
        if (body['success'] == true && body['data'] != null) {
          _products = (body['data'] as List).map((e) => Product.fromJson(e as Map<String, dynamic>)).toList();
        }
        _loadingProducts = false;
      });
    } catch (_) {
      setState(() => _loadingProducts = false);
    }
  }

  Future<void> _loadLogs() async {
    try {
      final res = await _api.get('/inventory/logs', queryParams: {'limit': '50'});
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      setState(() {
        if (body['success'] == true && body['data'] != null) {
          _logs = (body['data'] as List).map((e) => e as Map<String, dynamic>).toList();
        }
        _loadingLogs = false;
      });
    } catch (_) {
      setState(() => _loadingLogs = false);
    }
  }

  int get _lowStockCount => _products.where((p) => p.totalStock <= p.lowStockThresholdFallback).length;

  Future<void> _openManageStock(Product product) async {
    final sizes = product.sizes.map((s) => _SizeStockEntry(
      name: s.name,
      mrp: s.mrp,
      salesPrice: s.salesPrice,
      stockQuantity: s.stockQuantity,
      lowStockThreshold: s.lowStockThreshold,
    )).toList();

    final changed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _ManageStockSheet(
        productName: product.name,
        sizes: sizes,
        totalStockFallback: product.totalStockFallback,
      ),
    );

    if (changed != true) return;

    final sizeData = sizes.map((s) => {
      'name': s.name,
      'mrp': s.mrp,
      'salesPrice': s.salesPrice,
      'stockQuantity': s.stockQuantity,
      'lowStockThreshold': s.lowStockThreshold,
    }).toList();

    final totalStock = sizeData.fold<int>(0, (sum, s) => sum + (s['stockQuantity'] as int));

    try {
      final res = await _api.put('/products/${product.id}', body: {
        'sizes': sizeData,
        'stockQuantity': totalStock,
        'lowStockThreshold': sizeData.isNotEmpty ? sizeData.first['lowStockThreshold'] : product.lowStockThresholdFallback,
      });
      final resp = jsonDecode(res.body) as Map<String, dynamic>;
      if (resp['success'] == true) {
        _loadProducts();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Stock updated successfully'),
            backgroundColor: AppTheme.success, behavior: SnackBarBehavior.floating,
          ));
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text(resp['message'] as String? ?? 'Failed to update stock'),
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
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Inventory'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white60,
          indicatorColor: Colors.white,
          indicatorWeight: 3,
          tabs: const [
            Tab(text: 'All Products'),
            Tab(text: 'Inventory Logs'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildProductsTab(),
          _buildLogsTab(),
        ],
      ),
    );
  }

  Widget _buildProductsTab() {
    return Column(
      children: [
        if (_lowStockCount > 0)
          Container(
            width: double.infinity, margin: const EdgeInsets.all(12), padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: AppTheme.error.withOpacity(0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.error.withOpacity(0.2))),
            child: Row(children: [
              const Icon(Icons.warning_amber_rounded, color: AppTheme.error, size: 20),
              const SizedBox(width: 8),
              Flexible(child: Text('$_lowStockCount product(s) below threshold', overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppTheme.error, fontWeight: FontWeight.w600, fontSize: 13))),
            ]),
          ),
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 4, 12, 8),
          child: TextField(
            decoration: InputDecoration(
              hintText: 'Search products...', prefixIcon: const Icon(Icons.search, size: 20),
              filled: true, fillColor: AppTheme.surfaceVariant,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              contentPadding: const EdgeInsets.symmetric(vertical: 12),
            ),
            onChanged: (v) { _search = v; _loadProducts(); },
          ),
        ),
        Expanded(
          child: _loadingProducts
              ? const LoadingWidget()
              : _products.isEmpty
                  ? const Center(child: Text('No products found'))
                  : RefreshIndicator(
                      onRefresh: _loadProducts,
                      child: ListView.builder(
                        padding: const EdgeInsets.fromLTRB(12, 0, 12, 80),
                        itemCount: _products.length,
                        itemBuilder: (_, i) {
                          final p = _products[i];
                          final isLow = p.totalStock <= p.lowStockThresholdFallback;
                          return Card(
                            clipBehavior: Clip.antiAlias,
                            elevation: 1,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            margin: const EdgeInsets.only(bottom: 10),
                            child: InkWell(
                              onTap: () => _openManageStock(p),
                              child: Row(
                                children: [
                                  ClipRRect(
                                    borderRadius: const BorderRadius.horizontal(left: Radius.circular(12)),
                                    child: AppNetworkImage(
                                      imageUrl: p.images.isNotEmpty ? p.images.first : null,
                                      width: 90, height: 90, borderRadius: 0,
                                    ),
                                  ),
                                  Expanded(
                                    child: Padding(
                                      padding: const EdgeInsets.fromLTRB(12, 10, 8, 10),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Text(p.name, maxLines: 1, overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                                          if (p.pieces > 0)
                                            Text('Pieces: ${p.pieces}',
                                                style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                                          const SizedBox(height: 4),
                                          if (p.sizes.isNotEmpty)
                                            Text(
                                              p.sizes.map((s) => '${s.name}:${s.stockQuantity}').join('  '),
                                              maxLines: 1, overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(fontSize: 11, color: AppTheme.textTertiary),
                                            )
                                          else
                                            Text('Stock: ${p.totalStock}',
                                                style: TextStyle(fontSize: 11, color: isLow ? AppTheme.error : AppTheme.textSecondary)),
                                          const SizedBox(height: 2),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: isLow ? AppTheme.error.withOpacity(0.1) : AppTheme.success.withOpacity(0.1),
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            child: Text(
                                              isLow ? (p.totalStock == 0 ? 'Out of Stock' : 'Low Stock') : 'In Stock',
                                              style: TextStyle(fontSize: 10, color: isLow ? AppTheme.error : AppTheme.success, fontWeight: FontWeight.w600),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  SizedBox(
                                    height: 32,
                                    child: ElevatedButton(
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppTheme.primaryDark,
                                        foregroundColor: Colors.white,
                                        padding: const EdgeInsets.symmetric(horizontal: 12),
                                        minimumSize: Size.zero,
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                        textStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                                        elevation: 0,
                                      ),
                                      onPressed: () => _openManageStock(p),
                                      child: const Text('Manage'),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
        ),
      ],
    );
  }

  Widget _buildLogsTab() {
    return _loadingLogs
        ? const LoadingWidget()
        : _logs.isEmpty
            ? const Center(child: Text('No inventory logs'))
            : ListView.builder(
                padding: const EdgeInsets.all(12),
                itemCount: _logs.length,
                itemBuilder: (_, i) {
                  final log = _logs[i];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      leading: Container(
                        width: 36, height: 36,
                        decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.08), borderRadius: BorderRadius.circular(8)),
                        child: const Icon(Icons.history, size: 18, color: AppTheme.primary),
                      ),
                      title: Text(log['productName'] as String? ?? '', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                      subtitle: Text(log['notes'] as String? ?? log['action'] as String? ?? '', style: const TextStyle(fontSize: 11)),
                      trailing: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.end, children: [
                        Text(log['createdAt'] as String? ?? '', style: const TextStyle(fontSize: 10, color: AppTheme.textTertiary)),
                      ]),
                    ),
                  );
                },
              );
  }
}

class _SizeStockEntry {
  String name;
  double mrp;
  double salesPrice;
  int stockQuantity;
  int lowStockThreshold;

  _SizeStockEntry({
    required this.name,
    required this.mrp,
    required this.salesPrice,
    this.stockQuantity = 0,
    this.lowStockThreshold = 10,
  });
}

class _ManageStockSheet extends StatefulWidget {
  final String productName;
  final List<_SizeStockEntry> sizes;
  final int totalStockFallback;

  const _ManageStockSheet({
    required this.productName,
    required this.sizes,
    required this.totalStockFallback,
  });

  @override
  State<_ManageStockSheet> createState() => _ManageStockSheetState();
}

class _ManageStockSheetState extends State<_ManageStockSheet> {
  final _availableSizeNames = ['SM', 'M', 'L', 'XL', 'XXL'];

  void _addSize() {
    final used = widget.sizes.map((s) => s.name).toSet();
    final available = _availableSizeNames.where((n) => !used.contains(n)).toList();
    if (available.isEmpty) return;

    showDialog<String>(
      context: context,
      builder: (ctx) => SimpleDialog(
        title: const Text('Add Size'),
        children: available.map((name) => SimpleDialogOption(
          onPressed: () => Navigator.pop(ctx, name),
          child: Text(name),
        )).toList(),
      ),
    ).then((name) {
      if (name != null && mounted) {
        setState(() {
          widget.sizes.add(_SizeStockEntry(
            name: name,
            mrp: 0,
            salesPrice: 0,
            stockQuantity: 0,
            lowStockThreshold: 10,
          ));
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.inventory_2_outlined, size: 22, color: AppTheme.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(widget.productName,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                ),
                IconButton(
                  icon: const Icon(Icons.close, size: 20),
                  onPressed: () => Navigator.pop(context, false),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text('Total stock: ${widget.sizes.fold(0, (sum, s) => sum + s.stockQuantity)}',
                style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
            const SizedBox(height: 14),
            if (widget.sizes.isEmpty)
              const Padding(
                padding: EdgeInsets.only(bottom: 12),
                child: Text('No sizes configured', style: TextStyle(color: AppTheme.textTertiary, fontSize: 13)),
              )
            else
              Flexible(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: widget.sizes.length,
                  itemBuilder: (_, i) {
                    final s = widget.sizes[i];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Row(
                        children: [
                          Container(
                            width: 36, height: 36,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: AppTheme.primary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(s.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: AppTheme.primary)),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: TextFormField(
                              initialValue: s.stockQuantity.toString(),
                              keyboardType: TextInputType.number,
                              decoration: InputDecoration(
                                isDense: true,
                                labelText: '${s.name} Stock',
                                filled: true, fillColor: AppTheme.surfaceVariant,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                              ),
                              onChanged: (v) { s.stockQuantity = int.tryParse(v) ?? 0; },
                            ),
                          ),
                          const SizedBox(width: 6),
                          IconButton(
                            icon: const Icon(Icons.remove_circle_outline, size: 20, color: AppTheme.error),
                            onPressed: () {
                              setState(() => widget.sizes.removeAt(i));
                            },
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            if (widget.sizes.length < _availableSizeNames.length)
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.primary,
                    minimumSize: const Size(double.infinity, 38),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onPressed: _addSize,
                  icon: const Icon(Icons.add, size: 16),
                  label: const Text('Add Size', style: TextStyle(fontSize: 12)),
                ),
              ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 44,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.error,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                      onPressed: () => Navigator.pop(context, false),
                      child: const Text('Cancel', style: TextStyle(color: Colors.white)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: SizedBox(
                    height: 44,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryDark,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                      onPressed: () => Navigator.pop(context, true),
                      child: const Text('Save'),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

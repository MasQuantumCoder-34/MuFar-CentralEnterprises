import 'package:flutter/material.dart';
import 'dart:convert';
import '../../models/product.dart';
import '../../services/api_client.dart';
import '../../services/api_endpoints.dart';
import '../../theme/app_theme.dart';
import '../../widgets/loading_widget.dart';

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
      final params = <String, String>{'limit': '100'};
      if (_search.isNotEmpty) params['search'] = _search;
      final res = await _api.get(ApiEndpoints.products, queryParams: params);
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        setState(() {
          _products = (body['data'] as List).map((e) => Product.fromJson(e as Map<String, dynamic>)).toList();
          _loadingProducts = false;
        });
      }
    } catch (_) {
      setState(() => _loadingProducts = false);
    }
  }

  Future<void> _loadLogs() async {
    try {
      final res = await _api.get('/inventory/logs', queryParams: {'limit': '50'});
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        setState(() {
          _logs = (body['data'] as List).map((e) => e as Map<String, dynamic>).toList();
          _loadingLogs = false;
        });
      }
    } catch (_) {
      setState(() => _loadingLogs = false);
    }
  }

  int get _lowStockCount => _products.where((p) => p.stockQuantity <= p.lowStockThreshold).length;

  Future<void> _adjustStock(Product product, {required bool isIn}) async {
    final qtyCtrl = TextEditingController();
    final notesCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();

    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(isIn ? 'Stock In' : 'Stock Out'),
        content: Form(
          key: formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('${product.name} — Current stock: ${product.stockQuantity}', style: const TextStyle(fontSize: 13)),
              const SizedBox(height: 12),
              TextFormField(
                controller: qtyCtrl,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'Quantity',
                  filled: true, fillColor: AppTheme.surfaceVariant,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                ),
                validator: (v) => (v == null || v.trim().isEmpty || int.tryParse(v.trim()) == null || int.parse(v.trim()) <= 0) ? 'Valid positive number required' : null,
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: notesCtrl,
                decoration: InputDecoration(
                  labelText: 'Notes (optional)',
                  filled: true, fillColor: AppTheme.surfaceVariant,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              if (formKey.currentState!.validate()) Navigator.pop(ctx, true);
            },
            child: const Text('Confirm'),
          ),
        ],
      ),
    );

    if (result != true) return;
    try {
      final qty = int.parse(qtyCtrl.text.trim());
      final body = <String, dynamic>{
        'productId': product.id,
        'quantity': isIn ? qty : -qty,
      };
      if (notesCtrl.text.trim().isNotEmpty) body['notes'] = notesCtrl.text.trim();

      final res = await _api.post('/inventory/adjust', body: body);
      final resp = jsonDecode(res.body) as Map<String, dynamic>;
      if (resp['success'] == true) {
        _loadProducts();
        _loadLogs();
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(isIn ? 'Stock added successfully' : 'Stock removed successfully'),
          backgroundColor: AppTheme.success, behavior: SnackBarBehavior.floating,
        ));
      }
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Network error'), backgroundColor: AppTheme.error, behavior: SnackBarBehavior.floating,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Inventory'), bottom: TabBar(
        controller: _tabController,
        labelColor: AppTheme.primary,
        unselectedLabelColor: AppTheme.textSecondary,
        indicatorColor: AppTheme.primary,
        tabs: const [Tab(text: 'All Products'), Tab(text: 'Inventory Logs')],
      )),
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
              Text('$_lowStockCount product(s) below threshold', style: const TextStyle(color: AppTheme.error, fontWeight: FontWeight.w600, fontSize: 13)),
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
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                      itemCount: _products.length,
                      itemBuilder: (_, i) {
                        final p = _products[i];
                        final isLow = p.stockQuantity <= p.lowStockThreshold;
                        return Card(
                          margin: const EdgeInsets.only(bottom: 6),
                          child: Padding(
                            padding: const EdgeInsets.all(10),
                            child: Row(
                              children: [
                                Container(
                                  width: 40, height: 40,
                                  decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.08), borderRadius: BorderRadius.circular(8)),
                                  child: const Icon(Icons.inventory_2_outlined, size: 20, color: AppTheme.primary),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                    Text(p.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                    Text('SKU: ${p.sku.isNotEmpty ? p.sku : 'N/A'}', style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                                  ]),
                                ),
                                Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                                  Text('${p.stockQuantity}', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: isLow ? AppTheme.error : AppTheme.textPrimary)),
                                  Text(isLow ? (p.stockQuantity == 0 ? 'Out of Stock' : 'Low Stock') : 'In Stock',
                                      style: TextStyle(fontSize: 10, color: isLow ? AppTheme.error : AppTheme.success, fontWeight: FontWeight.w600)),
                                ]),
                                const SizedBox(width: 8),
                                Column(children: [
                                  SizedBox(
                                    height: 28, child: OutlinedButton(
                                      style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 8), foregroundColor: AppTheme.success),
                                      onPressed: () => _adjustStock(p, isIn: true), child: const Text('In', style: TextStyle(fontSize: 11)),
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  SizedBox(
                                    height: 28, child: OutlinedButton(
                                      style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 8), foregroundColor: AppTheme.error),
                                      onPressed: () => _adjustStock(p, isIn: false), child: const Text('Out', style: TextStyle(fontSize: 11)),
                                    ),
                                  ),
                                ]),
                              ],
                            ),
                          ),
                        );
                      },
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
                    margin: const EdgeInsets.only(bottom: 6),
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

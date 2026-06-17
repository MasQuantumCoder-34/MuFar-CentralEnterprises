import 'package:flutter/material.dart';
import 'dart:convert';
import '../../models/order.dart';
import '../../services/api_client.dart';
import '../../services/api_endpoints.dart';
import '../../theme/app_theme.dart';
import '../../widgets/loading_widget.dart';
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
          _loading = false;
        });
      }
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _editOrder(Order order) async {
    final qtyCtrls = <TextEditingController>[];
    for (final item in order.items) {
      qtyCtrls.add(TextEditingController(text: item.quantity.toString()));
    }
    final notesCtrl = TextEditingController(text: order.notes ?? '');
    final formKey = GlobalKey<FormState>();

    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(children: [
          Expanded(child: Text('Edit ${order.orderNumber}', style: const TextStyle(fontSize: 16))),
          StatusBadge(status: order.status, fontSize: 10),
        ]),
        contentPadding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
        content: Form(
          key: formKey,
          child: SizedBox(
            width: 400,
            child: SingleChildScrollView(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                ...order.items.asMap().entries.map((e) {
                  final i = e.key;
                  final item = e.value;
                  return Card(
                    margin: const EdgeInsets.only(bottom: 6),
                    child: Padding(
                      padding: const EdgeInsets.all(8),
                      child: Row(children: [
                        Expanded(flex: 2, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(item.productName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                          if (item.size != null) Text('Size: ${item.size}', style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
                          Text('₹${item.price} ×', style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
                        ])),
                        SizedBox(
                          width: 60,
                          child: TextFormField(
                            controller: qtyCtrls[i], keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                              contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                              filled: true, fillColor: AppTheme.surfaceVariant,
                            ),
                            textAlign: TextAlign.center,
                            validator: (v) => (v == null || v.trim().isEmpty || int.tryParse(v.trim()) == null || int.parse(v.trim()) <= 0) ? '!' : null,
                          ),
                        ),
                        const SizedBox(width: 8),
                        SizedBox(
                          width: 60, child: Text('₹${(item.price * (int.tryParse(qtyCtrls[i].text) ?? item.quantity)).toStringAsFixed(0)}',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppTheme.primary), textAlign: TextAlign.right),
                        ),
                      ]),
                    ),
                  );
                }),
                const SizedBox(height: 8),
                TextFormField(
                  controller: notesCtrl, maxLines: 2,
                  decoration: InputDecoration(
                    labelText: 'Client Notes', filled: true, fillColor: AppTheme.surfaceVariant,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  ),
                ),
              ]),
            ),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () { if (formKey.currentState!.validate()) Navigator.pop(ctx, true); }, child: const Text('Save Changes')),
        ],
      ),
    );

    if (result != true) { for (final c in qtyCtrls) c.dispose(); notesCtrl.dispose(); return; }
    try {
      final items = order.items.asMap().entries.map((e) {
        final i = e.key;
        final item = e.value;
        return <String, dynamic>{
          'product': item.productId ?? '',
          'quantity': int.parse(qtyCtrls[i].text.trim()),
          if (item.size != null) 'size': item.size,
        };
      }).toList();
      final body = <String, dynamic>{'items': items};
      if (notesCtrl.text.trim().isNotEmpty) body['notes'] = notesCtrl.text.trim();

      final res = await _api.put('/orders/${order.id}', body: body);
      final resp = jsonDecode(res.body) as Map<String, dynamic>;
      if (resp['success'] == true) {
        _load();
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Order updated'), backgroundColor: AppTheme.success, behavior: SnackBarBehavior.floating));
      }
    } catch (_) {}
    for (final c in qtyCtrls) c.dispose();
    notesCtrl.dispose();
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
                              Text(order.orderNumber, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                              if (order.clientName != null) Text(order.clientName!, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                              Text('${order.items.length} items · ₹${order.total.toStringAsFixed(0)}', style: const TextStyle(fontSize: 11, color: AppTheme.textTertiary)),
                            ])),
                            StatusBadge(status: order.status),
                            const SizedBox(width: 8),
                            IconButton(icon: const Icon(Icons.edit_outlined, size: 18), onPressed: () => _editOrder(order)),
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

import 'package:flutter/material.dart';
import 'dart:convert';
import '../../models/order.dart';
import '../../services/api_client.dart';
import '../../services/api_endpoints.dart';
import '../../theme/app_theme.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/status_badge.dart';
import 'order_detail_screen.dart';

class CancelOrderScreen extends StatefulWidget {
  final String? initialOrderId;
  const CancelOrderScreen({super.key, this.initialOrderId});

  @override
  State<CancelOrderScreen> createState() => _CancelOrderScreenState();
}

class _CancelOrderScreenState extends State<CancelOrderScreen> {
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

  Future<void> _cancelOrder(Order order) async {
    final reasonCtrl = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel Order'),
        content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Are you sure you want to cancel ${order.orderNumber}?', style: const TextStyle(fontSize: 13)),
          const SizedBox(height: 4),
          Text('Stock will be restored automatically.', style: TextStyle(fontSize: 11, color: AppTheme.error.withOpacity(0.8))),
          const SizedBox(height: 12),
          TextField(
            controller: reasonCtrl, maxLines: 2,
            decoration: InputDecoration(
              labelText: 'Cancellation reason', filled: true, fillColor: AppTheme.surfaceVariant,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
            ),
          ),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Keep Order')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Cancel Order'),
          ),
        ],
      ),
    );

    if (confirmed != true) { reasonCtrl.dispose(); return; }
    try {
      final body = <String, dynamic>{'status': 'cancelled'};
      if (reasonCtrl.text.trim().isNotEmpty) body['notes'] = reasonCtrl.text.trim();
      final res = await _api.put('/orders/${order.id}/status', body: body);
      final resp = jsonDecode(res.body) as Map<String, dynamic>;
      if (resp['success'] == true) {
        _load();
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Order cancelled'), backgroundColor: AppTheme.success, behavior: SnackBarBehavior.floating,
        ));
      }
    } catch (_) {}
    reasonCtrl.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Cancel Orders')),
      body: _loading
          ? const LoadingWidget()
          : _orders.isEmpty
              ? Center(
                  child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(Icons.check_circle_outline, size: 48, color: AppTheme.textTertiary),
                    const SizedBox(height: 12),
                    const Text('No orders available to cancel', style: TextStyle(color: AppTheme.textSecondary)),
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
                              Text('₹${order.total.toStringAsFixed(0)}', style: const TextStyle(fontSize: 11, color: AppTheme.textTertiary)),
                            ])),
                            StatusBadge(status: order.status),
                            const SizedBox(width: 8),
                            IconButton(
                              icon: const Icon(Icons.visibility_outlined, size: 18),
                              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: order.id))),
                            ),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 12), minimumSize: Size.zero),
                              onPressed: () => _cancelOrder(order),
                              child: const Text('Cancel', style: TextStyle(fontSize: 11)),
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

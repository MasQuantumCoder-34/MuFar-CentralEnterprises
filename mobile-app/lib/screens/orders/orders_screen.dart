import 'package:flutter/material.dart';
import 'dart:convert';
import '../../models/order.dart';
import '../../services/api_client.dart';
import '../../services/api_endpoints.dart';
import '../../theme/app_theme.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/order_card.dart';
import 'order_detail_screen.dart';

class OrdersScreen extends StatefulWidget {
  final String? initialOrderId;
  const OrdersScreen({super.key, this.initialOrderId});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  final ApiClient _api = ApiClient();
  List<Order> _orders = [];
  bool _loading = true;
  String? _error;
  String _statusFilter = '';
  bool _showFilters = false;

  static const _statuses = [
    '', 'pending', 'processing', 'out_for_delivery', 'delivered', 'cancelled',
  ];

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    setState(() => _loading = true);
    try {
      final params = <String, String>{'limit': '50', 'sort': '-createdAt'};
      if (_statusFilter.isNotEmpty) params['status'] = _statusFilter;
      final res = await _api.get(ApiEndpoints.orders, queryParams: params);
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        setState(() {
          _orders = (body['data'] as List)
              .map((e) => Order.fromJson(e as Map<String, dynamic>))
              .toList();
          _loading = false;
        });
      } else {
        setState(() { _error = body['message'] as String?; _loading = false; });
      }
    } catch (e) {
      setState(() { _error = 'Network error'; _loading = false; });
    }
  }

  String _label(String s) => s.isEmpty ? 'All' : s.replaceAll('_', ' ');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Orders'),
        actions: [
          IconButton(
            icon: Icon(_showFilters ? Icons.filter_alt_off : Icons.filter_alt_outlined),
            onPressed: () => setState(() => _showFilters = !_showFilters),
          ),
        ],
      ),
      body: Column(
        children: [
          if (_showFilters)
            Container(
              height: 52,
              color: AppTheme.surface,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                itemCount: _statuses.length,
                itemBuilder: (_, i) {
                  final s = _statuses[i];
                  final isSelected = _statusFilter == s;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(
                        _label(s),
                        style: TextStyle(
                          color: isSelected ? Colors.white : AppTheme.textPrimary,
                          fontWeight: FontWeight.w500,
                          fontSize: 12,
                        ),
                      ),
                      selected: isSelected,
                      onSelected: (_) {
                        setState(() => _statusFilter = s);
                        _loadOrders();
                      },
                      selectedColor: AppTheme.primary,
                      checkmarkColor: Colors.white,
                      showCheckmark: false,
                      backgroundColor: AppTheme.surfaceVariant,
                      side: BorderSide(
                        color: isSelected ? AppTheme.primary : AppTheme.border,
                      ),
                    ),
                  );
                },
              ),
            ),
          Expanded(
            child: _loading
                ? const LoadingWidget()
                : _error != null
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.cloud_off, size: 48, color: AppTheme.textTertiary),
                            const SizedBox(height: 12),
                            Text(_error!,
                                style: const TextStyle(color: AppTheme.textSecondary)),
                          ],
                        ),
                      )
                    : _orders.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.receipt_long_outlined,
                                    size: 48, color: AppTheme.textTertiary),
                                const SizedBox(height: 12),
                                const Text('No orders found',
                                    style: TextStyle(color: AppTheme.textSecondary)),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _loadOrders,
                            child: ListView.builder(
                              padding: const EdgeInsets.only(top: 8, bottom: 16),
                              itemCount: _orders.length,
                              itemBuilder: (_, i) => OrderCard(
                                order: _orders[i],
                                onTap: () => Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) =>
                                        OrderDetailScreen(orderId: _orders[i].id),
                                  ),
                                ),
                              ),
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}

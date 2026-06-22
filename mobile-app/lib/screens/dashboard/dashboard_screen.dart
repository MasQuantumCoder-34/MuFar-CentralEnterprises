import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:convert';
import '../../models/order.dart';
import '../../models/user.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_client.dart';
import '../../services/api_endpoints.dart';
import '../../theme/app_theme.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/status_badge.dart';
import '../orders/orders_screen.dart';
import '../orders/order_detail_screen.dart';
import '../orders/create_order_screen.dart';
import '../orders/modify_order_screen.dart';
import '../orders/cancel_order_screen.dart';
import '../clients/clients_screen.dart';

class DashboardScreen extends StatefulWidget {
  final void Function(int index)? onTabChange;
  const DashboardScreen({super.key, this.onTabChange});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiClient _api = ApiClient();
  List<Order> _recentOrders = [];
  List<User> _clients = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      if (mounted) context.read<AuthProvider>().loadProfile();
      final results = await Future.wait([
        _api.get(ApiEndpoints.orders, queryParams: {'limit': '5'}),
        _api.get(ApiEndpoints.users, queryParams: {'role': 'client', 'limit': '100'}),
      ]);
      final ordersBody = jsonDecode(results[0].body) as Map<String, dynamic>;
      final clientsBody = jsonDecode(results[1].body) as Map<String, dynamic>;
      setState(() {
        if (ordersBody['success'] == true && ordersBody['data'] != null) {
          _recentOrders = (ordersBody['data'] as List).map((e) => Order.fromJson(e as Map<String, dynamic>)).toList();
        }
        if (clientsBody['success'] == true && clientsBody['data'] != null) {
          _clients = (clientsBody['data'] as List).map((e) => User.fromJson(e as Map<String, dynamic>)).toList();
        }
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Dashboard'), automaticallyImplyLeading: false),
      body: _loading
          ? const LoadingWidget()
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                children: [
                  Text('Central Enterprises',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
                  Text('Internal B2B Order Management',
                      style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                  const SizedBox(height: 20),
                  _buildActionCards(),
                  const SizedBox(height: 24),
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    Text('Recent Orders', style: Theme.of(context).textTheme.titleMedium),
                    TextButton(
                      onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const OrdersScreen())),
                      child: const Text('View all'),
                    ),
                  ]),
                  if (_recentOrders.isEmpty)
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                          Icon(Icons.receipt_long_outlined, color: AppTheme.textTertiary, size: 24),
                          const SizedBox(width: 8),
                          const Text('No orders yet', style: TextStyle(color: AppTheme.textSecondary)),
                        ]),
                      ),
                    )
                  else
                    ..._recentOrders.map((order) => Card(
                          margin: const EdgeInsets.only(bottom: 6),
                          child: InkWell(
                            borderRadius: BorderRadius.circular(12),
                            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: order.id))),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              child: Row(children: [
                                Expanded(flex: 2, child: Text(order.clientName ?? order.orderNumber, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
                                Expanded(flex: 2, child: Text(order.clientName != null ? order.orderNumber : '', style: const TextStyle(fontSize: 11), maxLines: 1, overflow: TextOverflow.ellipsis)),
                                Expanded(child: Text('₹${order.total.toStringAsFixed(0)}', style: const TextStyle(fontSize: 11), textAlign: TextAlign.right)),
                                const SizedBox(width: 4),
                                Flexible(child: StatusBadge(status: order.status, fontSize: 9)),
                              ]),
                            ),
                          ),
                        )),
                  const SizedBox(height: 16),
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    Text('Clients', style: Theme.of(context).textTheme.titleMedium),
                    TextButton(
                      onPressed: () { widget.onTabChange?.call(4); Navigator.push(context, MaterialPageRoute(builder: (_) => const ClientsScreen())); },
                      child: const Text('View all'),
                    ),
                  ]),
                  if (_clients.isEmpty)
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                          Icon(Icons.people_outline, color: AppTheme.textTertiary, size: 24),
                          const SizedBox(width: 8),
                          const Text('No clients', style: TextStyle(color: AppTheme.textSecondary)),
                        ]),
                      ),
                    )
                  else
                    ..._clients.take(5).map((client) => Card(
                          margin: const EdgeInsets.only(bottom: 6),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            child: Row(children: [
                              Expanded(flex: 2, child: Text(client.storeName ?? client.name ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
                              Expanded(flex: 2, child: Text(client.ownerName ?? '', style: const TextStyle(fontSize: 11), maxLines: 1, overflow: TextOverflow.ellipsis)),
                              Expanded(child: Text(client.mobile ?? '', style: const TextStyle(fontSize: 11))),
                              Text('${client.totalOrders}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                              const SizedBox(width: 4),
                              IconButton(
                                icon: const Icon(Icons.shopping_cart_outlined, size: 16),
                                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CreateOrderScreen())),
                                tooltip: 'Create order',
                              ),
                            ]),
                          ),
                        )),
                ],
              ),
            ),
    );
  }

  Widget _buildActionCards() {
    return GridView.count(
      crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.5, crossAxisSpacing: 10, mainAxisSpacing: 10,
      children: [
        _actionCard(Icons.add_circle_outline, 'Create Order', AppTheme.primary, () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CreateOrderScreen()))),
        _actionCard(Icons.receipt_long_outlined, 'View Orders', AppTheme.accent, () => Navigator.push(context, MaterialPageRoute(builder: (_) => const OrdersScreen()))),
        _actionCard(Icons.edit_outlined, 'Modify Orders', AppTheme.primaryLight, () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ModifyOrderScreen()))),
        _actionCard(Icons.cancel_outlined, 'Cancel Orders', AppTheme.error, () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CancelOrderScreen()))),
      ],
    );
  }

  Widget _actionCard(IconData icon, String label, Color color, VoidCallback onTap) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            color: color.withOpacity(0.08),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: color.withOpacity(0.15)),
          ),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Container(
              width: 40, height: 40,
              decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(12)),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(height: 6),
            Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 12)),
          ]),
        ),
      ),
    );
  }
}

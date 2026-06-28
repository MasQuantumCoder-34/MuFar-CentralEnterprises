import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:fl_chart/fl_chart.dart';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/loading_widget.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> with SingleTickerProviderStateMixin {
  final ApiClient _api = ApiClient();
  late TabController _tabController;

  String _period = 'daily';

  Map<String, dynamic> _salesSummary = {};
  List<Map<String, dynamic>> _salesBreakdown = [];

  Map<String, dynamic> _invSummary = {};
  List<Map<String, dynamic>> _lowStock = [];
  List<Map<String, dynamic>> _outOfStock = [];

  int _totalClients = 0;
  List<Map<String, dynamic>> _topCustomers = [];

  bool _loadingSales = true;
  bool _loadingInventory = true;
  bool _loadingCustomers = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadSales();
    _loadInventory();
    _loadCustomers();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadSales() async {
    setState(() => _loadingSales = true);
    try {
      final res = await _api.get('/reports/sales', queryParams: {'type': _period});
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        final data = body['data'] as Map<String, dynamic>;
        setState(() {
          _salesSummary = data['summary'] as Map<String, dynamic>? ?? {};
          _salesBreakdown = (data['breakdown'] as List?)?.map((e) => e as Map<String, dynamic>).toList() ?? [];
        });
      }
    } catch (_) {}
    setState(() => _loadingSales = false);
  }

  Future<void> _loadInventory() async {
    setState(() => _loadingInventory = true);
    try {
      final res = await _api.get('/reports/inventory');
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        final data = body['data'] as Map<String, dynamic>;
        setState(() {
          _invSummary = data['summary'] as Map<String, dynamic>? ?? {};
          _lowStock = (data['lowStockProducts'] as List?)?.map((e) => e as Map<String, dynamic>).toList() ?? [];
          _outOfStock = (data['outOfStockProducts'] as List?)?.map((e) => e as Map<String, dynamic>).toList() ?? [];
        });
      }
    } catch (_) {}
    setState(() => _loadingInventory = false);
  }

  Future<void> _loadCustomers() async {
    setState(() => _loadingCustomers = true);
    try {
      final res = await _api.get('/reports/customers');
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        final data = body['data'] as Map<String, dynamic>;
        setState(() {
          _totalClients = (data['totalClients'] as num?)?.toInt() ?? 0;
          _topCustomers = (data['topCustomers'] as List?)?.map((e) => e as Map<String, dynamic>).toList() ?? [];
        });
      }
    } catch (_) {}
    setState(() => _loadingCustomers = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reports')),
      body: Column(
        children: [
          Container(
            color: AppTheme.surface,
            child: TabBar(
              controller: _tabController,
              labelColor: AppTheme.primary, unselectedLabelColor: AppTheme.textSecondary,
              indicatorColor: AppTheme.primary,
              tabs: const [Tab(text: 'Sales'), Tab(text: 'Inventory'), Tab(text: 'Customers')],
            ),
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildSalesTab(),
                _buildInventoryTab(),
                _buildCustomersTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _summaryCard(String label, String value, {Color? color}) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
        decoration: BoxDecoration(
          color: (color ?? AppTheme.primary).withOpacity(0.08),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: color ?? AppTheme.primary)),
            const SizedBox(height: 4),
            Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }

  Widget _salesTab() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
          child: Row(
            children: [
              DropdownButton<String>(
                value: _period, underline: const SizedBox(),
                items: ['daily', 'weekly', 'monthly', 'yearly'].map((p) => DropdownMenuItem(
                  value: p, child: Text(p[0].toUpperCase() + p.substring(1)),
                )).toList(),
                onChanged: (v) { setState(() => _period = v!); _loadSales(); },
              ),
              const Spacer(),
              OutlinedButton.icon(
                icon: const Icon(Icons.download, size: 16),
                label: const Text('Export CSV', style: TextStyle(fontSize: 12)),
                onPressed: () {},
              ),
            ],
          ),
        ),
        if (_salesBreakdown.isEmpty)
          const Expanded(
            child: Center(child: Text('No sales data for this period', style: TextStyle(color: AppTheme.textSecondary))),
          )
        else
          Expanded(
            child: _salesContent(),
          ),
      ],
    );
  }

  Widget _salesContent() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
      children: [
        if (_salesSummary.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              children: [
                _summaryCard('Orders', '${_salesSummary['totalOrders'] ?? 0}'),
                const SizedBox(width: 8),
                _summaryCard('Revenue', '₹${(_salesSummary['totalRevenue'] as num?)?.toDouble() ?? 0}', color: AppTheme.success),
                const SizedBox(width: 8),
                _summaryCard('Avg Order', '₹${(_salesSummary['averageOrderValue'] as num?)?.toDouble() ?? 0}', color: AppTheme.accent),
              ],
            ),
          ),
        if (_salesBreakdown.length >= 2)
          SizedBox(
            height: 200,
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: BarChart(
                  BarChartData(
                    gridData: FlGridData(show: true, drawVerticalLine: false),
                    titlesData: FlTitlesData(
                      leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 36, getTitlesWidget: (v, _) => Text('${v.toInt()}', style: const TextStyle(fontSize: 8)))),
                      bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, getTitlesWidget: (v, _) {
                        final i = v.toInt();
                        if (i >= 0 && i < _salesBreakdown.length) {
                          final label = _salesBreakdown[i]['period'] as String? ?? '';
                          return Text(label.length > 5 ? label.substring(label.length - 5) : label, style: const TextStyle(fontSize: 7));
                        }
                        return const Text('');
                      })),
                      topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    ),
                    borderData: FlBorderData(show: false),
                    barGroups: _salesBreakdown.asMap().entries.map((e) => BarChartGroupData(x: e.key, barRods: [
                      BarChartRodData(toY: (e.value['totalRevenue'] as num?)?.toDouble() ?? 0, color: AppTheme.primary, width: 14, borderRadius: const BorderRadius.vertical(top: Radius.circular(4))),
                    ])).toList(),
                  ),
                ),
              ),
            ),
          ),
        ..._salesBreakdown.map((d) {
          final rev = (d['totalRevenue'] as num?)?.toDouble() ?? 0;
          final orders = d['totalOrders'] ?? 0;
          return Card(
            margin: const EdgeInsets.only(bottom: 4),
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Row(children: [
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(d['period'] as String? ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                    Text('$orders orders', style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
                  ]),
                ),
                Text('₹${rev.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.primary)),
              ]),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildSalesTab() {
    return _loadingSales ? const LoadingWidget() : _salesTab();
  }

  Widget _inventoryTab() {
    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        if (_invSummary.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              children: [
                _summaryCard('Total', '${_invSummary['totalProducts'] ?? 0}'),
                const SizedBox(width: 8),
                _summaryCard('Low Stock', '${_invSummary['lowStockCount'] ?? 0}', color: AppTheme.accent),
                const SizedBox(width: 8),
                _summaryCard('Out of Stock', '${_invSummary['outOfStockCount'] ?? 0}', color: AppTheme.error),
              ],
            ),
          ),
        if (_invSummary.isNotEmpty)
          Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: AppTheme.success.withOpacity(0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(Icons.account_balance, color: AppTheme.success, size: 20),
                const SizedBox(width: 10),
                Text('Stock Value: ₹${(_invSummary['totalStockValue'] as num?)?.toDouble() ?? 0}',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.success)),
              ],
            ),
          ),
        if (_lowStock.isNotEmpty) ...[
          const Padding(padding: EdgeInsets.only(bottom: 6), child: Text('Low Stock Products', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13))),
          ..._lowStock.map((d) => _invItem(d, isLow: true)),
        ],
        if (_outOfStock.isNotEmpty) ...[
          Padding(padding: EdgeInsets.only(top: 12, bottom: 6), child: Text('Out of Stock', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.error))),
          ..._outOfStock.map((d) => _invItem(d, isLow: false)),
        ],
        if (_lowStock.isEmpty && _outOfStock.isEmpty)
          const Padding(
            padding: EdgeInsets.only(top: 40),
            child: Center(child: Text('All products are well stocked', style: TextStyle(color: AppTheme.textSecondary))),
          ),
      ],
    );
  }

  Widget _invItem(Map<String, dynamic> d, {required bool isLow}) {
    return Card(
      margin: const EdgeInsets.only(bottom: 4),
      child: ListTile(
        dense: true,
        title: Text(d['name'] as String? ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        subtitle: d['pieces'] != null ? Text('Pieces: ${d['pieces']}', style: const TextStyle(fontSize: 11)) : null,
        trailing: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text('Stock: ${d['stockQuantity'] ?? 0}', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: isLow ? AppTheme.accent : AppTheme.error)),
          Text('Threshold: ${d['lowStockThreshold'] ?? 10}', style: const TextStyle(fontSize: 10, color: AppTheme.textTertiary)),
        ]),
      ),
    );
  }

  Widget _buildInventoryTab() {
    return _loadingInventory ? const LoadingWidget() : _inventoryTab();
  }

  Widget _customersTab() {
    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        if (_totalClients > 0)
          Container(
            padding: const EdgeInsets.all(14),
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [AppTheme.primary, AppTheme.primary.withOpacity(0.7)]),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                const Icon(Icons.people, color: Colors.white, size: 28),
                const SizedBox(width: 14),
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('Total Clients', style: TextStyle(color: Colors.white70, fontSize: 11)),
                  Text('$_totalClients', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 22)),
                ]),
              ],
            ),
          ),
        if (_topCustomers.isNotEmpty) ...[
          const Padding(padding: EdgeInsets.only(bottom: 6), child: Text('Top Customers', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13))),
          ..._topCustomers.asMap().entries.map((e) {
            final d = e.value;
            return Card(
              margin: const EdgeInsets.only(bottom: 4),
              child: ListTile(
                dense: true,
                leading: CircleAvatar(
                  radius: 16,
                  backgroundColor: AppTheme.primary.withOpacity(0.1),
                  child: Text('${e.key + 1}', style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold, fontSize: 12)),
                ),
                title: Text(d['storeName'] as String? ?? d['ownerName'] as String? ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                subtitle: Text('${d['totalOrders'] ?? 0} orders', style: const TextStyle(fontSize: 11)),
                trailing: Text('₹${(d['totalSpent'] as num?)?.toDouble() ?? 0}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.primary)),
              ),
            );
          }),
        ],
        if (_topCustomers.isEmpty)
          const Padding(
            padding: EdgeInsets.only(top: 40),
            child: Center(child: Text('No customer data', style: TextStyle(color: AppTheme.textSecondary))),
          ),
      ],
    );
  }

  Widget _buildCustomersTab() {
    return _loadingCustomers ? const LoadingWidget() : _customersTab();
  }
}

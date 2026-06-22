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
  List<Map<String, dynamic>> _salesData = [];
  List<Map<String, dynamic>> _inventoryData = [];
  List<Map<String, dynamic>> _customerData = [];
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
        setState(() {
          _salesData = (body['data'] as List).map((e) => e as Map<String, dynamic>).toList();
          _loadingSales = false;
        });
      }
    } catch (_) {
      setState(() => _loadingSales = false);
    }
  }

  Future<void> _loadInventory() async {
    try {
      final res = await _api.get('/reports/inventory');
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        setState(() {
          _inventoryData = (body['data'] as List).map((e) => e as Map<String, dynamic>).toList();
          _loadingInventory = false;
        });
      }
    } catch (_) {
      setState(() => _loadingInventory = false);
    }
  }

  Future<void> _loadCustomers() async {
    try {
      final res = await _api.get('/reports/customers');
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        setState(() {
          _customerData = (body['data'] as List).map((e) => e as Map<String, dynamic>).toList();
          _loadingCustomers = false;
        });
      }
    } catch (_) {
      setState(() => _loadingCustomers = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reports'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.primary, unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primary,
          tabs: const [Tab(text: 'Sales'), Tab(text: 'Inventory'), Tab(text: 'Customers')],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildSalesTab(),
          _buildInventoryTab(),
          _buildCustomersTab(),
        ],
      ),
    );
  }

  Widget _buildSalesTab() {
    return _loadingSales
        ? const LoadingWidget()
        : Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    DropdownButton<String>(
                      value: _period, underline: const SizedBox(),
                      items: ['daily', 'weekly', 'monthly', 'yearly'].map((p) => DropdownMenuItem(value: p, child: Text(p[0].toUpperCase() + p.substring(1)))).toList(),
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
              if (_salesData.isNotEmpty)
                SizedBox(
                  height: 200,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: BarChart(
                          BarChartData(
                            gridData: FlGridData(show: true, drawVerticalLine: false),
                            titlesData: FlTitlesData(
                              leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 40, getTitlesWidget: (v, _) => Text('${v.toInt()}', style: const TextStyle(fontSize: 9)))),
                              bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, getTitlesWidget: (v, _) {
                                final i = v.toInt();
                                if (i >= 0 && i < _salesData.length) {
                                  return Text(_salesData[i]['period'] as String? ?? '', style: const TextStyle(fontSize: 8));
                                }
                                return const Text('');
                              })),
                              topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                              rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                            ),
                            borderData: FlBorderData(show: false),
                            barGroups: _salesData.asMap().entries.map((e) => BarChartGroupData(x: e.key, barRods: [
                              BarChartRodData(toY: (e.value['totalRevenue'] as num?)?.toDouble() ?? 0, color: AppTheme.primary, width: 16, borderRadius: const BorderRadius.vertical(top: Radius.circular(4))),
                            ])).toList(),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
                  itemCount: _salesData.length,
                  itemBuilder: (_, i) {
                    final d = _salesData[i];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 4),
                      child: Padding(
                        padding: const EdgeInsets.all(10),
                        child: Row(children: [
                          Expanded(child: Text(d['period'] as String? ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
                          Flexible(child: Text('${d['orders'] ?? 0} orders', overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary))),
                          const SizedBox(width: 8),
                          Flexible(child: Text('₹${(d['totalRevenue'] as num?)?.toDouble() ?? 0}', overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppTheme.primary))),
                        ]),
                      ),
                    );
                  },
                ),
              ),
            ],
          );
  }

  Widget _buildInventoryTab() {
    return _loadingInventory
        ? const LoadingWidget()
        : _inventoryData.isEmpty
            ? const Center(child: Text('All products are well stocked'))
            : ListView.builder(
                padding: const EdgeInsets.all(12),
                itemCount: _inventoryData.length,
                itemBuilder: (_, i) {
                  final d = _inventoryData[i];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 4),
                    child: ListTile(
                      title: Text(d['name'] as String? ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                      subtitle: Text('SKU: ${d['sku'] as String? ?? 'N/A'}', style: const TextStyle(fontSize: 11)),
                      trailing: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.end, children: [
                        Text('Stock: ${d['stockQuantity'] ?? 0}', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: (d['stockQuantity'] as num?)?.toInt() == 0 ? AppTheme.error : AppTheme.textPrimary)),
                        Text('Threshold: ${d['lowStockThreshold'] ?? 10}', style: const TextStyle(fontSize: 10, color: AppTheme.textTertiary)),
                      ]),
                    ),
                  );
                },
              );
  }

  Widget _buildCustomersTab() {
    return _loadingCustomers
        ? const LoadingWidget()
        : _customerData.isEmpty
            ? const Center(child: Text('No customer data'))
            : ListView.builder(
                padding: const EdgeInsets.all(12),
                itemCount: _customerData.length,
                itemBuilder: (_, i) {
                  final d = _customerData[i];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 4),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: AppTheme.primary.withOpacity(0.1), radius: 16,
                        child: Text('${i + 1}', style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold, fontSize: 12)),
                      ),
                      title: Text(d['storeName'] as String? ?? d['name'] as String? ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                      subtitle: Text('${d['totalOrders'] ?? 0} orders', style: const TextStyle(fontSize: 11)),
                      trailing: Text('₹${(d['totalSpent'] as num?)?.toDouble() ?? 0}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.primary)),
                    ),
                  );
                },
              );
  }
}

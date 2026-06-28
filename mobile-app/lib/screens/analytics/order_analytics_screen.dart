import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:fl_chart/fl_chart.dart';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/loading_widget.dart';

class OrderAnalyticsScreen extends StatefulWidget {
  const OrderAnalyticsScreen({super.key});

  @override
  State<OrderAnalyticsScreen> createState() => _OrderAnalyticsScreenState();
}

class _OrderAnalyticsScreenState extends State<OrderAnalyticsScreen> {
  final ApiClient _api = ApiClient();
  List<_OrderPoint> _trend = [];
  bool _loading = true;
  int _days = 30;

  double _totalOrders = 0;
  double _averageOrders = 0;
  double _peakOrders = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await _api.get('/dashboard/order-trend', queryParams: {'days': '$_days'});
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        final list = body['data'] as List;
        setState(() {
          _trend = list.map((e) => _OrderPoint(
            date: e['date'] as String? ?? '',
            count: (e['count'] as num?)?.toDouble() ?? 0,
          )).toList();
          _totalOrders = _trend.fold(0, (s, p) => s + p.count);
          _averageOrders = _trend.isEmpty ? 0 : _totalOrders / _trend.length;
          _peakOrders = _trend.isEmpty ? 0 : _trend.map((p) => p.count).reduce((a, b) => a > b ? a : b);
        });
      }
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Order Analytics'),
        actions: [
          PopupMenuButton<int>(
            icon: const Icon(Icons.calendar_month_outlined),
            onSelected: (v) { setState(() => _days = v); _load(); },
            itemBuilder: (_) => [7, 14, 30, 60, 90].map((d) => PopupMenuItem(value: d, child: Text('$d days'))).toList(),
          ),
        ],
      ),
      body: _loading
          ? const LoadingWidget()
          : _trend.isEmpty
              ? const Center(child: Text('No order data available', style: TextStyle(color: AppTheme.textSecondary)))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Row(
                      children: [
                        _statCard('Total Orders', '${_totalOrders.toInt()}', Icons.shopping_cart, AppTheme.primary),
                        const SizedBox(width: 10),
                        _statCard('Avg / Day', _averageOrders.toStringAsFixed(1), Icons.show_chart, AppTheme.success),
                        const SizedBox(width: 10),
                        _statCard('Peak', '${_peakOrders.toInt()}', Icons.trending_up, AppTheme.accent),
                      ],
                    ),
                    const SizedBox(height: 20),
                    const Text('Order Trend', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    const SizedBox(height: 8),
                    SizedBox(
                      height: 260,
                      child: Card(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(8, 16, 16, 8),
                          child: BarChart(
                            BarChartData(
                              gridData: FlGridData(show: true, drawVerticalLine: false),
                              titlesData: FlTitlesData(
                                leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 30, getTitlesWidget: (v, _) => Text('${v.toInt()}', style: const TextStyle(fontSize: 9)))),
                                bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 20, interval: _trend.length > 10 ? (_trend.length / 5).ceilToDouble() : 1, getTitlesWidget: (v, _) {
                                  final i = v.toInt();
                                  if (i >= 0 && i < _trend.length) {
                                    final d = _trend[i].date;
                                    return Text(d.length > 5 ? d.substring(d.length - 5) : d, style: const TextStyle(fontSize: 8));
                                  }
                                  return const Text('');
                                })),
                                topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                              ),
                              borderData: FlBorderData(show: false),
                              barGroups: _trend.asMap().entries.map((e) => BarChartGroupData(x: e.key, barRods: [
                                BarChartRodData(toY: e.value.count, color: AppTheme.primary, width: _trend.length > 20 ? 6 : 14,
                                    borderRadius: const BorderRadius.vertical(top: Radius.circular(4))),
                              ])).toList(),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text('Daily Breakdown', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    const SizedBox(height: 8),
                    ..._trend.reversed.take(30).map((p) => Card(
                      margin: const EdgeInsets.only(bottom: 3),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        child: Row(children: [
                          Text(p.date.length > 5 ? p.date.substring(p.date.length - 5) : p.date, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                          const Spacer(),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppTheme.primary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text('${p.count.toInt()} orders', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppTheme.primary)),
                          ),
                        ]),
                      ),
                    )),
                  ],
                ),
    );
  }

  Widget _statCard(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 6),
            Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: color)),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(fontSize: 9, color: AppTheme.textSecondary)),
          ],
        ),
      ),
    );
  }
}

class _OrderPoint {
  final String date;
  final double count;
  _OrderPoint({required this.date, required this.count});
}

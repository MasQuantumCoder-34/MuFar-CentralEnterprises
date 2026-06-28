import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:fl_chart/fl_chart.dart';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/loading_widget.dart';

class RevenueAnalyticsScreen extends StatefulWidget {
  const RevenueAnalyticsScreen({super.key});

  @override
  State<RevenueAnalyticsScreen> createState() => _RevenueAnalyticsScreenState();
}

class _RevenueAnalyticsScreenState extends State<RevenueAnalyticsScreen> {
  final ApiClient _api = ApiClient();
  List<_RevenuePoint> _trend = [];
  bool _loading = true;
  int _days = 30;

  double _totalRevenue = 0;
  double _averageRevenue = 0;
  int _totalOrders = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await _api.get('/dashboard/revenue-trend', queryParams: {'days': '$_days'});
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        final list = body['data'] as List;
        setState(() {
          _trend = list.map((e) => _RevenuePoint(
            date: e['date'] as String? ?? '',
            amount: (e['amount'] as num?)?.toDouble() ?? 0,
          )).toList();
          _totalRevenue = _trend.fold(0, (s, p) => s + p.amount);
          _averageRevenue = _trend.isEmpty ? 0 : _totalRevenue / _trend.length;
          _totalOrders = 0;
        });
      }
    } catch (_) {
      try {
        final res = await _api.get('/reports/sales', queryParams: {'type': _days <= 7 ? 'daily' : _days <= 60 ? 'weekly' : 'monthly'});
        final body = jsonDecode(res.body) as Map<String, dynamic>;
        if (body['success'] == true && body['data'] != null) {
          final data = body['data'] as Map<String, dynamic>;
          final breakdown = (data['breakdown'] as List?)?.map((e) => e as Map<String, dynamic>).toList() ?? [];
          final summary = data['summary'] as Map<String, dynamic>? ?? {};
          setState(() {
            _trend = breakdown.map((e) => _RevenuePoint(
              date: e['period'] as String? ?? '',
              amount: (e['totalRevenue'] as num?)?.toDouble() ?? 0,
            )).toList();
            _totalRevenue = (summary['totalRevenue'] as num?)?.toDouble() ?? 0;
            _totalOrders = (summary['totalOrders'] as num?)?.toInt() ?? 0;
            _averageRevenue = _trend.isEmpty ? 0 : _totalRevenue / _trend.length;
          });
        }
      } catch (_) {}
    }
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Revenue Analytics'),
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
              ? const Center(child: Text('No revenue data available', style: TextStyle(color: AppTheme.textSecondary)))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Row(
                      children: [
                        _statCard('Total Revenue', '₹${_totalRevenue.toStringAsFixed(0)}', Icons.trending_up, AppTheme.primary),
                        const SizedBox(width: 10),
                        _statCard('Avg / Day', '₹${_averageRevenue.toStringAsFixed(0)}', Icons.show_chart, AppTheme.success),
                        const SizedBox(width: 10),
                        _statCard('Period', '$_days days', Icons.date_range, AppTheme.accent),
                      ],
                    ),
                    const SizedBox(height: 20),
                    const Text('Revenue Trend', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    const SizedBox(height: 8),
                    SizedBox(
                      height: 260,
                      child: Card(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(8, 16, 16, 8),
                          child: LineChart(
                            LineChartData(
                              gridData: FlGridData(show: true, drawVerticalLine: false, horizontalInterval: _maxRevenue > 0 ? _maxRevenue / 4 : 1),
                              titlesData: FlTitlesData(
                                leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 46, getTitlesWidget: (v, _) => Text('₹${v.toInt()}', style: const TextStyle(fontSize: 9)))),
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
                              lineBarsData: [
                                LineChartBarData(
                                  spots: _trend.asMap().entries.map((e) => FlSpot(e.key.toDouble(), e.value.amount)).toList(),
                                  color: AppTheme.primary,
                                  barWidth: 2.5,
                                  dotData: FlDotData(show: true, getDotPainter: (spot, _, __, ___) => FlDotCirclePainter(
                                    radius: 3, color: Colors.white, strokeWidth: 2, strokeColor: AppTheme.primary,
                                  )),
                                  belowBarData: BarAreaData(show: true, color: AppTheme.primary.withOpacity(0.08)),
                                  isCurved: true,
                                  preventCurveOverShooting: true,
                                ),
                              ],
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
                          Text('₹${p.amount.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.primary)),
                        ]),
                      ),
                    )),
                  ],
                ),
    );
  }

  double get _maxRevenue {
    if (_trend.isEmpty) return 1;
    return _trend.map((p) => p.amount).reduce((a, b) => a > b ? a : b) * 1.2;
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

class _RevenuePoint {
  final String date;
  final double amount;
  _RevenuePoint({required this.date, required this.amount});
}

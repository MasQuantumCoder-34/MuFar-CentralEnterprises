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
  bool _hasError = false;
  int _days = 30;

  double _totalOrders = 0;
  double _averageOrders = 0;
  double _peakOrders = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  List<_OrderPoint> _fillDateGaps(List<_OrderPoint> raw, int days) {
    if (raw.isEmpty) return raw;
    final now = DateTime.now();
    final dataMap = <String, double>{};
    for (final p in raw) {
      dataMap[p.date] = p.count;
    }
    final result = <_OrderPoint>[];
    for (int i = days - 1; i >= 0; i--) {
      final d = now.subtract(Duration(days: i));
      final key = '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
      result.add(_OrderPoint(date: key, count: dataMap[key] ?? 0));
    }
    return result;
  }

  Future<void> _load() async {
    setState(() { _loading = true; _hasError = false; });
    try {
      final res = await _api.get('/dashboard/order-trend', queryParams: {'days': '$_days'});
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        final list = body['data'] as List;
        final raw = list.map((e) => _OrderPoint(
          date: e['date'] as String? ?? '',
          count: (e['count'] as num?)?.toDouble() ?? 0,
        )).toList();
        setState(() {
          _trend = _fillDateGaps(raw, _days);
          _totalOrders = _trend.fold(0, (s, p) => s + p.count);
          _averageOrders = _trend.isEmpty ? 0 : _totalOrders / _days;
          _peakOrders = _trend.isEmpty ? 0 : _trend.map((p) => p.count).reduce((a, b) => a > b ? a : b);
          _loading = false;
        });
        return;
      }
    } catch (_) {}
    setState(() { _hasError = true; _loading = false; });
  }

  String _shortDate(String dateStr) {
    if (dateStr.length >= 10) {
      final parts = dateStr.split('-');
      if (parts.length >= 3) return '${parts[2]}/${parts[1]}';
    }
    return dateStr.length > 5 ? dateStr.substring(dateStr.length - 5) : dateStr;
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
          : _hasError
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.bar_chart_outlined, size: 48, color: AppTheme.textTertiary),
                      const SizedBox(height: 12),
                      const Text('Could not load order data', style: TextStyle(color: AppTheme.textSecondary)),
                      const SizedBox(height: 16),
                      FilledButton.tonal(onPressed: _load, child: const Text('Retry')),
                    ],
                  ),
                )
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
                                    bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 20, interval: (_trend.length / 5).ceilToDouble(), getTitlesWidget: (v, _) {
                                      final i = v.toInt();
                                      if (i >= 0 && i < _trend.length) {
                                        return Padding(
                                          padding: const EdgeInsets.only(top: 4),
                                          child: Text(_shortDate(_trend[i].date), style: const TextStyle(fontSize: 8)),
                                        );
                                      }
                                      return const Text('');
                                    })),
                                    topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                    rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                  ),
                                  borderData: FlBorderData(show: false),
                                  barGroups: _trend.asMap().entries.map((e) => BarChartGroupData(x: e.key, barRods: [
                                    BarChartRodData(toY: e.value.count, color: e.value.count > 0 ? AppTheme.primary : AppTheme.surfaceVariant, width: _trend.length > 20 ? 6 : 14,
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
                              Text(_shortDate(p.date), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                              const Spacer(),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: p.count > 0 ? AppTheme.primary.withOpacity(0.1) : AppTheme.surfaceVariant,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(p.count == 0 ? '—' : '${p.count.toInt()} orders',
                                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12,
                                        color: p.count > 0 ? AppTheme.primary : AppTheme.textTertiary)),
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

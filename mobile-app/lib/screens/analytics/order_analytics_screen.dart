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
  List<_OrderPoint> _data = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await _api.get('/dashboard/order-trend');
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        final list = body['data'] as List;
        setState(() {
          _data = list.map((e) => _OrderPoint(
            date: e['date'] as String? ?? '',
            count: (e['count'] as num?)?.toDouble() ?? 0,
          )).toList();
          _loading = false;
        });
      } else {
        setState(() => _loading = false);
      }
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Order Trend')),
      body: _loading
          ? const LoadingWidget()
          : _data.isEmpty
              ? const Center(child: Text('No order data available'))
              : Padding(
                  padding: const EdgeInsets.all(16),
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: SizedBox(
                        height: 400,
                        child: BarChart(
                          BarChartData(
                            gridData: FlGridData(show: true, drawVerticalLine: false),
                            titlesData: FlTitlesData(
                              leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, getTitlesWidget: (v, _) => Text('${v.toInt()}', style: const TextStyle(fontSize: 10)))),
                              bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, getTitlesWidget: (v, _) {
                                final i = v.toInt();
                                if (i >= 0 && i < _data.length) {
                                  return Text(_data[i].date.length > 5 ? _data[i].date.substring(5) : _data[i].date, style: const TextStyle(fontSize: 9));
                                }
                                return const Text('');
                              })),
                              topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                              rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                            ),
                            borderData: FlBorderData(show: false),
                            barGroups: _data.asMap().entries.map((e) => BarChartGroupData(x: e.key, barRods: [
                              BarChartRodData(toY: e.value.count, color: AppTheme.primary, width: 20, borderRadius: const BorderRadius.vertical(top: Radius.circular(4))),
                            ])).toList(),
                          ),
                        ),
                      ),
                    ),
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

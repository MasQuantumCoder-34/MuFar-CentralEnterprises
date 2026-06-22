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
  List<_RevenuePoint> _data = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await _api.get('/dashboard/revenue-trend');
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        final list = body['data'] as List;
        setState(() {
          _data = list.map((e) => _RevenuePoint(
            date: e['date'] as String? ?? '',
            amount: (e['amount'] as num?)?.toDouble() ?? 0,
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
      appBar: AppBar(title: const Text('Revenue Trend')),
      body: _loading
          ? const LoadingWidget()
          : _data.isEmpty
              ? const Center(child: Text('No revenue data available'))
              : Padding(
                  padding: const EdgeInsets.all(16),
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: SizedBox(
                        height: 400,
                        child: LineChart(
                          LineChartData(
                            gridData: FlGridData(show: true, drawVerticalLine: false),
                            titlesData: FlTitlesData(
                              leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 50, getTitlesWidget: (v, _) => Text('₹${v.toInt()}', style: const TextStyle(fontSize: 10)))),
                              bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, getTitlesWidget: (v, _) {
                                final i = v.toInt();
                                if (i >= 0 && i < _data.length) {
                                  final d = _data[i].date;
                                  return Text(d.length > 5 ? d.substring(5) : d, style: const TextStyle(fontSize: 9));
                                }
                                return const Text('');
                              })),
                              topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                              rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                            ),
                            borderData: FlBorderData(show: false),
                            lineBarsData: [
                              LineChartBarData(
                                spots: _data.asMap().entries.map((e) => FlSpot(e.key.toDouble(), e.value.amount)).toList(),
                                color: AppTheme.primary,
                                barWidth: 2,
                                dotData: FlDotData(show: true),
                                belowBarData: BarAreaData(show: true, color: AppTheme.primary.withOpacity(0.1)),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
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

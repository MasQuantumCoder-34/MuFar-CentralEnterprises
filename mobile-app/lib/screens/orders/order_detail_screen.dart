import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:intl/intl.dart';
import '../../models/order.dart';
import '../../services/api_client.dart';
import '../../services/api_endpoints.dart';
import '../../theme/app_theme.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/status_badge.dart';

const _statusFlow = {
  'pending': ['delivered', 'cancelled'],
  'processing': ['delivered', 'cancelled'],
  'out_for_delivery': ['delivered'],
  'delivered': <String>[],
  'cancelled': <String>[],
};

class OrderDetailScreen extends StatefulWidget {
  final String orderId;
  const OrderDetailScreen({super.key, required this.orderId});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  final ApiClient _api = ApiClient();
  Order? _order;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadOrder();
  }

  Future<void> _loadOrder() async {
    setState(() => _loading = true);
    try {
      final res = await _api.get(ApiEndpoints.order(widget.orderId));
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        setState(() {
          _order = Order.fromJson(body['data'] as Map<String, dynamic>);
          _loading = false;
        });
      } else {
        setState(() {
          _error = body['message'] as String? ?? 'Failed to load order';
          _loading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Network error';
        _loading = false;
      });
    }
  }

  String _formatDate(String dt) {
    if (dt.isEmpty) return '';
    try {
      return DateFormat('dd MMM yyyy').format(DateTime.parse(dt));
    } catch (_) {
      return dt;
    }
  }

  String _formatDateTime(String dt) {
    if (dt.isEmpty) return '';
    try {
      return DateFormat('dd MMM yyyy HH:mm').format(DateTime.parse(dt));
    } catch (_) {
      return dt;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_order?.orderNumber ?? 'Order Details')),
      body: _loading
          ? const LoadingWidget()
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline, size: 48, color: AppTheme.error),
                      const SizedBox(height: 12),
                      Text(_error!,
                          style: const TextStyle(color: AppTheme.textSecondary)),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: _loadOrder,
                        icon: const Icon(Icons.refresh, size: 18),
                        label: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _order == null
                  ? const Center(child: Text('Order not found'))
                  : RefreshIndicator(
                      onRefresh: _loadOrder,
                      child: ListView(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 48),
                        children: [
                          _buildHeader(),
                          const SizedBox(height: 20),
                          if (_order!.clientName != null && _order!.clientName!.isNotEmpty)
                            _buildClientInfo(),
                          if (_order!.clientName != null && _order!.clientName!.isNotEmpty)
                            const SizedBox(height: 16),
                          _buildSectionTitle('Items'),
                          const SizedBox(height: 8),
                          ..._order!.items.map((item) => _buildItemCard(item)),
                          const SizedBox(height: 16),
                          _buildSummary(),
                          const SizedBox(height: 20),
                          _buildStatusActions(),
                          const SizedBox(height: 20),
                          _buildSectionTitle('Timeline'),
                          const SizedBox(height: 8),
                          if (_order!.timeline.isEmpty)
                            Card(
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Row(
                                  children: [
                                    Icon(Icons.info_outline,
                                        size: 18, color: AppTheme.textTertiary),
                                    const SizedBox(width: 8),
                                    const Text('No timeline entries',
                                        style: TextStyle(color: AppTheme.textSecondary)),
                                  ],
                                ),
                              ),
                            )
                          else
                            ..._order!.timeline.asMap().entries.map((entry) {
                              final i = entry.key;
                              final e = entry.value;
                              return _buildTimelineEntry(e, isLast: i == _order!.timeline.length - 1);
                            }),
                        ],
                      ),
                    ),
    );
  }

  Widget _buildHeader() {
    final date = _formatDate(_order!.createdAt);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.primary,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  _order!.clientName ?? _order!.orderNumber,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 20,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              StatusBadge(status: _order!.status),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            _order!.orderNumber,
            style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 13),
          ),
          if (_order!.invoiceNumber.isNotEmpty)
            Text(
              'Invoice: ${_order!.invoiceNumber}',
              style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12),
            ),
          if (date.isNotEmpty)
            Text(
              date,
              style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12),
            ),
        ],
      ),
    );
  }

  Widget _buildClientInfo() {
    return Card(
      child: ListTile(
        leading: Container(
          width: 40, height: 40,
          decoration: BoxDecoration(
            color: AppTheme.primary.withOpacity(0.08),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(Icons.person, color: AppTheme.primary, size: 20),
        ),
        title: const Text('Client', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
        subtitle: Text(_order!.clientName ?? '',
            style: const TextStyle(fontWeight: FontWeight.w600)),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(title, style: Theme.of(context).textTheme.titleMedium);
  }

  Widget _buildItemCard(OrderItem item) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.inventory_2_outlined,
                  color: AppTheme.primary, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item.productName,
                      style: const TextStyle(
                          fontWeight: FontWeight.w600, fontSize: 14,
                          color: AppTheme.textPrimary)),
                  Row(
                    children: [
                      if (item.size != null) ...[
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(item.size!,
                              style: const TextStyle(
                                  color: AppTheme.primary, fontSize: 10,
                                  fontWeight: FontWeight.w600)),
                        ),
                        const SizedBox(width: 6),
                      ],
                      if (item.sku.isNotEmpty)
                        Flexible(
                          child: Text('SKU: ${item.sku}',
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  color: AppTheme.textTertiary, fontSize: 11)),
                        ),
                    ],
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text('₹${item.price.toStringAsFixed(0)}',
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 13,
                        color: AppTheme.textPrimary)),
                Text('× ${item.quantity}',
                    style: const TextStyle(
                        color: AppTheme.textSecondary, fontSize: 12)),
                Text('₹${item.total.toStringAsFixed(0)}',
                    style: const TextStyle(
                        color: AppTheme.primary,
                        fontWeight: FontWeight.bold,
                        fontSize: 14)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummary() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          children: [
            _summaryRow('Subtotal', _order!.subtotal),
            if (_order!.discount > 0)
              _summaryRow('Discount', -_order!.discount, color: AppTheme.success),
            _summaryRow('Total', _order!.total, bold: true, color: AppTheme.primary),
          ],
        ),
      ),
    );
  }

  Widget _summaryRow(String label, double amount,
      {bool bold = false, Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Flexible(
            child: Text(label,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: bold ? AppTheme.textPrimary : AppTheme.textSecondary,
                  fontWeight: bold ? FontWeight.w600 : null,
                  fontSize: bold ? 15 : 13,
                )),
          ),
          const SizedBox(width: 12),
          Text(
            '₹${amount.toStringAsFixed(0)}',
            style: TextStyle(
              fontWeight: bold ? FontWeight.bold : FontWeight.w600,
              color: color ?? (bold ? AppTheme.textPrimary : null),
              fontSize: bold ? 16 : 13,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusActions() {
    final nextStatuses = _statusFlow[_order!.status] ?? [];
    if (nextStatuses.isEmpty) return const SizedBox();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.loop, size: 18, color: AppTheme.primary),
                const SizedBox(width: 6),
                const Text('Update Status',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: AppTheme.textPrimary)),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8, runSpacing: 8,
              children: nextStatuses.map((s) {
                final labels = {
                  'delivered': 'Delivered',
                  'cancelled': 'Cancel',
                };
                return ElevatedButton.icon(
                  onPressed: () => _showStatusDialog(s, labels[s] ?? s),
                  icon: Icon(
                    s == 'cancelled' ? Icons.cancel_outlined : Icons.arrow_forward,
                    size: 16,
                  ),
                  label: Text(labels[s] ?? s, style: const TextStyle(fontSize: 12)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: s == 'cancelled' ? AppTheme.error : AppTheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    elevation: 0,
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showStatusDialog(String newStatus, String label) async {
    final notesCtrl = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(label),
        content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Update ${_order!.orderNumber} to $label?',
              style: const TextStyle(fontSize: 13)),
          const SizedBox(height: 4),
          Text('Current: ${_order!.status.replaceAll('_', ' ')}',
              style: TextStyle(fontSize: 11, color: AppTheme.textTertiary)),
          if (newStatus == 'cancelled') ...[
            const SizedBox(height: 12),
            TextField(
              controller: notesCtrl, maxLines: 2,
              decoration: InputDecoration(
                labelText: 'Cancellation reason (required)',
                filled: true, fillColor: AppTheme.surfaceVariant,
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
              ),
            ),
          ],
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.error,
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 44),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('No', style: TextStyle(color: Colors.white)),
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: newStatus == 'cancelled' ? AppTheme.error : AppTheme.primaryDark,
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 44),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: () {
                if (newStatus == 'cancelled' && notesCtrl.text.trim().isEmpty) return;
                Navigator.pop(ctx, true);
              },
              child: Text(label),
            ),
          ),
        ]),
      ),
    );

    notesCtrl.dispose();
    if (confirmed != true) return;
    await _updateStatus(newStatus, notesCtrl.text.trim());
  }

  Future<void> _updateStatus(String status, String notes) async {
    try {
      final body = <String, dynamic>{'status': status};
      if (notes.isNotEmpty) body['notes'] = notes;
      final res = await _api.put(ApiEndpoints.orderStatus(widget.orderId), body: body);
      final resp = jsonDecode(res.body) as Map<String, dynamic>;
      if (resp['success'] == true) {
        _loadOrder();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text('Order updated to ${status.replaceAll('_', ' ')}'),
            backgroundColor: AppTheme.success, behavior: SnackBarBehavior.floating,
          ));
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text(resp['message'] as String? ?? 'Failed to update status'),
            backgroundColor: AppTheme.error, behavior: SnackBarBehavior.floating,
          ));
        }
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Network error'),
          backgroundColor: AppTheme.error, behavior: SnackBarBehavior.floating,
        ));
      }
    }
  }

  Widget _buildTimelineEntry(TimelineEntry entry, {bool isLast = false}) {
    final date = _formatDateTime(entry.timestamp);
    if (entry.status.isEmpty) return const SizedBox();
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                width: 10, height: 10,
                decoration: BoxDecoration(
                  color: _statusColor(entry.status),
                  shape: BoxShape.circle,
                ),
              ),
              if (!isLast)
                Container(
                  width: 1,
                  height: 30,
                  color: AppTheme.border,
                ),
            ],
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Card(
              margin: EdgeInsets.zero,
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        StatusBadge(status: entry.status, fontSize: 10),
                        const SizedBox(width: 8),
                        if (date.isNotEmpty)
                          Flexible(
                            child: Text(date,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                    color: AppTheme.textTertiary, fontSize: 10)),
                          ),
                      ],
                    ),
                    if (entry.note != null && entry.note!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(entry.note!,
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              color: AppTheme.textSecondary, fontSize: 12)),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'delivered': return AppTheme.success;
      case 'cancelled': return AppTheme.error;
      case 'processing': return AppTheme.primaryLight;
      case 'out_for_delivery': return AppTheme.primary;
      default: return AppTheme.warning;
    }
  }
}

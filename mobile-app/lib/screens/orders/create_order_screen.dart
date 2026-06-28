import 'package:flutter/material.dart';
import 'dart:convert';

import '../../models/product.dart';
import '../../models/category.dart';
import '../../models/user.dart';
import '../../services/api_client.dart';
import '../../services/api_endpoints.dart';
import '../../theme/app_theme.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/product_card.dart';

class CreateOrderScreen extends StatefulWidget {
  const CreateOrderScreen({super.key});

  @override
  State<CreateOrderScreen> createState() => _CreateOrderScreenState();
}

class _CreateOrderScreenState extends State<CreateOrderScreen> {
  final ApiClient _api = ApiClient();
  final List<_CartItem> _cart = [];
  int _step = 1;

  List<User> _clients = [];
  List<Category> _categories = [];
  List<Product> _products = [];
  User? _selectedClient;
  Category? _selectedCategory;
  bool _loadingClients = true;
  bool _loadingCategories = false;
  bool _loadingProducts = false;
  bool _placingOrder = false;
  String _clientSearch = '';
  bool _productsError = false;

  @override
  void initState() {
    super.initState();
    _loadClients();
    _loadCategories();
  }

  Future<void> _loadClients() async {
    setState(() => _loadingClients = true);
    try {
      final params = <String, String>{'role': 'client', 'limit': '100'};
      if (_clientSearch.isNotEmpty) params['search'] = _clientSearch;
      final res = await _api.get(ApiEndpoints.users, queryParams: params);
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        setState(() {
          _clients = (body['data'] as List)
              .map((e) => User.fromJson(e as Map<String, dynamic>))
              .toList();
        });
      }
    } catch (_) {}
    if (mounted) setState(() => _loadingClients = false);
  }

  Future<void> _loadCategories() async {
    setState(() => _loadingCategories = true);
    try {
      final res = await _api.get(ApiEndpoints.categories);
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        setState(() {
          _categories = (body['data'] as List)
              .map((e) => Category.fromJson(e as Map<String, dynamic>))
              .toList();
        });
      }
    } catch (_) {}
    if (mounted) setState(() => _loadingCategories = false);
  }

  Future<void> _loadProducts(String categoryId) async {
    setState(() => _loadingProducts = true);
    _productsError = false;
    try {
      final res = await _api.get(
        ApiEndpoints.products,
        queryParams: {'category': categoryId, 'limit': '100'},
      );
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        final list = body['data'] as List;
        setState(() {
          _products = list
              .map((e) => Product.fromJson(e as Map<String, dynamic>))
              .toList();
        });
      } else {
        _productsError = true;
      }
    } catch (_) {
      _productsError = true;
    }
    if (mounted) setState(() => _loadingProducts = false);
  }

  void _addToCart(Product product, String? size) {
    final key = '${product.id}::${size ?? ''}';
    setState(() {
      final idx = _cart.indexWhere((c) => c.key == key);
      if (idx >= 0) {
        _cart[idx].quantity++;
      } else {
        _cart.add(_CartItem(key: key, product: product, quantity: 1, size: size));
      }
    });
  }

  void _updateQty(String key, int delta) {
    setState(() {
      final idx = _cart.indexWhere((c) => c.key == key);
      if (idx >= 0) {
        _cart[idx].quantity = (_cart[idx].quantity + delta).clamp(1, 999);
      }
    });
  }

  void _removeFromCart(String key) {
    setState(() => _cart.removeWhere((c) => c.key == key));
  }

  double get _cartTotal =>
      _cart.fold(0, (s, i) => s + i.product.getPriceForSize(i.size) * i.quantity);

  Future<void> _placeOrder() async {
    if (_cart.isEmpty) return;
    setState(() => _placingOrder = true);
    try {
      final body = <String, dynamic>{
        'items': _cart.map((c) => {
          'product': c.product.id,
          'quantity': c.quantity,
          if (c.size != null) 'size': c.size,
        }).toList(),
      };
      if (_selectedClient != null) body['clientId'] = _selectedClient!.id;

      final res = await _api.post(ApiEndpoints.orders, body: body);
      final resp = jsonDecode(res.body) as Map<String, dynamic>;
      if (resp['success'] == true) {
        final orderData = resp['data'] as Map<String, dynamic>?;
        setState(() => _placingOrder = false);
        if (!mounted) return;
        final orderNumber = orderData?['orderNumber']?.toString() ?? '';
        final clientName = _selectedClient?.displayName ?? '';
        final total = _cartTotal;
        final itemCount = _cart.length;
        _resetForm();
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (!mounted) return;
          showDialog(
            context: context,
            barrierDismissible: false,
            builder: (ctx) => AlertDialog(
              title: Row(
                children: [
                  Icon(Icons.check_circle, color: AppTheme.success, size: 24),
                  const SizedBox(width: 8),
                  const Text('Order Created'),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _detailRow('Order No', orderNumber),
                  if (clientName.isNotEmpty) _detailRow('Client', clientName),
                  _detailRow('Total', '₹${total.toStringAsFixed(0)}'),
                  _detailRow('Items', '$itemCount'),
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
                      onPressed: () {
                        Navigator.pop(ctx);
                        _resetForm();
                      },
                      child: const Text('Create Another', style: TextStyle(color: Colors.white)),
                    ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryDark,
                        foregroundColor: Colors.white,
                        minimumSize: const Size(double.infinity, 44),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: () {
                        Navigator.pop(ctx);
                        Navigator.pop(context);
                      },
                      child: const Text('Done'),
                    ),
                  ),
                ],
              ),
            ),
          );
        });
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(resp['message'] as String? ?? 'Failed to create order'),
            backgroundColor: AppTheme.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
        setState(() => _placingOrder = false);
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Network error'),
          backgroundColor: AppTheme.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
      setState(() => _placingOrder = false);
    }
  }

  void _resetForm() {
    setState(() {
      _cart.clear();
      _selectedClient = null;
      _selectedCategory = null;
      _products = [];
      _step = 1;
      _productsError = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: _step == 1,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop && _step > 1) setState(() => _step--);
      },
      child: Scaffold(
      appBar: AppBar(
        title: const Text('Create Order'),
        leading: _step > 1
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => setState(() => _step--),
              )
            : null,
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            color: AppTheme.surface,
            child: Row(
              children: [
                _stepDot(1),
                _stepConnector(),
                _stepDot(2),
                _stepConnector(),
                _stepDot(3),
              ],
            ),
          ),
          Expanded(child: _buildStepContent()),
        ],
      ),
      bottomSheet: _cart.isNotEmpty && _step == 3
          ? Container(
              padding: EdgeInsets.only(
                left: 16, right: 16, top: 12,
                bottom: MediaQuery.of(context).padding.bottom + 12,
              ),
              decoration: BoxDecoration(
                color: AppTheme.surface,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.06),
                    blurRadius: 16,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    height: 72,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _cart.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemBuilder: (_, i) {
                        final c = _cart[i];
                        return Container(
                          width: 160,
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppTheme.surfaceVariant,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(c.product.name,
                                        style: const TextStyle(
                                            fontSize: 11, fontWeight: FontWeight.w600,
                                            color: AppTheme.textPrimary),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis),
                                    if (c.size != null)
                                      Text('Size: ${c.size}',
                                          style: const TextStyle(
                                              fontSize: 10, color: AppTheme.textSecondary)),
                                    const SizedBox(height: 2),
                                    Row(
                                      children: [
                                        GestureDetector(
                                          onTap: () => _updateQty(c.key, -1),
                                          child: Container(
                                            padding: const EdgeInsets.all(2),
                                            decoration: BoxDecoration(
                                              color: AppTheme.primary.withOpacity(0.1),
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                            child: const Icon(Icons.remove,
                                                size: 14, color: AppTheme.primary),
                                          ),
                                        ),
                                        Padding(
                                          padding: const EdgeInsets.symmetric(horizontal: 8),
                                          child: Text('${c.quantity}',
                                              style: const TextStyle(
                                                  fontWeight: FontWeight.bold, fontSize: 12,
                                                  color: AppTheme.textPrimary)),
                                        ),
                                        GestureDetector(
                                          onTap: () => _updateQty(c.key, 1),
                                          child: Container(
                                            padding: const EdgeInsets.all(2),
                                            decoration: BoxDecoration(
                                              color: AppTheme.primary.withOpacity(0.1),
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                            child: const Icon(Icons.add,
                                                size: 14, color: AppTheme.primary),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              GestureDetector(
                                onTap: () => _removeFromCart(c.key),
                                child: Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: BoxDecoration(
                                    color: AppTheme.error.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Icon(Icons.close,
                                      size: 14, color: AppTheme.error),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Total: ₹${_cartTotal.toStringAsFixed(0)}',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 18,
                            color: AppTheme.primary,
                          ),
                        ),
                      ),
                      ElevatedButton(
                        onPressed: _placingOrder ? null : _placeOrder,
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size(140, 46),
                        ),
                        child: _placingOrder
                            ? const SizedBox(
                                height: 20, width: 20,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Text('Create Order'),
                      ),
                    ],
                  ),
                ],
              ),
            )
          : null,
      ),
    );
  }

  Widget _stepDot(int step) {
    final isActive = _step >= step;
    final isCurrent = _step == step;
    return Expanded(
      child: Row(
        children: [
          Container(
            width: isCurrent ? 32 : 24,
            height: isCurrent ? 32 : 24,
            decoration: BoxDecoration(
              color: isActive ? AppTheme.primary : AppTheme.surfaceVariant,
              shape: BoxShape.circle,
              border: isCurrent ? Border.all(color: AppTheme.primary, width: 2) : null,
            ),
            child: Center(
              child: Text(
                '$step',
                style: TextStyle(
                  color: isActive ? Colors.white : AppTheme.textTertiary,
                  fontWeight: FontWeight.bold,
                  fontSize: isCurrent ? 14 : 12,
                ),
              ),
            ),
          ),
          if (step < 3) ...[
            const SizedBox(width: 4),
            Flexible(
              child: Text(_stepLabel(step),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                      fontSize: isCurrent ? 12 : 11,
                      fontWeight: isCurrent ? FontWeight.w600 : null,
                      color: isCurrent ? AppTheme.textPrimary : AppTheme.textTertiary)),
            ),
          ],
        ],
      ),
    );
  }

  Widget _stepConnector() {
    return Container(
      width: 24, height: 1,
      color: AppTheme.border,
      margin: const EdgeInsets.only(bottom: 16),
    );
  }

  String _stepLabel(int s) {
    switch (s) {
      case 1: return 'Select Client';
      case 2: return 'Select Category';
      case 3: return 'Select Products';
      default: return '';
    }
  }

  Widget _buildStepContent() {
    switch (_step) {
      case 1:
        return _buildClientStep();
      case 2:
        return _buildCategoryStep();
      case 3:
        return _buildProductsStep();
      default:
        return const SizedBox();
    }
  }

  Widget _buildClientStep() {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
          child: TextField(
            decoration: InputDecoration(
              hintText: 'Search clients...',
              prefixIcon: const Icon(Icons.search, size: 20),
              filled: true,
              fillColor: AppTheme.surfaceVariant,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.symmetric(vertical: 12),
            ),
            onChanged: (v) {
              _clientSearch = v;
              _loadClients();
            },
          ),
        ),
        Expanded(
          child: _loadingClients
              ? const LoadingWidget()
              : _clients.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.people_outline,
                              size: 48, color: AppTheme.textTertiary),
                          const SizedBox(height: 12),
                          const Text('No clients found',
                              style: TextStyle(color: AppTheme.textSecondary)),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadClients,
                      child: ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: _clients.length,
                        itemBuilder: (_, i) {
                          final client = _clients[i];
                          final isSelected = _selectedClient?.id == client.id;
                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              selected: isSelected,
                              selectedTileColor: AppTheme.primary.withOpacity(0.06),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                                side: BorderSide(
                                  color: isSelected ? AppTheme.primary : Colors.transparent,
                                ),
                              ),
                              leading: CircleAvatar(
                                backgroundColor: AppTheme.primary.withOpacity(0.1),
                                child: Text(
                                  (client.displayName).substring(0, 1).toUpperCase(),
                                  style: const TextStyle(
                                      color: AppTheme.primary, fontWeight: FontWeight.bold),
                                ),
                              ),
                              title: Text(client.storeName ?? client.name ?? client.email ?? '',
                                  style: const TextStyle(fontWeight: FontWeight.w600)),
                              subtitle: Text(
                                client.ownerName ?? client.mobile ?? '',
                                style: const TextStyle(fontSize: 12),
                              ),
                              trailing: isSelected
                                  ? const Icon(Icons.check_circle,
                                      color: AppTheme.primary)
                                  : null,
                              onTap: () {
                                setState(() {
                                  _selectedClient = client;
                                  _step = 2;
                                });
                              },
                            ),
                          );
                        },
                      ),
                    ),
        ),
      ],
    );
  }

  Widget _buildCategoryStep() {
    return _loadingCategories
        ? const LoadingWidget()
        : _categories.isEmpty
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.folder_outlined, size: 48, color: AppTheme.textTertiary),
                    const SizedBox(height: 12),
                    const Text('No categories available',
                        style: TextStyle(color: AppTheme.textSecondary)),
                  ],
                ),
              )
            : Column(
                children: [
                  if (_selectedClient != null)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                      child: Row(
                        children: [
                          const Icon(Icons.person, size: 16, color: AppTheme.textTertiary),
                          const SizedBox(width: 6),
                          Flexible(
                            child: Text('Client: ${_selectedClient!.displayName}',
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                    fontSize: 12, color: AppTheme.textSecondary)),
                          ),
                        ],
                      ),
                    ),
                  Expanded(
                    child: GridView.builder(
                      padding: const EdgeInsets.all(16),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        childAspectRatio: 1.0,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                      ),
                      itemCount: _categories.length,
                      itemBuilder: (_, i) {
                        final cat = _categories[i];
                        final isSelected = _selectedCategory?.id == cat.id;
                        return Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(16),
                            onTap: () {
                              setState(() {
                                _selectedCategory = cat;
                                _step = 3;
                              });
                              _loadProducts(cat.id);
                            },
                            child: Container(
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? AppTheme.primary.withOpacity(0.08)
                                    : AppTheme.surfaceVariant,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: isSelected ? AppTheme.primary : AppTheme.border,
                                  width: isSelected ? 2 : 1,
                                ),
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(12),
                                    child: SizedBox(
                                      width: 64, height: 64,
                                      child: cat.image != null && cat.image!.isNotEmpty
                                          ? Image.network(cat.image!, fit: BoxFit.cover, width: 64, height: 64, errorBuilder: (_, __, ___) => const Icon(Icons.image_outlined, size: 28, color: AppTheme.textTertiary))
                                          : const Icon(Icons.image_outlined, size: 28, color: AppTheme.textTertiary),
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(cat.name,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        fontWeight: FontWeight.w600,
                                        color: isSelected ? AppTheme.primary : AppTheme.textPrimary,
                                        fontSize: 13,
                                      ),
                                      textAlign: TextAlign.center),
                                  if (cat.productCount != null)
                                    Text('${cat.productCount} products',
                                        style: const TextStyle(
                                            fontSize: 10, color: AppTheme.textSecondary)),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              );
  }

  Widget _buildProductsStep() {
    return Column(
      children: [
        if (_selectedCategory != null)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
            child: Text(
              '${_selectedCategory!.name} — ${_products.length} products',
              style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
            ),
          ),
        Expanded(
          child: _loadingProducts
              ? const LoadingWidget()
              : _productsError
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.cloud_off, size: 48, color: AppTheme.error),
                          const SizedBox(height: 12),
                          const Text('Failed to load products',
                              style: TextStyle(color: AppTheme.textSecondary)),
                          const SizedBox(height: 8),
                          TextButton(
                            onPressed: () => _loadProducts(_selectedCategory!.id),
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    )
                  : _products.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.inventory_2_outlined, size: 48, color: AppTheme.textTertiary),
                              const SizedBox(height: 12),
                              const Text('No products in this category',
                                  style: TextStyle(color: AppTheme.textSecondary)),
                            ],
                          ),
                        )
                      : GridView.builder(
                          padding: const EdgeInsets.fromLTRB(12, 8, 12, 100),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 0.78,
                            crossAxisSpacing: 10,
                            mainAxisSpacing: 10,
                          ),
                          itemCount: _products.length,
                          itemBuilder: (_, i) {
                            final product = _products[i];
                            return ProductCard(
                              product: product,
                              onTap: () => _showProductSheet(product),
                            );
                          },
                        ),
        ),
      ],
    );
  }

  void _showProductSheet(Product product) {
    String? selectedSize;
    int qty = 1;
    final hasSizes = product.sizes.isNotEmpty;
    final isOutOfStock = product.totalStock <= 0;
    final price = product.getPriceForSize(null);
    final mrp = product.getMrpForSize(null);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) {
          final currentPrice = selectedSize != null
              ? product.getPriceForSize(selectedSize)
              : price;
          final currentMrp = selectedSize != null
              ? product.getMrpForSize(selectedSize)
              : mrp;

          return Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(ctx).viewInsets.bottom,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    height: 4, width: 40,
                    margin: const EdgeInsets.only(top: 12, bottom: 8),
                    decoration: BoxDecoration(
                      color: AppTheme.border,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                    child: AspectRatio(
                      aspectRatio: 1.4,
                      child: Container(
                        color: AppTheme.surfaceVariant,
                        child: product.images.isNotEmpty
                            ? Image.network(product.images.first, fit: BoxFit.cover, width: double.infinity, height: double.infinity, errorBuilder: (_, __, ___) => const Icon(Icons.image_outlined, color: AppTheme.textTertiary, size: 48))
                            : const Icon(Icons.image_outlined, color: AppTheme.textTertiary, size: 48),
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(product.name,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Flexible(
                              child: Text('₹${currentPrice.toStringAsFixed(0)}',
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                      fontSize: 24, fontWeight: FontWeight.bold, color: AppTheme.primary)),
                            ),
                            if (currentMrp > currentPrice) ...[
                              const SizedBox(width: 8),
                              Flexible(
                                child: Text('₹${currentMrp.toStringAsFixed(0)}',
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                        fontSize: 16, color: AppTheme.textTertiary,
                                        decoration: TextDecoration.lineThrough)),
                              ),
                              const SizedBox(width: 8),
                              Text('${((currentMrp - currentPrice) / currentMrp * 100).round()}% off',
                                  style: const TextStyle(
                                      fontSize: 12, color: AppTheme.accent, fontWeight: FontWeight.w600)),
                            ],
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(product.sizes.map((s) => '${s.name}:${s.stockQuantity}').join('  '),
                            maxLines: 2, overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                                fontSize: 12, color: product.totalStock <= 0
                                    ? AppTheme.error : AppTheme.textSecondary)),
                        if (hasSizes) ...[
                          const SizedBox(height: 16),
                          const Text('Select Size',
                              style: TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 8, runSpacing: 8,
                            children: product.sizes.map((s) {
                              final isSel = selectedSize == s.name;
                              return GestureDetector(
                                onTap: () => setSheetState(() => selectedSize = isSel ? null : s.name),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                                  decoration: BoxDecoration(
                                    color: isSel ? AppTheme.primary : AppTheme.surfaceVariant,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: isSel ? AppTheme.primary : AppTheme.border,
                                    ),
                                  ),
                                  child: Text(s.name,
                                      style: TextStyle(
                                          fontWeight: FontWeight.w600,
                                          color: isSel ? Colors.white : AppTheme.textPrimary)),
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                        if (!isOutOfStock) ...[
                          const SizedBox(height: 20),
                          Row(
                            children: [
                              Container(
                                decoration: BoxDecoration(
                                  border: Border.all(color: AppTheme.border),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Row(
                                  children: [
                                    InkWell(
                                      onTap: qty > 1 ? () => setSheetState(() => qty--) : null,
                                      child: Container(
                                        padding: const EdgeInsets.all(12),
                                        child: Icon(Icons.remove,
                                            size: 20, color: qty > 1 ? AppTheme.textPrimary : AppTheme.textTertiary),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                                      decoration: BoxDecoration(
                                        border: Border.symmetric(
                                          horizontal: BorderSide(color: AppTheme.border),
                                        ),
                                      ),
                                      child: Text('$qty',
                                          style: const TextStyle(
                                              fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                                    ),
                                    InkWell(
                                      onTap: qty < product.totalStock
                                          ? () => setSheetState(() => qty++)
                                          : null,
                                      child: Container(
                                        padding: const EdgeInsets.all(12),
                                        child: Icon(Icons.add,
                                            size: 20, color: qty < product.totalStock
                                                ? AppTheme.textPrimary : AppTheme.textTertiary),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const Spacer(),
                              Text('₹${(currentPrice * qty).toStringAsFixed(0)}',
                                  style: const TextStyle(
                                      fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.primary)),
                            ],
                          ),
                        ],
                        const SizedBox(height: 20),
                        SizedBox(
                          width: double.infinity,
                          height: 50,
                          child: ElevatedButton(
                            onPressed: isOutOfStock || (hasSizes && selectedSize == null)
                                ? null
                                : () {
                                    for (var i = 0; i < qty; i++) {
                                      _addToCart(product, selectedSize);
                                    }
                                    Navigator.pop(ctx);
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('Added $qty × ${product.name} to cart'),
                                        behavior: SnackBarBehavior.floating,
                                        duration: const Duration(seconds: 2),
                                      ),
                                    );
                                  },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.accent,
                              foregroundColor: Colors.white,
                              disabledBackgroundColor: AppTheme.border,
                              disabledForegroundColor: AppTheme.textTertiary,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                              textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                            child: Text(
                              isOutOfStock ? 'Out of Stock'
                                  : hasSizes && selectedSize == null ? 'Select a Size'
                                  : 'Add to Cart — ₹${(currentPrice * qty).toStringAsFixed(0)}',
                            ),
                          ),
                        ),
                        if (isOutOfStock)
                          const SizedBox(height: 8),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Flexible(child: Text(label, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 14))),
          const SizedBox(width: 12),
          Flexible(child: Text(value, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14))),
        ],
      ),
    );
  }
}

class _CartItem {
  final String key;
  final Product product;
  int quantity;
  final String? size;

  _CartItem({
    required this.key,
    required this.product,
    required this.quantity,
    this.size,
  });
}

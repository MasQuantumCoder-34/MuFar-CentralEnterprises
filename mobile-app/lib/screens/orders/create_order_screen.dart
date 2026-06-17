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
  final Map<String, String?> _selectedSizes = {};

  int _step = 1;

  List<User> _clients = [];
  List<Category> _categories = [];
  List<Product> _products = [];
  User? _selectedClient;
  Category? _selectedCategory;
  bool _loadingClients = true;
  bool _loadingCategories = false;
  bool _loadingProducts = false;
  String _clientSearch = '';

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
    try {
      final res = await _api.get(
        ApiEndpoints.products,
        queryParams: {'category': categoryId, 'limit': '100'},
      );
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        setState(() {
          _products = (body['data'] as List)
              .map((e) => Product.fromJson(e as Map<String, dynamic>))
              .toList();
        });
      }
    } catch (_) {}
    if (mounted) setState(() => _loadingProducts = false);
  }

  String _stepLabel(int s) {
    switch (s) {
      case 1: return 'Select Client';
      case 2: return 'Select Category';
      case 3: return 'Select Products';
      default: return '';
    }
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
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Order placed successfully!'),
            backgroundColor: AppTheme.success,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
        setState(() {
          _cart.clear();
          _selectedClient = null;
          _selectedCategory = null;
          _step = 1;
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
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Order')),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
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
                        final price = c.product.getPriceForSize(c.size);
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
                        onPressed: _placeOrder,
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size(140, 46),
                        ),
                        child: const Text('Place Order'),
                      ),
                    ],
                  ),
                ],
              ),
            )
          : null,
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
            Text(_stepLabel(step),
                style: TextStyle(
                    fontSize: isCurrent ? 12 : 11,
                    fontWeight: isCurrent ? FontWeight.w600 : null,
                    color: isCurrent ? AppTheme.textPrimary : AppTheme.textTertiary)),
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
                                setState(() => _selectedClient = client);
                              },
                            ),
                          );
                        },
                      ),
                    ),
        ),
        if (_selectedClient != null)
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => setState(() => _step = 2),
                  child: const Text('Next: Select Category'),
                ),
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
                          Text('Client: ${_selectedClient!.displayName}',
                              style: const TextStyle(
                                  fontSize: 12, color: AppTheme.textSecondary)),
                        ],
                      ),
                    ),
                  Expanded(
                    child: GridView.builder(
                      padding: const EdgeInsets.all(16),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        childAspectRatio: 1.4,
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
                            onTap: () => setState(() => _selectedCategory = cat),
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
                                  Container(
                                    width: 48, height: 48,
                                    decoration: BoxDecoration(
                                      color: (isSelected ? AppTheme.primary : AppTheme.textTertiary)
                                          .withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Icon(
                                      Icons.category_outlined,
                                      color: isSelected ? AppTheme.primary : AppTheme.textTertiary,
                                      size: 24,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(cat.name,
                                      style: TextStyle(
                                        fontWeight: FontWeight.w600,
                                        color: isSelected ? AppTheme.primary : AppTheme.textPrimary,
                                        fontSize: 13,
                                      ),
                                      textAlign: TextAlign.center),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                      child: Row(
                        children: [
                          OutlinedButton(
                            onPressed: () => setState(() => _step = 1),
                            child: const Text('Back'),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: _selectedCategory != null
                                  ? () {
                                      setState(() => _step = 3);
                                      _loadProducts(_selectedCategory!.id);
                                    }
                                  : null,
                              child: const Text('Next: Select Products'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              );
  }

  Widget _buildProductsStep() {
    if (_selectedCategory == null) return const SizedBox();
    return Column(
      children: [
        if (_selectedCategory != null)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
            child: Text(
              'Category: ${_selectedCategory!.name}',
              style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
            ),
          ),
        Expanded(
          child: _loadingProducts
              ? const LoadingWidget()
              : _products.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.inventory_2_outlined,
                              size: 48, color: AppTheme.textTertiary),
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
                        childAspectRatio: 0.75,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                      ),
                      itemCount: _products.length,
                      itemBuilder: (_, i) {
                        final product = _products[i];
                        final selSize = _selectedSizes[product.id];
                        return ProductCard(
                          product: product,
                          selectedSize: selSize,
                          onSizeSelected: (s) =>
                              setState(() => _selectedSizes[product.id] = s),
                          onAdd: _addToCart,
                        );
                      },
                    ),
        ),
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
            child: Row(
              children: [
                OutlinedButton(
                  onPressed: () => setState(() => _step = 2),
                  child: const Text('Back'),
                ),
                const SizedBox(width: 12),
                if (_cart.isNotEmpty)
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _placeOrder,
                      icon: const Icon(Icons.shopping_cart_checkout, size: 18),
                      label: Text('Place Order (₹${_cartTotal.toStringAsFixed(0)})'),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
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

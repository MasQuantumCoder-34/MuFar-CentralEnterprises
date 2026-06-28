import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'dashboard/dashboard_screen.dart';
import 'orders/orders_screen.dart';
import 'orders/create_order_screen.dart';
import 'orders/modify_order_screen.dart';
import 'orders/cancel_order_screen.dart';
import 'products/products_screen.dart';
import 'categories/categories_screen.dart';
import 'clients/clients_screen.dart';
import 'users/users_screen.dart';
import 'inventory/inventory_screen.dart';
import 'notifications/notifications_screen.dart';
import 'settings/settings_screen.dart';
import 'reports/reports_screen.dart';
import 'analytics/revenue_analytics_screen.dart';
import 'analytics/order_analytics_screen.dart';
import 'profile/profile_screen.dart';
import '../providers/auth_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/app_dialog.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;
  DateTime? _lastBackPress;
  final _pages = <Widget>[
    const DashboardScreen(),
    const OrdersScreen(),
    const ProductsScreen(),
    const CategoriesScreen(),
    const ClientsScreen(),
  ];

  void _openPage(Widget page) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => page));
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) return;
        if (_currentIndex != 0) {
          setState(() => _currentIndex = 0);
        } else if (_lastBackPress == null ||
            DateTime.now().difference(_lastBackPress!) > const Duration(seconds: 2)) {
          _lastBackPress = DateTime.now();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Press back again to exit'),
              duration: Duration(seconds: 2),
              behavior: SnackBarBehavior.floating,
            ),
          );
        } else {
          SystemNavigator.pop();
        }
      },
      child: Scaffold(
      drawer: _buildDrawer(),
      body: IndexedStack(index: _currentIndex, children: _pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => setState(() => _currentIndex = i),
        indicatorColor: AppTheme.primary.withOpacity(0.12),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home, color: AppTheme.primary), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.receipt_long_outlined), selectedIcon: Icon(Icons.receipt_long, color: AppTheme.primary), label: 'Orders'),
          NavigationDestination(icon: Icon(Icons.inventory_2_outlined), selectedIcon: Icon(Icons.inventory_2, color: AppTheme.primary), label: 'Products'),
          NavigationDestination(icon: Icon(Icons.category_outlined), selectedIcon: Icon(Icons.category, color: AppTheme.primary), label: 'Categories'),
          NavigationDestination(icon: Icon(Icons.people_outline), selectedIcon: Icon(Icons.people, color: AppTheme.primary), label: 'Clients'),
        ],
      ),
      ),
    );
  }

  Widget _buildDrawer() {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.fromLTRB(0, 0, 0, MediaQuery.of(context).padding.bottom + 20),
        children: [
          DrawerHeader(
            decoration: const BoxDecoration(color: AppTheme.primary),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.asset(
                    'assets/app-logo.jpeg',
                    width: 48, height: 48,
                    fit: BoxFit.cover,
                  ),
                ),
                const SizedBox(height: 12),
                const Text('Central Enterprises',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                const Text('Admin Panel',
                    style: TextStyle(color: Colors.white70, fontSize: 12)),
              ],
            ),
          ),
          _drawerItem(Icons.dashboard_outlined, 'Dashboard', onTap: () => _switchTab(0)),
          _drawerItem(Icons.shopping_cart_outlined, 'Create Order', onTap: () { Navigator.pop(context); _openPage(const CreateOrderScreen()); }),
          _drawerItem(Icons.edit_outlined, 'Modify Orders', onTap: () { Navigator.pop(context); _openPage(const ModifyOrderScreen()); }),
          _drawerItem(Icons.cancel_outlined, 'Cancel Orders', onTap: () { Navigator.pop(context); _openPage(const CancelOrderScreen()); }),
          const Divider(),
          _drawerItem(Icons.inventory_2_outlined, 'Products', onTap: () => _switchTab(2)),
          _drawerItem(Icons.category_outlined, 'Categories', onTap: () => _switchTab(3)),
          _drawerItem(Icons.people_outline, 'Clients', onTap: () => _switchTab(4)),
          _drawerItem(Icons.shield_outlined, 'Users', onTap: () { Navigator.pop(context); _openPage(const UsersScreen()); }),
          _drawerItem(Icons.inventory_2_outlined, 'Inventory', onTap: () { Navigator.pop(context); _openPage(const InventoryScreen()); }),
          const Divider(),
          _drawerItem(Icons.notifications_outlined, 'Notifications', onTap: () { Navigator.pop(context); _openPage(const NotificationsScreen()); }),
          _drawerItem(Icons.bar_chart_outlined, 'Reports', onTap: () { Navigator.pop(context); _openPage(const ReportsScreen()); }),
          _drawerItem(Icons.trending_up_outlined, 'Revenue Analytics', onTap: () { Navigator.pop(context); _openPage(const RevenueAnalyticsScreen()); }),
          _drawerItem(Icons.bar_chart_outlined, 'Order Analytics', onTap: () { Navigator.pop(context); _openPage(const OrderAnalyticsScreen()); }),
          const Divider(),
          _drawerItem(Icons.settings_outlined, 'Settings', onTap: () { Navigator.pop(context); _openPage(const SettingsScreen()); }),
          _drawerItem(Icons.person_outline, 'Profile', onTap: () { Navigator.pop(context); _openPage(const ProfileScreen()); }),
          const Divider(),
          _drawerItem(Icons.logout_rounded, 'Logout',
            onTap: () {
              Navigator.pop(context);
              AppDialog.showConfirm(
                context,
                title: 'Logout',
                content: const Text('Are you sure you want to logout?'),
                cancelLabel: 'Cancel',
                confirmLabel: 'Logout',
                confirmColor: AppTheme.error,
              ).then((confirmed) {
                if (confirmed == true) context.read<AuthProvider>().logout();
              });
            },
          ),
        ],
      ),
    );
  }

  void _switchTab(int index) {
    Navigator.pop(context);
    setState(() => _currentIndex = index);
  }

  Widget _drawerItem(IconData icon, String label, {VoidCallback? onTap}) {
    return ListTile(
      leading: Icon(icon, size: 20),
      title: Text(label, style: const TextStyle(fontSize: 14)),
      dense: true,
      onTap: onTap,
    );
  }
}

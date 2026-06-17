class ApiEndpoints {
  static const String baseUrl = 'https://mufar-centralenterprises-1.onrender.com/api';

  static const String login = '/auth/login';
  static const String refresh = '/auth/refresh';
  static const String me = '/auth/me';

  static const String products = '/products';
  static String product(String id) => '/products/$id';

  static const String categories = '/categories';
  static String category(String id) => '/categories/$id';

  static const String users = '/users';
  static String user(String id) => '/users/$id';

  static const String orders = '/orders';
  static String order(String id) => '/orders/$id';
  static String orderStatus(String id) => '/orders/$id/status';

  static const String dashboard = '/dashboard/client';
  static const String adminDashboard = '/dashboard/admin';

  static const String notifications = '/notifications';
  static String notification(String id) => '/notifications/$id';
}

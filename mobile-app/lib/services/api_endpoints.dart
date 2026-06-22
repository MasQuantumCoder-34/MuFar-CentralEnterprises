class ApiEndpoints {
  static const String baseUrl = 'https://mufar-centralenterprises-1.onrender.com/api';

  static const String login = '/auth/login';
  static const String refresh = '/auth/refresh';
  static const String me = '/auth/me';

  static const String products = '/products';

  static const String categories = '/categories';

  static const String users = '/users';

  static const String orders = '/orders';
  static String order(String id) => '/orders/$id';
  static String orderStatus(String id) => '/orders/$id/status';

  static const String upload = '/upload';

  static const String notifications = '/notifications';
}

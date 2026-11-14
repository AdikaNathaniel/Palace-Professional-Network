import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/session.dart';
import 'api_service.dart';

class AuthService {
  static String get _base => ApiConfig.baseUrl;

  static Future<UserSession> register({
    required String phoneNumber,
    required String pin,
    String? fullName,
  }) {
    return _post('$_base/auth/register', {
      'phoneNumber': phoneNumber,
      'pin': pin,
      if (fullName != null && fullName.trim().isNotEmpty) 'fullName': fullName.trim(),
    });
  }

  static Future<UserSession> login({
    required String phoneNumber,
    required String pin,
  }) {
    return _post('$_base/auth/login', {
      'phoneNumber': phoneNumber,
      'pin': pin,
    });
  }

  static Future<UserSession> _post(String url, Map<String, String> body) async {
    final res = await http.post(
      Uri.parse(url),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );

    if (res.statusCode < 200 || res.statusCode >= 300) {
      String message = 'Something went wrong (${res.statusCode}).';
      try {
        final decoded = jsonDecode(res.body);
        if (decoded is Map && decoded['message'] != null) {
          message = decoded['message'] is List
              ? (decoded['message'] as List).join(', ')
              : decoded['message'].toString();
        }
      } catch (_) {}
      throw ApiException(message);
    }

    return UserSession.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }
}

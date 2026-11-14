import 'package:shared_preferences/shared_preferences.dart';
import '../models/session.dart';

class SessionService {
  static const _phoneKey = 'session_phone_number';
  static const _nameKey = 'session_full_name';
  static const _tokenKey = 'session_token';

  static Future<UserSession?> getSession() async {
    final prefs = await SharedPreferences.getInstance();
    final phone = prefs.getString(_phoneKey);
    final token = prefs.getString(_tokenKey);
    if (phone == null || phone.isEmpty || token == null || token.isEmpty) {
      return null;
    }
    return UserSession(
      phoneNumber: phone,
      fullName: prefs.getString(_nameKey),
      token: token,
    );
  }

  static Future<void> saveSession(UserSession session) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_phoneKey, session.phoneNumber);
    await prefs.setString(_tokenKey, session.token);
    if (session.fullName != null && session.fullName!.isNotEmpty) {
      await prefs.setString(_nameKey, session.fullName!);
    } else {
      await prefs.remove(_nameKey);
    }
  }

  static Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_phoneKey);
    await prefs.remove(_nameKey);
    await prefs.remove(_tokenKey);
  }
}

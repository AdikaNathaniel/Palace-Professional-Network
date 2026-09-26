import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import '../config/api_config.dart';
import '../models/chat_message.dart';
import 'api_service.dart';

/// REST side of chat: attachment uploads, sticker/GIF search, presence and
/// push-notification device tokens. Real-time messaging is in ChatService.
class ChatMediaService {
  ChatMediaService._();

  static const maxUploadBytes = 15 * 1024 * 1024;

  static String get _base => ApiConfig.baseUrl;

  static Map<String, String> get _auth => {
    if (ApiService.authToken != null)
      'Authorization': 'Bearer ${ApiService.authToken}',
  };

  static const _mimeByExtension = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'heic': 'image/heic',
    'm4a': 'audio/mp4',
    'aac': 'audio/aac',
    'mp3': 'audio/mpeg',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx':
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'zip': 'application/zip',
  };

  static String mimeTypeFor(String filename) {
    final ext = filename.contains('.')
        ? filename.split('.').last.toLowerCase()
        : '';
    return _mimeByExtension[ext] ?? 'application/octet-stream';
  }

  static String _errorMessage(http.Response res, String fallback) {
    try {
      final body = jsonDecode(res.body);
      if (body is Map && body['message'] is String)
        return body['message'] as String;
    } catch (_) {}
    return '$fallback (${res.statusCode}).';
  }

  static Future<ChatAttachment> upload(
    Uint8List bytes,
    String filename, {
    String? mimeType,
  }) async {
    if (bytes.length > maxUploadBytes) {
      throw ApiException('Files must be 15 MB or smaller.');
    }
    final type = mimeType ?? mimeTypeFor(filename);
    final request =
        http.MultipartRequest('POST', Uri.parse('$_base/chat/upload'))
          ..headers.addAll(_auth)
          ..files.add(
            http.MultipartFile.fromBytes(
              'file',
              bytes,
              filename: filename,
              contentType: MediaType.parse(type),
            ),
          );
    final res = await http.Response.fromStream(await request.send());
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw ApiException(_errorMessage(res, 'Upload failed'));
    }
    return ChatAttachment.fromJson(
      jsonDecode(res.body) as Map<String, dynamic>,
    );
  }

  /// [kind] is "stickers" or "gifs"; an empty [query] returns trending.
  static Future<List<StickerResult>> searchStickers(
    String query, {
    String kind = 'stickers',
  }) async {
    final uri = Uri.parse(
      '$_base/chat/stickers',
    ).replace(queryParameters: {'q': query, 'kind': kind});
    final res = await http.get(uri, headers: _auth);
    if (res.statusCode != 200) {
      throw ApiException(_errorMessage(res, 'Could not load stickers'));
    }
    return (jsonDecode(res.body) as List)
        .map((e) => StickerResult.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<DateTime?> lastSeen(String phoneNumber) async {
    final res = await http.get(
      Uri.parse('$_base/chat/presence/${Uri.encodeComponent(phoneNumber)}'),
      headers: _auth,
    );
    if (res.statusCode != 200) return null;
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    final value = body['lastSeenAt'];
    return value is String ? DateTime.tryParse(value)?.toLocal() : null;
  }

  static Future<void> registerDeviceToken(String token) async {
    await http.post(
      Uri.parse('$_base/chat/device-token'),
      headers: {..._auth, 'Content-Type': 'application/json'},
      body: jsonEncode({'token': token}),
    );
  }

  static Future<void> unregisterDeviceToken(String token) async {
    await http.delete(
      Uri.parse('$_base/chat/device-token'),
      headers: {..._auth, 'Content-Type': 'application/json'},
      body: jsonEncode({'token': token}),
    );
  }
}

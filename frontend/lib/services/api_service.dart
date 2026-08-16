import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import '../config/api_config.dart';
import '../models/biodata.dart';

class ApiException implements Exception {
  final String message;
  ApiException(this.message);
  @override
  String toString() => message;
}

class ApiService {
  static String get _base => ApiConfig.baseUrl;

  static Future<BiodataOptions> fetchOptions() async {
    final res = await http.get(Uri.parse('$_base/biodata/options'));
    if (res.statusCode != 200) {
      throw ApiException('Failed to load form options (${res.statusCode}).');
    }
    return BiodataOptions.fromJson(
      jsonDecode(res.body) as Map<String, dynamic>,
    );
  }

  static Future<List<Biodata>> fetchAll() async {
    final res = await http.get(Uri.parse('$_base/biodata'));
    if (res.statusCode != 200) {
      throw ApiException('Failed to load directory (${res.statusCode}).');
    }
    final list = jsonDecode(res.body) as List;
    return list
        .map((e) => Biodata.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<void> submit({
    required String fullName,
    required String ageRange,
    required String gender,
    required String maritalStatus,
    String? email,
    required String phoneNumber,
    required String professionCategory,
    String? professionSubCategory,
    required String placeOfWork,
    XFile? imageFile,
  }) async {
    final uri = Uri.parse('$_base/biodata');
    final request = http.MultipartRequest('POST', uri)
      ..fields['fullName'] = fullName
      ..fields['ageRange'] = ageRange
      ..fields['gender'] = gender
      ..fields['maritalStatus'] = maritalStatus
      ..fields['phoneNumber'] = phoneNumber
      ..fields['professionCategory'] = professionCategory
      ..fields['placeOfWork'] = placeOfWork;

    if (email != null && email.trim().isNotEmpty) {
      request.fields['email'] = email.trim();
    }
    if (professionSubCategory != null && professionSubCategory.isNotEmpty) {
      request.fields['professionSubCategory'] = professionSubCategory;
    }
    if (imageFile != null) {
      final bytes = await imageFile.readAsBytes();
      request.files.add(
        http.MultipartFile.fromBytes(
          'image',
          bytes,
          filename: imageFile.name,
        ),
      );
    }

    final streamedResponse = await request.send();
    final res = await http.Response.fromStream(streamedResponse);
    if (res.statusCode != 201 && res.statusCode != 200) {
      String message = 'Submission failed (${res.statusCode}).';
      try {
        final body = jsonDecode(res.body);
        if (body is Map && body['message'] != null) {
          message = body['message'] is List
              ? (body['message'] as List).join(', ')
              : body['message'].toString();
        }
      } catch (_) {}
      throw ApiException(message);
    }
  }

  static String resolveImageUrl(String? imageUrl) {
    if (imageUrl == null || imageUrl.isEmpty) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    return '$_base$imageUrl';
  }
}

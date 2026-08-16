class Biodata {
  final String? id;
  final String fullName;
  final String ageRange;
  final String gender;
  final String maritalStatus;
  final String? email;
  final String phoneNumber;
  final String professionCategory;
  final String? professionSubCategory;
  final String placeOfWork;
  final String? imageUrl;
  final DateTime? createdAt;

  Biodata({
    this.id,
    required this.fullName,
    required this.ageRange,
    required this.gender,
    required this.maritalStatus,
    this.email,
    required this.phoneNumber,
    required this.professionCategory,
    this.professionSubCategory,
    required this.placeOfWork,
    this.imageUrl,
    this.createdAt,
  });

  factory Biodata.fromJson(Map<String, dynamic> json) {
    return Biodata(
      id: json['_id'] as String?,
      fullName: json['fullName'] as String? ?? '',
      ageRange: json['ageRange'] as String? ?? '',
      gender: json['gender'] as String? ?? '',
      maritalStatus: json['maritalStatus'] as String? ?? '',
      email: json['email'] as String?,
      phoneNumber: json['phoneNumber'] as String? ?? '',
      professionCategory: json['professionCategory'] as String? ?? '',
      professionSubCategory: json['professionSubCategory'] as String?,
      placeOfWork: json['placeOfWork'] as String? ?? '',
      imageUrl: json['imageUrl'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
    );
  }
}

class BiodataOptions {
  final List<String> ageRanges;
  final List<String> genders;
  final List<String> maritalStatuses;
  final List<String> professionCategories;
  final Map<String, List<String>> professionSubCategories;

  BiodataOptions({
    required this.ageRanges,
    required this.genders,
    required this.maritalStatuses,
    required this.professionCategories,
    required this.professionSubCategories,
  });

  factory BiodataOptions.fromJson(Map<String, dynamic> json) {
    final subCategoriesJson =
        json['professionSubCategories'] as Map<String, dynamic>? ?? {};
    return BiodataOptions(
      ageRanges: List<String>.from(json['ageRanges'] as List? ?? []),
      genders: List<String>.from(json['genders'] as List? ?? []),
      maritalStatuses:
          List<String>.from(json['maritalStatuses'] as List? ?? []),
      professionCategories:
          List<String>.from(json['professionCategories'] as List? ?? []),
      professionSubCategories: subCategoriesJson.map(
        (key, value) => MapEntry(key, List<String>.from(value as List)),
      ),
    );
  }

  List<String> get allSubCategories =>
      professionSubCategories.values.expand((list) => list).toList();
}

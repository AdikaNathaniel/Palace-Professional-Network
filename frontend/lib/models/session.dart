class UserSession {
  final String phoneNumber;
  final String? fullName;

  UserSession({required this.phoneNumber, this.fullName});

  factory UserSession.fromJson(Map<String, dynamic> json) {
    return UserSession(
      phoneNumber: json['phoneNumber'] as String,
      fullName: json['fullName'] as String?,
    );
  }
}

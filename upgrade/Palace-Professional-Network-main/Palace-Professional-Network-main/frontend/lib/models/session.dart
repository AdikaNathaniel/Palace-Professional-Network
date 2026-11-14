class UserSession {
  final String phoneNumber;
  final String? fullName;
  final String token;

  UserSession({required this.phoneNumber, this.fullName, required this.token});

  factory UserSession.fromJson(Map<String, dynamic> json) {
    return UserSession(
      phoneNumber: json['phoneNumber'] as String,
      fullName: json['fullName'] as String?,
      token: json['token'] as String,
    );
  }
}

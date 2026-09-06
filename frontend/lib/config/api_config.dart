class ApiConfig {
  ApiConfig._();

  // Points at the deployed backend by default. Override for local
  // development with:
  // --dart-define=API_BASE_URL=http://10.0.2.2:3000  (Android emulator)
  // --dart-define=API_BASE_URL=http://localhost:3000 (iOS/desktop/web)
  static const String _override = String.fromEnvironment('API_BASE_URL');

  static String get baseUrl {
    if (_override.isNotEmpty) return _override;
    return 'https://palace-professional-network-ipc.fly.dev';
  }
}

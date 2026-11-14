import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:palace_professional_network/main.dart';

void main() {
  testWidgets('App starts at the login screen when no session is saved',
      (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(const PalaceProfessionalNetworkApp());
    await tester.pumpAndSettle();

    expect(find.text('Palace Professional Network'), findsOneWidget);
    expect(find.text('Log in to continue'), findsOneWidget);
    expect(find.text('Phone number'), findsOneWidget);
    expect(find.text('4-digit PIN'), findsOneWidget);
    expect(find.text('Log In'), findsOneWidget);
  });
}

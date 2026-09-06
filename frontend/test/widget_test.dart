import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:palace_professional_network/main.dart';

void main() {
  testWidgets('App renders the dashboard shell with bottom navigation',
      (WidgetTester tester) async {
    await tester.pumpWidget(const PalaceProfessionalNetworkApp());
    await tester.pump();

    // "Dashboard" appears in both the AppBar title and the nav bar label.
    expect(find.text('Dashboard'), findsNWidgets(2));
    expect(find.text('Biodata Form'), findsOneWidget);
    expect(find.text('Directory'), findsOneWidget);
    expect(find.byType(BottomNavigationBar), findsOneWidget);
  });
}

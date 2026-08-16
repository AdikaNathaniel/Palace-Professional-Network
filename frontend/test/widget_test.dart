import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:palace_professional_network/main.dart';

void main() {
  testWidgets('App renders the biodata form shell with bottom navigation',
      (WidgetTester tester) async {
    await tester.pumpWidget(const PalaceProfessionalNetworkApp());
    await tester.pump();

    expect(find.text('Palace Professional Network'), findsOneWidget);
    expect(find.text('Biodata Form'), findsOneWidget);
    expect(find.text('Directory'), findsOneWidget);
    // The options request to the backend hasn't resolved yet in this test.
    expect(find.byType(CircularProgressIndicator), findsWidgets);
  });
}

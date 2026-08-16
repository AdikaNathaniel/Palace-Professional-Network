import 'package:flutter/material.dart';
import 'pages/biodata_form_page.dart';
import 'pages/directory_page.dart';
import 'theme/app_theme.dart';

void main() {
  runApp(const PalaceProfessionalNetworkApp());
}

class PalaceProfessionalNetworkApp extends StatelessWidget {
  const PalaceProfessionalNetworkApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Palace Professional Network',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: const HomeShell(),
    );
  }
}

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _currentIndex = 0;
  final _directoryKey = GlobalKey<DirectoryPageState>();

  void _goToDirectory() {
    setState(() => _currentIndex = 1);
    _directoryKey.currentState?.refresh();
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      BiodataFormPage(onSubmitted: _goToDirectory),
      DirectoryPage(key: _directoryKey),
    ];

    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: pages),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() => _currentIndex = index);
          if (index == 1) _directoryKey.currentState?.refresh();
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.edit_note_outlined),
            label: 'Biodata Form',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.people_outline),
            label: 'Directory',
          ),
        ],
      ),
    );
  }
}

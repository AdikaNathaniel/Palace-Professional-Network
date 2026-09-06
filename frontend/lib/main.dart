import 'package:flutter/material.dart';
import 'models/session.dart';
import 'pages/biodata_form_page.dart';
import 'pages/dashboard_page.dart';
import 'pages/directory_page.dart';
import 'pages/login_page.dart';
import 'services/session_service.dart';
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
      home: const AuthGate(),
    );
  }
}

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  late Future<UserSession?> _sessionFuture;
  UserSession? _session;

  @override
  void initState() {
    super.initState();
    _sessionFuture = SessionService.getSession();
  }

  void _onLoggedIn(UserSession session) {
    setState(() => _session = session);
  }

  Future<void> _onLogout() async {
    await SessionService.clearSession();
    setState(() => _session = null);
  }

  @override
  Widget build(BuildContext context) {
    if (_session != null) {
      return HomeShell(session: _session!, onLogout: _onLogout);
    }
    return FutureBuilder<UserSession?>(
      future: _sessionFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }
        if (snapshot.data != null) {
          return HomeShell(session: snapshot.data!, onLogout: _onLogout);
        }
        return LoginPage(onLoggedIn: _onLoggedIn);
      },
    );
  }
}

class HomeShell extends StatefulWidget {
  final UserSession session;
  final Future<void> Function() onLogout;

  const HomeShell({super.key, required this.session, required this.onLogout});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _currentIndex = 0;
  final _dashboardKey = GlobalKey<DashboardPageState>();
  final _directoryKey = GlobalKey<DirectoryPageState>();

  void _goToTab(int index) {
    setState(() => _currentIndex = index);
    _refreshTab(index);
  }

  void _refreshTab(int index) {
    if (index == 0) _dashboardKey.currentState?.refresh();
    if (index == 2) _directoryKey.currentState?.refresh();
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      DashboardPage(
        key: _dashboardKey,
        session: widget.session,
        onGoToForm: () => _goToTab(1),
        onGoToDirectory: () => _goToTab(2),
        onLogout: widget.onLogout,
      ),
      BiodataFormPage(onSubmitted: () => _goToTab(2)),
      DirectoryPage(key: _directoryKey),
    ];

    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: pages),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() => _currentIndex = index);
          _refreshTab(index);
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            label: 'Dashboard',
          ),
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

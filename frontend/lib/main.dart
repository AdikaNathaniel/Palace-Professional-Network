import 'package:flutter/material.dart';
import 'models/session.dart';
import 'pages/biodata_form_page.dart';
import 'pages/chat_page.dart';
import 'pages/chats_list_page.dart';
import 'pages/dashboard_page.dart';
import 'pages/directory_page.dart';
import 'pages/login_page.dart';
import 'pages/settings_page.dart';
import 'services/api_service.dart';
import 'services/push_service.dart';
import 'services/session_service.dart';
import 'services/unread_service.dart';
import 'theme/app_theme.dart';
import 'widgets/in_app_notification.dart';
import 'widgets/unread_badge.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await PushService.init();
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
  bool _loading = true;
  UserSession? _session;

  @override
  void initState() {
    super.initState();
    _loadSession();
  }

  Future<void> _loadSession() async {
    final session = await SessionService.getSession();
    if (!mounted) return;
    ApiService.authToken = session?.token;
    setState(() {
      _session = session;
      _loading = false;
    });
  }

  void _onLoggedIn(UserSession session) {
    ApiService.authToken = session.token;
    setState(() => _session = session);
  }

  Future<void> _onLogout() async {
    // Before the token is dropped: the unregister call must be authenticated.
    await PushService.stopForUser();
    await SessionService.clearSession();
    ApiService.authToken = null;
    // Plain state, not a re-consulted Future: once _loading is false, this
    // is the only source of truth, so there's no stale cached value for
    // logout to bounce off of.
    setState(() => _session = null);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (_session != null) {
      return HomeShell(session: _session!, onLogout: _onLogout);
    }
    return LoginPage(onLoggedIn: _onLoggedIn);
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
  final _chatsKey = GlobalKey<ChatsListPageState>();

  @override
  void initState() {
    super.initState();
    _promptForBiodataIfMissing();
    UnreadService.startPolling();
    _lifecycle = AppLifecycleListener(
      onResume: UnreadService.startPolling,
      onPause: UnreadService.pausePolling,
    );
    PushService.startForUser(
      onOpenChat: _openChatFromNotification,
      onForegroundMessage: (roomId, chatTitle, title, body) {
        if (!mounted) return;
        InAppNotification.show(
          context,
          title: title,
          body: body,
          onTap: () => _openChatFromNotification(roomId, chatTitle),
        );
      },
    );
  }

  late final AppLifecycleListener _lifecycle;

  void _openChatFromNotification(String roomId, String title) {
    if (!mounted) return;
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) =>
            ChatPage(session: widget.session, roomId: roomId, title: title),
      ),
    );
  }

  @override
  void dispose() {
    _lifecycle.dispose();
    UnreadService.stopPolling();
    super.dispose();
  }

  /// Members only appear in the directory once they've submitted the biodata
  /// form, so anyone without a record (e.g. just registered) is sent straight
  /// to it, on every app start, until they fill it in.
  Future<void> _promptForBiodataIfMissing() async {
    try {
      final mine = await ApiService.fetchMine();
      if (mine != null || !mounted) return;
    } catch (_) {
      // Network/session problems are surfaced by the pages themselves.
      return;
    }
    setState(() => _currentIndex = 1);
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Complete your profile'),
        content: const Text(
          'Please fill in the biodata form. Other members will only see you '
          'in the Professional Directory after you submit it.',
        ),
        actions: [
          FilledButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Fill it in now'),
          ),
        ],
      ),
    );
  }

  void _goToTab(int index) {
    setState(() => _currentIndex = index);
    _refreshTab(index);
  }

  void _refreshTab(int index) {
    UnreadService.refresh();
    if (index == 0) _dashboardKey.currentState?.refresh();
    if (index == 2) _directoryKey.currentState?.refresh();
    if (index == 3) _chatsKey.currentState?.refresh();
  }

  void _goToDirectoryWithCategory(String category) {
    setState(() => _currentIndex = 2);
    _directoryKey.currentState?.applyCategoryFilter(category);
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      DashboardPage(
        key: _dashboardKey,
        session: widget.session,
        onCategoryTap: _goToDirectoryWithCategory,
        onLogout: widget.onLogout,
      ),
      BiodataFormPage(session: widget.session, onSubmitted: () => _goToTab(2)),
      DirectoryPage(key: _directoryKey, session: widget.session),
      ChatsListPage(key: _chatsKey, session: widget.session),
      const SettingsPage(),
    ];

    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: pages),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
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
          BottomNavigationBarItem(icon: _ChatsTabIcon(), label: 'Chats'),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings_outlined),
            label: 'Settings',
          ),
        ],
      ),
    );
  }
}

/// Chats tab icon with the total unread count bubbled on its corner.
class _ChatsTabIcon extends StatelessWidget {
  const _ChatsTabIcon();

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder(
      valueListenable: UnreadService.counts,
      builder: (context, counts, _) => Stack(
        clipBehavior: Clip.none,
        children: [
          const Icon(Icons.chat_bubble_outline),
          if (counts.total > 0)
            Positioned(
              right: -14,
              top: -8,
              child: UnreadBadge(count: counts.total),
            ),
        ],
      ),
    );
  }
}

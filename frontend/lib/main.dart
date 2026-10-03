import 'package:flutter/material.dart';
import 'models/session.dart';
import 'pages/about_page.dart';
import 'pages/account_page.dart';
import 'pages/biodata_form_page.dart';
import 'pages/chat_page.dart';
import 'pages/chats_list_page.dart';
import 'pages/dashboard_page.dart';
import 'pages/directory_page.dart';
import 'pages/login_page.dart';
import 'services/api_service.dart';
import 'services/inbox_service.dart';
import 'services/push_service.dart';
import 'services/session_service.dart';
import 'services/theme_service.dart';
import 'services/unread_service.dart';
import 'theme/app_theme.dart';
import 'widgets/edge_bulge_page_view.dart';
import 'widgets/in_app_notification.dart';
import 'widgets/unread_badge.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await PushService.init();
  await ThemeService.load();
  runApp(const PalaceProfessionalNetworkApp());
}

class PalaceProfessionalNetworkApp extends StatefulWidget {
  const PalaceProfessionalNetworkApp({super.key});

  @override
  State<PalaceProfessionalNetworkApp> createState() =>
      _PalaceProfessionalNetworkAppState();
}

class _PalaceProfessionalNetworkAppState
    extends State<PalaceProfessionalNetworkApp> {
  @override
  void initState() {
    super.initState();
    ThemeService.mode.addListener(_onThemeChanged);
  }

  @override
  void dispose() {
    ThemeService.mode.removeListener(_onThemeChanged);
    super.dispose();
  }

  /// Many widgets read AppColors directly rather than through Theme.of, so
  /// they wouldn't notice the switch on their own: rebuild every widget in
  /// the app (including screens pushed on top, like Settings) once.
  void _onThemeChanged() {
    void rebuild(Element element) {
      element.markNeedsBuild();
      element.visitChildren(rebuild);
    }

    (context as Element).visitChildren(rebuild);
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Palace Professional Network',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeService.mode.value,
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

  /// True right after sign-up: the home screen opens the biodata form first.
  bool _justRegistered = false;

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

  void _onLoggedIn(UserSession session) =>
      _signIn(session, justRegistered: false);

  void _onRegistered(UserSession session) =>
      _signIn(session, justRegistered: true);

  void _signIn(UserSession session, {required bool justRegistered}) {
    ApiService.authToken = session.token;
    // The register screen is pushed on top of the login screen; close it
    // (and anything else above this gate) so the home screen is visible.
    Navigator.of(context).popUntil((route) => route.isFirst);
    setState(() {
      _session = session;
      _justRegistered = justRegistered;
    });
  }

  Future<void> _onLogout() async {
    // Before the token is dropped: the unregister call must be authenticated.
    await PushService.stopForUser();
    await SessionService.clearSession();
    ApiService.authToken = null;
    if (!mounted) return;
    // Logout is triggered from the Account page, which is pushed above the
    // home screen; close it so the login screen isn't hidden behind it.
    Navigator.of(context).popUntil((route) => route.isFirst);
    // Plain state, not a re-consulted Future: once _loading is false, this
    // is the only source of truth, so there's no stale cached value for
    // logout to bounce off of.
    setState(() {
      _session = null;
      _justRegistered = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (_session != null) {
      return HomeShell(
        session: _session!,
        onLogout: _onLogout,
        openBiodataOnStart: _justRegistered,
      );
    }
    return LoginPage(onLoggedIn: _onLoggedIn, onRegistered: _onRegistered);
  }
}

class HomeShell extends StatefulWidget {
  final UserSession session;
  final Future<void> Function() onLogout;

  /// Set for a brand-new account: open the biodata form immediately.
  final bool openBiodataOnStart;

  const HomeShell({
    super.key,
    required this.session,
    required this.onLogout,
    this.openBiodataOnStart = false,
  });

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  static const _dashboardTab = 0;
  static const _directoryTab = 1;
  static const _chatsTab = 2;

  int _currentIndex = _dashboardTab;
  final _pageController = PageController();

  /// Tabs visited before the current one, most recent last, so the phone's
  /// back button returns to the previous tab instead of leaving the app.
  /// Each tab appears at most once.
  final List<int> _tabHistory = [];

  /// Set while a bottom-bar tap is animating across pages, so the pages it
  /// passes through on the way aren't refreshed.
  int? _tapTarget;
  final _dashboardKey = GlobalKey<DashboardPageState>();
  final _directoryKey = GlobalKey<DirectoryPageState>();
  final _chatsKey = GlobalKey<ChatsListPageState>();

  @override
  void initState() {
    super.initState();
    if (widget.openBiodataOnStart) {
      // Just registered: go straight to the form, no reminder dialog.
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _openBiodata();
      });
    } else {
      _promptForBiodataIfMissing();
    }
    UnreadService.startPolling();
    InboxService.start(widget.session.token);
    _lifecycle = AppLifecycleListener(
      onResume: () {
        UnreadService.startPolling();
        InboxService.resume();
      },
      onPause: () {
        UnreadService.pausePolling();
        InboxService.pause();
      },
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
    _pageController.dispose();
    _lifecycle.dispose();
    UnreadService.stopPolling();
    InboxService.stop();
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
    if (mounted) _openBiodata();
  }

  /// The biodata form opens from the Account page (and
  /// automatically for members who haven't filled it in). After submitting,
  /// go to the Directory so they can see themselves listed.
  void _openBiodata() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (pageContext) => BiodataFormPage(
          session: widget.session,
          onSubmitted: () {
            // Closes the form and, if it was opened from there, the Account
            // page too.
            Navigator.of(pageContext).popUntil((route) => route.isFirst);
            // Their profession (and so group chat) may have changed.
            InboxService.refreshWatch();
            _goToTab(_directoryTab);
          },
        ),
      ),
    );
  }

  /// Makes [index] the current tab. Unless going back, the tab being left
  /// is remembered for the back button.
  void _setTab(int index, {bool goingBack = false}) {
    if (index == _currentIndex) return;
    // The tab being opened is no longer "behind" the user.
    _tabHistory.remove(index);
    if (!goingBack) {
      _tabHistory
        ..remove(_currentIndex)
        ..add(_currentIndex);
    }
    setState(() => _currentIndex = index);
  }

  void _goToTab(int index) {
    if (_pageController.hasClients) _pageController.jumpToPage(index);
    _setTab(index);
    _refreshTab(index);
  }

  Future<void> _onNavTap(int index) => _animateToTab(index);

  /// Back button: previous tab, then Home, then (from Home) leave the app.
  void _onBackPressed() {
    final previous = _tabHistory.isNotEmpty
        ? _tabHistory.removeLast()
        : _dashboardTab;
    _animateToTab(previous, goingBack: true);
  }

  Future<void> _animateToTab(int index, {bool goingBack = false}) async {
    if (index == _currentIndex) {
      _refreshTab(index);
      return;
    }
    _tapTarget = index;
    _setTab(index, goingBack: goingBack);
    await _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 320),
      curve: Curves.easeOutCubic,
    );
    _tapTarget = null;
    _refreshTab(index);
  }

  void _onPageChanged(int index) {
    if (_tapTarget != null) return;
    _setTab(index);
    _refreshTab(index);
  }

  void _refreshTab(int index) {
    UnreadService.refresh();
    if (index == _dashboardTab) _dashboardKey.currentState?.refresh();
    if (index == _directoryTab) _directoryKey.currentState?.refresh();
    if (index == _chatsTab) _chatsKey.currentState?.refresh();
  }

  void _openAccount() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => AccountPage(
          session: widget.session,
          onOpenBiodata: _openBiodata,
          onLogout: widget.onLogout,
        ),
      ),
    );
  }

  void _goToDirectoryWithCategory(String category) {
    _pageController.jumpToPage(_directoryTab);
    _setTab(_directoryTab);
    // The Directory page is only built the first time it's shown, so wait
    // a frame for it to exist before filtering.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _directoryKey.currentState?.applyCategoryFilter(category);
    });
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      DashboardPage(
        key: _dashboardKey,
        session: widget.session,
        onCategoryTap: _goToDirectoryWithCategory,
        onOpenAccount: _openAccount,
      ),
      DirectoryPage(key: _directoryKey, session: widget.session),
      ChatsListPage(key: _chatsKey, session: widget.session),
      const AboutPage(),
    ];

    return PopScope(
      // Only let the back button close the app from Home with nowhere left
      // to go back to; otherwise it steps back through the tabs.
      canPop: _currentIndex == _dashboardTab && _tabHistory.isEmpty,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _onBackPressed();
      },
      child: Scaffold(
        // Swipe between tabs, with the violet edge-bulge effect.
        body: EdgeBulgePageView(
          controller: _pageController,
          onPageChanged: _onPageChanged,
          children: pages,
        ),
        bottomNavigationBar: BottomNavigationBar(
          type: BottomNavigationBarType.fixed,
          currentIndex: _currentIndex,
          iconSize: 22,
          selectedFontSize: 11,
          unselectedFontSize: 11,
          onTap: _onNavTap,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home_rounded),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.people_outline),
              label: 'Directory',
            ),
            BottomNavigationBarItem(
              icon: _ChatsTabIcon(),
              activeIcon: _ChatsTabIcon(active: true),
              label: 'Chats',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.info_outline_rounded),
              activeIcon: Icon(Icons.info_rounded),
              label: 'About Us',
            ),
          ],
        ),
      ),
    );
  }
}

/// Chats tab icon with the total unread count bubbled on its corner.
class _ChatsTabIcon extends StatelessWidget {
  /// Filled when the Chats tab is selected, like the Home tab's icon.
  final bool active;

  const _ChatsTabIcon({this.active = false});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder(
      valueListenable: UnreadService.counts,
      builder: (context, counts, _) => Stack(
        clipBehavior: Clip.none,
        children: [
          Icon(active ? Icons.forum : Icons.forum_outlined),
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

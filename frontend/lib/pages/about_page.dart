import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/leadership.dart';
import '../theme/app_theme.dart';
import '../utils/profession_images.dart';
import '../widgets/profile_avatar.dart';

/// "About Us" tab: what the network and app are for, and who leads it -
/// the Chief Professional Coordinator plus each group's Professional
/// Coordinator, Secretary and Principal Member, with tap-to-call.
class AboutPage extends StatelessWidget {
  const AboutPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('About Us')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
        children: [
          const _Intro(),
          const SizedBox(height: 16),
          const _LeadershipStrip(),
          const SizedBox(height: 16),
          const _ConcernsBanner(),
          const SizedBox(height: 20),
          const _Heading('Chief Professional Coordinator'),
          const SizedBox(height: 8),
          const _ChiefCard(),
          const SizedBox(height: 20),
          const _Heading('Professional Groups'),
          const SizedBox(height: 2),
          Text(
            'Tap a group to see its leaders',
            style: TextStyle(fontSize: 12, color: AppColors.textMuted),
          ),
          const SizedBox(height: 8),
          for (final group in Leadership.groups) _GroupCard(group: group),
        ],
      ),
    );
  }
}

class _Heading extends StatelessWidget {
  final String text;
  const _Heading(this.text);

  @override
  Widget build(BuildContext context) => Text(
    text,
    style: TextStyle(
      fontWeight: FontWeight.bold,
      fontSize: 15,
      color: AppColors.textDark,
    ),
  );
}

/// What the network is, opening the page.
class _Intro extends StatelessWidget {
  const _Intro();

  @override
  Widget build(BuildContext context) {
    return Text.rich(
      TextSpan(
        children: [
          const TextSpan(text: 'The '),
          TextSpan(
            text: 'Palace Professional Network (PPN)',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              color: AppColors.violetDark,
            ),
          ),
          const TextSpan(
            text:
                ' is an initiative of the International Palace Church '
                'leadership aimed at bringing together members with similar '
                'professions, skill sets, and trades to foster networking, '
                'collaboration, and mutual growth.',
          ),
        ],
      ),
      style: TextStyle(fontSize: 14.5, height: 1.5, color: AppColors.textDark),
    );
  }
}

/// "How the network is led": collapsed to one row until tapped, then one
/// line on the Chief Coordinator and the three group roles as chips. The
/// chips take turns showing their duty (with a progress bar on the active
/// one) until the user taps one, which then stays put.
class _LeadershipStrip extends StatefulWidget {
  const _LeadershipStrip();

  @override
  State<_LeadershipStrip> createState() => _LeadershipStripState();
}

class _LeadershipStripState extends State<_LeadershipStrip>
    with TickerProviderStateMixin {
  static const _roles = [
    (
      icon: Icons.star_rounded,
      label: 'Coordinator',
      title: Leadership.coordinatorRole,
      duty:
          'Leads the group, represents it before church leadership, and '
          'coordinates meetings and professional events.',
    ),
    (
      icon: Icons.edit_note_rounded,
      label: 'Secretary',
      title: Leadership.secretaryRole,
      duty:
          'Assists the Coordinator, keeps records and minutes, and manages '
          'communication and membership records.',
    ),
    (
      icon: Icons.handshake_outlined,
      label: 'Principal Member',
      title: Leadership.principalMemberRole,
      duty:
          "Handles the group's legwork: logistics, operations and other "
          'tasks.',
    ),
  ];

  int _selected = 0;
  bool _autoPlay = true;

  /// Collapsed by default so the leaders below are what people see first.
  bool _expanded = false;

  /// Time on each role while cycling; also drives the progress bar.
  late final AnimationController _cycle = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 4),
  )..addStatusListener(_onCycleDone);

  /// Chips slide and fade in one after another when the page opens.
  late final AnimationController _intro = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 700),
  );

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (MediaQuery.disableAnimationsOf(context)) {
      // Reduced motion: no cycling, no entrance.
      _autoPlay = false;
      _cycle.stop();
      _intro.value = 1;
    }
  }

  void _toggle() {
    setState(() => _expanded = !_expanded);
    if (!_expanded) {
      _cycle.stop();
    } else if (!MediaQuery.disableAnimationsOf(context)) {
      _intro.forward(from: 0);
      if (_autoPlay) _cycle.forward(from: 0);
    }
  }

  void _onCycleDone(AnimationStatus status) {
    if (status != AnimationStatus.completed || !_autoPlay) return;
    setState(() => _selected = (_selected + 1) % _roles.length);
    _cycle.forward(from: 0);
  }

  void _select(int index) {
    _cycle.stop();
    setState(() {
      _autoPlay = false;
      _selected = index;
    });
  }

  @override
  void dispose() {
    _cycle.dispose();
    _intro.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final role = _roles[_selected];
    return Card(
      margin: EdgeInsets.zero,
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          InkWell(
            onTap: _toggle,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(14, 12, 10, 12),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 17,
                    backgroundColor: AppColors.violet.withValues(alpha: 0.12),
                    child: const Icon(
                      Icons.account_tree_outlined,
                      size: 18,
                      color: AppColors.violet,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'How the network is led',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14.5,
                        color: AppColors.violetDark,
                      ),
                    ),
                  ),
                  AnimatedRotation(
                    turns: _expanded ? 0.5 : 0,
                    duration: const Duration(milliseconds: 250),
                    child: Icon(
                      Icons.keyboard_arrow_down_rounded,
                      color: AppColors.textMuted,
                    ),
                  ),
                ],
              ),
            ),
          ),
          AnimatedSize(
            duration: const Duration(milliseconds: 280),
            curve: Curves.easeOutCubic,
            alignment: Alignment.topCenter,
            child: !_expanded
                ? const SizedBox(width: double.infinity)
                : Padding(
                    padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'A Chief Professional Coordinator oversees all the groups. '
                          'Each group is led by:',
                          style: TextStyle(
                            fontSize: 12.5,
                            height: 1.35,
                            color: AppColors.textMuted,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            for (var i = 0; i < _roles.length; i++) ...[
                              if (i > 0) const SizedBox(width: 8),
                              Expanded(child: _entrance(i, _chip(i))),
                            ],
                          ],
                        ),
                        const SizedBox(height: 10),
                        AnimatedSize(
                          duration: const Duration(milliseconds: 250),
                          curve: Curves.easeOut,
                          alignment: Alignment.topLeft,
                          child: AnimatedSwitcher(
                            duration: const Duration(milliseconds: 300),
                            transitionBuilder: (child, animation) =>
                                FadeTransition(
                                  opacity: animation,
                                  child: SlideTransition(
                                    position: Tween(
                                      begin: const Offset(0.06, 0),
                                      end: Offset.zero,
                                    ).animate(animation),
                                    child: child,
                                  ),
                                ),
                            layoutBuilder: (current, previous) => Stack(
                              alignment: Alignment.topLeft,
                              children: [...previous, ?current],
                            ),
                            child: Text.rich(
                              key: ValueKey(_selected),
                              TextSpan(
                                children: [
                                  TextSpan(
                                    text: '${role.title}: ',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.textDark,
                                    ),
                                  ),
                                  TextSpan(text: role.duty),
                                ],
                              ),
                              style: TextStyle(
                                fontSize: 13,
                                height: 1.4,
                                color: AppColors.textMuted,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _entrance(int index, Widget child) {
    final curve = CurvedAnimation(
      parent: _intro,
      curve: Interval(index * 0.2, 0.6 + index * 0.2, curve: Curves.easeOut),
    );
    return FadeTransition(
      opacity: curve,
      child: SlideTransition(
        position: Tween(
          begin: const Offset(0, 0.3),
          end: Offset.zero,
        ).animate(curve),
        child: child,
      ),
    );
  }

  Widget _chip(int index) {
    final role = _roles[index];
    final selected = index == _selected;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => _select(index),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
          padding: const EdgeInsets.fromLTRB(6, 8, 6, 0),
          decoration: BoxDecoration(
            color: selected
                ? AppColors.violet.withValues(alpha: 0.14)
                : AppColors.background,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected ? AppColors.violet : AppColors.fieldBorder,
            ),
          ),
          child: Column(
            children: [
              AnimatedScale(
                scale: selected ? 1.15 : 1,
                duration: const Duration(milliseconds: 250),
                child: Icon(
                  role.icon,
                  size: 20,
                  color: selected ? AppColors.violet : AppColors.textMuted,
                ),
              ),
              const SizedBox(height: 4),
              // Shrinks rather than cuts off "Principal Member" on narrow
              // phones.
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  role.label,
                  maxLines: 1,
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                    color: selected
                        ? AppColors.violetDark
                        : AppColors.textMuted,
                  ),
                ),
              ),
              const SizedBox(height: 6),
              // Shows how long until the next role while cycling.
              SizedBox(
                height: 3,
                child: selected && _autoPlay
                    ? AnimatedBuilder(
                        animation: _cycle,
                        builder: (context, _) => ClipRRect(
                          borderRadius: BorderRadius.circular(2),
                          child: LinearProgressIndicator(
                            value: _cycle.value,
                            minHeight: 3,
                            backgroundColor: Colors.transparent,
                            color: AppColors.violet,
                          ),
                        ),
                      )
                    : null,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ConcernsBanner extends StatelessWidget {
  const _ConcernsBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: AppColors.heroGradient),
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Row(
        children: [
          Icon(Icons.support_agent_rounded, color: Colors.white, size: 28),
          SizedBox(width: 12),
          Expanded(
            child: Text(
              'Have a concern? Please reach out to the Professional '
              'Coordinator, Secretary or Principal Member of your group. '
              'Their contacts are listed below.',
              style: TextStyle(color: Colors.white, fontSize: 13, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }
}

class _ChiefCard extends StatelessWidget {
  const _ChiefCard();

  @override
  Widget build(BuildContext context) {
    const chief = Leadership.chiefCoordinator;
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // The section heading above already names the role.
            const _LeaderRow(
              leader: chief,
              avatarRadius: 26,
              showRole: false,
              singleLineName: true,
            ),
            const SizedBox(height: 10),
            Text(
              'Racheal oversees all the Professional Groups in IPC. She '
              'provides overall leadership, coordinates meetings and '
              'activities, represents the groups before church leadership, '
              'and organises the annual professional conference.',
              style: TextStyle(
                fontSize: 13,
                height: 1.4,
                color: AppColors.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GroupCard extends StatelessWidget {
  final ProfessionalGroup group;
  const _GroupCard({required this.group});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      clipBehavior: Clip.antiAlias,
      child: Theme(
        // Drop ExpansionTile's top/bottom divider lines inside the card.
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          childrenPadding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
          leading: ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: Image.asset(
              ProfessionImages.assetFor(group.name),
              width: 52,
              height: 52,
              fit: BoxFit.cover,
            ),
          ),
          title: Text(
            group.name,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 14,
              color: AppColors.textDark,
            ),
          ),
          subtitle: Text(
            group.coordinator.name,
            style: TextStyle(fontSize: 12, color: AppColors.violetDark),
          ),
          children: [
            for (final leader in group.leaders) ...[
              const Divider(height: 1),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: _LeaderRow(leader: leader),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Photo, name, role and number, with call / WhatsApp buttons when there is
/// a number. Tapping someone with a bio opens it.
class _LeaderRow extends StatelessWidget {
  final Leader leader;
  final double avatarRadius;
  final bool showRole;

  /// Keep the name on one line, shrinking it slightly if it doesn't fit.
  final bool singleLineName;

  const _LeaderRow({
    required this.leader,
    this.avatarRadius = 22,
    this.showRole = true,
    this.singleLineName = false,
  });

  @override
  Widget build(BuildContext context) {
    final phone = leader.phone;
    final row = Row(
      children: [
        _LeaderAvatar(leader: leader, radius: avatarRadius),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _name(),
              if (showRole)
                Text(
                  leader.role,
                  style: const TextStyle(fontSize: 12, color: AppColors.violet),
                ),
              if (phone != null)
                Text(
                  phone,
                  style: TextStyle(fontSize: 12, color: AppColors.textMuted),
                ),
              if (leader.bio != null)
                Text(
                  'Tap to read bio',
                  style: TextStyle(fontSize: 11, color: AppColors.textMuted),
                ),
            ],
          ),
        ),
        if (phone != null) ...[
          IconButton(
            tooltip: 'Call',
            icon: const Icon(Icons.call_outlined, color: AppColors.violet),
            onPressed: () =>
                _launch(context, Uri.parse('tel:${_dialable(phone)}')),
          ),
          IconButton(
            tooltip: 'WhatsApp',
            icon: const Icon(Icons.chat_outlined, color: Color(0xFF16A34A)),
            onPressed: () => _launch(
              context,
              Uri.parse('https://wa.me/${_international(phone)}'),
            ),
          ),
        ],
      ],
    );
    if (leader.bio == null) return row;
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () => _showBio(context, leader),
      child: row,
    );
  }

  Widget _name() {
    final text = Text(
      leader.name,
      maxLines: singleLineName ? 1 : null,
      softWrap: !singleLineName,
      style: TextStyle(
        fontWeight: FontWeight.w600,
        fontSize: 14,
        color: AppColors.textDark,
      ),
    );
    if (!singleLineName) return text;
    return FittedBox(
      fit: BoxFit.scaleDown,
      alignment: Alignment.centerLeft,
      child: text,
    );
  }

  /// Local Ghana numbers dial as written; anything else (e.g. an
  /// international number written without "+") gets a leading "+".
  static String _dialable(String phone) =>
      phone.startsWith('0') ? phone : '+$phone';

  /// wa.me wants the full international number without "+": Ghana
  /// numbers written as 0XXXXXXXXX become 233XXXXXXXXX.
  static String _international(String phone) =>
      phone.startsWith('0') ? '233${phone.substring(1)}' : phone;

  static Future<void> _launch(BuildContext context, Uri uri) async {
    final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!ok && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open this contact.')),
      );
    }
  }

  static void _showBio(BuildContext context, Leader leader) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      backgroundColor: AppColors.surface,
      // Sized to the bio itself (no empty space under short ones); long
      // bios stop at 90% of the screen and scroll.
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.9,
      ),
      builder: (ctx) => SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(child: _LeaderAvatar(leader: leader, radius: 48)),
              const SizedBox(height: 12),
              Text(
                leader.name,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                  color: AppColors.textDark,
                ),
              ),
              Text(
                leader.role,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.violet),
              ),
              const SizedBox(height: 16),
              Text(
                leader.bio!,
                style: TextStyle(
                  fontSize: 14,
                  height: 1.5,
                  color: AppColors.textDark,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LeaderAvatar extends StatelessWidget {
  final Leader leader;
  final double radius;
  const _LeaderAvatar({required this.leader, required this.radius});

  @override
  Widget build(BuildContext context) {
    final photo = leader.photoAsset;
    if (photo == null) {
      return ProfileAvatar(imageUrl: null, name: leader.name, radius: radius);
    }
    return CircleAvatar(
      radius: radius,
      backgroundColor: AppColors.background,
      // Portraits are taller than wide; bias the crop upwards to keep faces.
      child: ClipOval(
        child: Image.asset(
          photo,
          width: radius * 2,
          height: radius * 2,
          fit: BoxFit.cover,
          alignment: const Alignment(0, -0.6),
        ),
      ),
    );
  }
}

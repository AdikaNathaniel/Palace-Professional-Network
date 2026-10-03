import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/leadership.dart';
import '../theme/app_theme.dart';
import '../utils/profession_images.dart';
import '../widgets/ipc_logo.dart';
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
          const Center(child: IpcLogo(maxWidth: 180)),
          const SizedBox(height: 20),
          const _SectionCard(
            title: 'Palace Professional Network',
            children: [
              _Paragraph(
                'The Palace Professional Network (PPN) is an initiative of the '
                'leadership of International Palace Church (IPC). It brings '
                'together members with similar professions, skills and trades '
                'to foster networking, mentorship, collaboration and mutual '
                'growth.',
              ),
              SizedBox(height: 10),
              _Paragraph(
                'This app is the home of the network. Use it to find fellow '
                'professionals in the directory, browse by professional '
                'group, keep your biodata up to date, and chat with members '
                'and your group.',
              ),
            ],
          ),
          const SizedBox(height: 16),
          const _SectionCard(
            title: 'How the network is led',
            children: [
              _Paragraph(
                'A Chief Professional Coordinator oversees all the '
                'Professional Groups in IPC. Each group is in turn led by:',
              ),
              SizedBox(height: 10),
              _RoleLine(
                icon: Icons.star_rounded,
                role: Leadership.coordinatorRole,
                duty: 'Provides overall leadership, represents the group '
                    'before church leadership, and coordinates meetings and '
                    'professional events.',
              ),
              _RoleLine(
                icon: Icons.edit_note_rounded,
                role: Leadership.secretaryRole,
                duty: 'Assists the Coordinator, keeps records and minutes, '
                    'and manages communication and membership records.',
              ),
              _RoleLine(
                icon: Icons.handshake_outlined,
                role: Leadership.principalMemberRole,
                duty: 'Handles the legwork of the group: logistics, '
                    'operations and other tasks.',
              ),
            ],
          ),
          const SizedBox(height: 16),
          const _ConcernsBanner(),
          const SizedBox(height: 20),
          const _Heading('Chief Professional Coordinator'),
          const SizedBox(height: 8),
          const _ChiefCard(),
          const SizedBox(height: 20),
          const _Heading('Professional Groups'),
          const SizedBox(height: 2),
          const Text(
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
        style: const TextStyle(
          fontWeight: FontWeight.bold,
          fontSize: 15,
          color: AppColors.textDark,
        ),
      );
}

class _Paragraph extends StatelessWidget {
  final String text;
  const _Paragraph(this.text);

  @override
  Widget build(BuildContext context) => Text(
        text,
        style: const TextStyle(
          fontSize: 13.5,
          height: 1.45,
          color: AppColors.textDark,
        ),
      );
}

class _SectionCard extends StatelessWidget {
  final String title;
  final List<Widget> children;
  const _SectionCard({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
                color: AppColors.violetDark,
              ),
            ),
            const SizedBox(height: 10),
            ...children,
          ],
        ),
      ),
    );
  }
}

class _RoleLine extends StatelessWidget {
  final IconData icon;
  final String role;
  final String duty;
  const _RoleLine({required this.icon, required this.role, required this.duty});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor: AppColors.violet.withValues(alpha: 0.1),
            child: Icon(icon, size: 18, color: AppColors.violet),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text.rich(
              TextSpan(
                children: [
                  TextSpan(
                    text: '$role\n',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  TextSpan(
                    text: duty,
                    style: const TextStyle(color: AppColors.textMuted),
                  ),
                ],
              ),
              style: const TextStyle(fontSize: 13, height: 1.4),
            ),
          ),
        ],
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
            const _LeaderRow(leader: chief, avatarRadius: 26),
            const SizedBox(height: 10),
            const Text(
              'Oversees all the Professional Groups in IPC: provides overall '
              'leadership, coordinates meetings and activities, represents '
              'the groups before church leadership, and organises the annual '
              'professional conference.',
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
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 14,
              color: AppColors.textDark,
            ),
          ),
          subtitle: Text(
            group.coordinator.name,
            style: const TextStyle(fontSize: 12, color: AppColors.violetDark),
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
  const _LeaderRow({required this.leader, this.avatarRadius = 22});

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
              Text(
                leader.name,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                  color: AppColors.textDark,
                ),
              ),
              Text(
                leader.role,
                style: const TextStyle(fontSize: 12, color: AppColors.violet),
              ),
              if (phone != null)
                Text(
                  phone,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textMuted,
                  ),
                ),
              if (leader.bio != null)
                const Text(
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
            onPressed: () => _launch(context, Uri.parse('tel:${_dialable(phone)}')),
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
      backgroundColor: Colors.white,
      builder: (ctx) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.6,
        maxChildSize: 0.9,
        builder: (ctx, scrollController) => ListView(
          controller: scrollController,
          padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
          children: [
            Center(child: _LeaderAvatar(leader: leader, radius: 48)),
            const SizedBox(height: 12),
            Text(
              leader.name,
              textAlign: TextAlign.center,
              style: const TextStyle(
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
              style: const TextStyle(
                fontSize: 14,
                height: 1.5,
                color: AppColors.textDark,
              ),
            ),
          ],
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
      // Placeholder (e.g. the Chief, not yet announced) gets an icon rather
      // than initials of "To be announced".
      if (identical(leader, Leadership.chiefCoordinator)) {
        return CircleAvatar(
          radius: radius,
          backgroundColor: AppColors.violet.withValues(alpha: 0.12),
          child: Icon(Icons.person_outline, color: AppColors.violet, size: radius),
        );
      }
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

import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// The PPN Sunday presentation rebuilt as phone-sized pages (opened from the
/// Account page). Swipe or use the arrows to move between slides; each slide
/// scrolls on its own so none of its content is ever cut off.
class PresentationPage extends StatefulWidget {
  const PresentationPage({super.key});

  @override
  State<PresentationPage> createState() => _PresentationPageState();
}

typedef _Slide = ({
  String title,

  /// Small label above the title, e.g. the deck's "Operational Framework".
  String? kicker,

  /// Title and closing slides: no header, just the branded card.
  bool cover,
  List<Widget> Function() body,
});

TextStyle get _bodyStyle =>
    TextStyle(fontSize: 14.5, height: 1.45, color: AppColors.textDark);

class _PresentationPageState extends State<PresentationPage> {
  final _controller = PageController();
  int _index = 0;

  late final List<_Slide> _slides = _buildSlides();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _goTo(int index) {
    if (MediaQuery.disableAnimationsOf(context)) {
      _controller.jumpToPage(index);
    } else {
      _controller.animateToPage(
        index,
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeOutCubic,
      );
    }
  }

  void _showSlideList() {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.75,
      ),
      builder: (ctx) => SafeArea(
        child: ListView.builder(
          shrinkWrap: true,
          padding: const EdgeInsets.only(bottom: 12),
          itemCount: _slides.length,
          itemBuilder: (_, i) {
            final current = i == _index;
            return ListTile(
              dense: true,
              selected: current,
              selectedColor: AppColors.violetDark,
              leading: SizedBox(
                width: 28,
                child: Text(
                  '${i + 1}',
                  textAlign: TextAlign.right,
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: current ? AppColors.violet : AppColors.textMuted,
                  ),
                ),
              ),
              title: Text(
                _slides[i].title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: current ? FontWeight.w700 : FontWeight.w500,
                ),
              ),
              onTap: () {
                Navigator.of(ctx).pop();
                _goTo(i);
              },
            );
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final total = _slides.length;
    return Scaffold(
      appBar: AppBar(title: const Text('PPN Presentation')),
      body: Column(
        children: [
          Expanded(
            child: PageView.builder(
              controller: _controller,
              itemCount: total,
              onPageChanged: (i) => setState(() => _index = i),
              itemBuilder: (_, i) => _SlideView(slide: _slides[i]),
            ),
          ),
          DecoratedBox(
            decoration: BoxDecoration(
              color: AppColors.surface,
              border: Border(top: BorderSide(color: AppColors.fieldBorder)),
            ),
            child: SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                child: Row(
                  children: [
                    IconButton(
                      tooltip: 'Previous slide',
                      icon: const Icon(Icons.chevron_left_rounded, size: 30),
                      color: AppColors.violet,
                      onPressed: _index > 0 ? () => _goTo(_index - 1) : null,
                    ),
                    Expanded(
                      child: InkWell(
                        borderRadius: BorderRadius.circular(10),
                        onTap: _showSlideList,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 6,
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              // Shrinks rather than overflows with large
                              // system text on narrow phones.
                              FittedBox(
                                fit: BoxFit.scaleDown,
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      'Slide ${_index + 1} of $total',
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.textDark,
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    Icon(
                                      Icons.list_rounded,
                                      size: 18,
                                      color: AppColors.textMuted,
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 6),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(2),
                                child: LinearProgressIndicator(
                                  value: (_index + 1) / total,
                                  minHeight: 3,
                                  color: AppColors.violet,
                                  backgroundColor: AppColors.fieldBorder,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    IconButton(
                      tooltip: 'Next slide',
                      icon: const Icon(Icons.chevron_right_rounded, size: 30),
                      color: AppColors.violet,
                      onPressed: _index < total - 1
                          ? () => _goTo(_index + 1)
                          : null,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<_Slide> _buildSlides() => [
    (
      title: 'Palace Professional Network',
      kicker: null,
      cover: true,
      body: () => [
        const _CoverCard(
          title: 'Palace Professional Network',
          subtitle: 'International Palace Church',
        ),
        const SizedBox(height: 16),
        Text(
          'Swipe or tap › to begin',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 13, color: AppColors.textMuted),
        ),
      ],
    ),
    (
      title: 'Presentation Outline',
      kicker: 'Palace Professional Network',
      cover: false,
      body: () => [
        _Card(
          child: Column(
            children: [
              for (final (i, item) in const [
                ('Purpose', 2),
                ('Objectives', 2),
                ('Proposed Professional Network Groups', 4),
                ('Leadership Structure', 6),
                ('Operational Framework', 8),
                ('Expected Outcomes', 12),
              ].indexed)
                _OutlineRow(
                  number: i + 1,
                  label: item.$1,
                  onTap: () => _goTo(item.$2),
                ),
            ],
          ),
        ),
        const _Note('Tap a topic to go straight to it.'),
      ],
    ),
    (
      title: 'Background to Palace Professional Network',
      kicker: null,
      cover: false,
      body: () => [
        _Card(
          heading: 'Purpose',
          icon: Icons.flag_outlined,
          child: Text(
            'The Palace Professional Network (PPN) is an initiative of the '
            'church leadership aimed at bringing together members with similar '
            'professions, skill sets, and trades to foster networking, '
            'collaboration, and mutual growth.',
            style: _bodyStyle.copyWith(fontWeight: FontWeight.w500),
          ),
        ),
        const _Card(
          heading: 'Objectives',
          icon: Icons.track_changes_rounded,
          child: Column(
            children: [
              _IconLine(
                icon: Icons.hub_outlined,
                text: 'Facilitate Professional Networking',
              ),
              SizedBox(height: 14),
              _IconLine(
                icon: Icons.spa_outlined,
                text: 'Facilitate Professional Mentorship',
              ),
            ],
          ),
        ),
      ],
    ),
    (
      title: 'Scripture Reference',
      kicker: null,
      cover: false,
      body: () => [
        _Card(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(
                Icons.format_quote_rounded,
                size: 36,
                color: AppColors.violet,
              ),
              Text(
                '24 And God said, Let the earth bring forth the living creature '
                'after his kind, cattle, and creeping thing, and beast of the '
                'earth after his kind: and it was so.\n\n'
                '25 And God made the beast of the earth after his kind, and '
                'cattle after their kind, and everything that creepeth upon the '
                'earth after his kind: and God saw that it was good.',
                style: _bodyStyle.copyWith(
                  fontSize: 15.5,
                  height: 1.6,
                  fontStyle: FontStyle.italic,
                ),
              ),
              const SizedBox(height: 14),
              Align(
                alignment: Alignment.centerRight,
                child: Text(
                  'Genesis 1:24-25 (KJV)',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: AppColors.violetDark,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    ),
    (
      title: 'Proposed Professional Networks (1/2)',
      kicker: null,
      cover: false,
      body: () => [
        const _Card(
          heading: 'Professional Groups',
          icon: Icons.work_outline_rounded,
          child: _Bullets(numbered: true, [
            'Healthcare Professionals',
            'Teachers and Educators',
            'Lawyers and Legal Professionals',
            'Engineers and Architects',
            'Administrative Professionals',
            'Accountants and Financial Professionals',
            'ICT and Technology Professionals',
            'Media and Communication Professionals',
            'Non-Governmental Organisation Professionals',
            'Service Professionals',
            'Hospitality Professionals',
            'Businessmen/ Women (Artisans & Vendors) *',
          ]),
        ),
        const _Note('* Two subgroups within one Professional Group'),
      ],
    ),
    (
      title: 'Proposed Professional Networks (2/2)',
      kicker: null,
      cover: false,
      body: () => [
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Text(
            '* Businessmen/ Women (Artisans & Vendors)',
            style: _bodyStyle.copyWith(
              fontWeight: FontWeight.w700,
              color: AppColors.violetDark,
            ),
          ),
        ),
        const _Card(
          heading: 'Businessmen/ Women (Artisans)',
          icon: Icons.handyman_outlined,
          child: _Bullets(numbered: true, [
            'Carpenters',
            'Masons and Builders',
            'Electricians',
            'Plumbers',
            'Welders and Fabricators',
            'Tailors /Dressmakers/Fashion Designers',
            'Hairdressers and Barbers',
            'Farmers and Agribusiness Operators',
            'Mechanics and Auto Technicians',
            'Craftsmen and Craftswomen',
          ]),
        ),
        const _Card(
          heading: 'Businessmen/ Women (Vendors)',
          icon: Icons.storefront_outlined,
          child: _Bullets(numbered: true, [
            'Event Planners (Décor, Caterers, photographers, etc.)',
            'Beauty and Personal Care Service Providers',
            'Traders and Market Women/Men',
            'Retail Shop Owners',
            'Wholesalers and Distributors',
            'Street Vendors and Hawkers',
            'Transport Service Providers',
          ]),
        ),
      ],
    ),
    (
      title: 'PPN Structure in Church Organogram',
      kicker: null,
      cover: false,
      body: () => [
        const _Card(
          heading: 'Hierarchy',
          icon: Icons.account_tree_outlined,
          child: _Hierarchy(
            levels: [
              (icon: Icons.church_outlined, label: 'IPC Resident Pastor'),
              (
                icon: Icons.star_rounded,
                label: 'Chief Professional Coordinator',
              ),
              (icon: Icons.groups_2_outlined, label: 'Professional Coordinators'),
            ],
            branches: ['PPN-1', 'PPN-2', 'PPN-3', 'PPN-4'],
          ),
        ),
        const _Card(
          heading: 'Responsibilities',
          icon: Icons.assignment_outlined,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _SubHeading('Resident Pastor'),
              _Bullets([
                'Provides spiritual oversight.',
                "Ensures alignment with the church's vision and doctrine.",
                'Advises the sub-professional groups.',
              ]),
              SizedBox(height: 14),
              _SubHeading('Chief Professional Coordinator'),
              _Bullets([
                'Provides overall leadership of all the sub-professional groups.',
                'Coordinates meetings and activities.',
                'Represents the group before church leadership.',
                'Organises the annual professional conference or summit.',
                'Mandate is 1 (one) year rotational.',
              ]),
            ],
          ),
        ),
      ],
    ),
    (
      title: 'Leadership Structure for each PPN',
      kicker: null,
      cover: false,
      body: () => [
        const _Card(
          heading: 'PPN Internal Hierarchy',
          icon: Icons.account_tree_outlined,
          child: _Hierarchy(
            levels: [
              (icon: Icons.star_rounded, label: 'Professional Coordinator'),
              (icon: Icons.edit_note_rounded, label: 'Secretary'),
              (icon: Icons.handshake_outlined, label: 'Principal Member'),
              (icon: Icons.groups_2_outlined, label: 'Members'),
            ],
          ),
        ),
        const _Card(
          heading: 'Responsibilities',
          icon: Icons.assignment_outlined,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _SubHeading('Professional Coordinator'),
              _Bullets([
                'Provides overall leadership.',
                'Represents the group before church leadership.',
                'Coordinates meetings.',
                'Plans Professional events.',
              ]),
              SizedBox(height: 14),
              _SubHeading('Secretary'),
              _Bullets([
                'Assists the Professional Coordinator.',
                "Acts in the Professional Coordinator's absence.",
                'Plans meetings.',
                'Keeps records and minutes.',
                'Manages communication.',
                'Maintains membership records.',
              ]),
              SizedBox(height: 14),
              _SubHeading('The Principal Member'),
              _Bullets([
                'Plays the legwork of the group.',
                'Performs logistics, operations and any other task work for '
                    'the group.',
              ]),
            ],
          ),
        ),
      ],
    ),
    (
      title: 'Membership',
      kicker: 'Operational Framework',
      cover: false,
      body: () => [
        const _Card(
          heading: 'Membership shall be open to:',
          icon: Icons.how_to_reg_outlined,
          child: _Bullets(numbered: true, [
            'Church members.',
            'Individuals practising a recognised profession, trade or vocation.',
            'Tertiary students preparing for careers after school.',
            'Retired professionals willing to mentor others.',
          ]),
        ),
        const _Highlight(
          icon: Icons.info_outline_rounded,
          text: 'Members can belong to more than one professional grouping.',
        ),
      ],
    ),
    (
      title: 'Meetings and Core Activities',
      kicker: 'Operational Framework',
      cover: false,
      body: () => [
        _Card(
          heading: 'Frequency',
          icon: Icons.event_repeat_outlined,
          child: Text('Meetings once every quarter.', style: _bodyStyle),
        ),
        _Card(
          heading: 'Core Activities',
          icon: Icons.lightbulb_outline_rounded,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('The group may organize:', style: _bodyStyle),
              const SizedBox(height: 8),
              const _Bullets([
                'Career talks',
                'Skills workshops',
                'Certification awareness',
                'Industry updates',
                'Leadership training',
              ]),
            ],
          ),
        ),
      ],
    ),
    (
      title: 'Professional Services to the Church',
      kicker: 'Operational Framework',
      cover: false,
      body: () => [
        _Card(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Members shall use their professional expertise by:',
                style: _bodyStyle.copyWith(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 10),
              const _Bullets([
                'Advising church leadership',
                'Supporting infrastructure projects',
                'Providing legal, financial, educational, healthcare, media, '
                    'technology, and administrative services',
                'Supporting church strategic initiatives.',
                'Free health screening',
                'Partner with the church evangelism department to offer '
                    'professional services such as:',
              ]),
              const SizedBox(height: 8),
              const Padding(
                padding: EdgeInsets.only(left: 18),
                child: _Bullets(hollow: true, [
                  'Legal aid clinics',
                  'Financial literacy programs',
                  'Entrepreneurship training',
                  'Educational support',
                  'Technology training',
                  'Environmental initiatives',
                ]),
              ),
            ],
          ),
        ),
      ],
    ),
    (
      title: 'Reporting and Accountability',
      kicker: 'Operational Framework',
      cover: false,
      body: () => [
        _Card(
          heading: 'Reporting',
          icon: Icons.description_outlined,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Each Professional Group shall submit:',
                style: _bodyStyle.copyWith(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 10),
              const _Bullets(['An Annual report covering']),
              const SizedBox(height: 8),
              const Padding(
                padding: EdgeInsets.only(left: 18),
                child: _Bullets(numbered: true, [
                  'Programs and initiatives',
                  'Membership updates',
                ]),
              ),
              const SizedBox(height: 8),
              Text(
                'to the Resident pastor for the year under review.',
                style: _bodyStyle,
              ),
            ],
          ),
        ),
        _Card(
          heading: 'Accountability',
          icon: Icons.verified_user_outlined,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Each Professional Group shall:',
                style: _bodyStyle.copyWith(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 10),
              const _Bullets([
                "Operate in accordance with the church's constitution, "
                    'policies, and doctrinal beliefs.',
                'Remain accountable to the resident pastor.',
                "Avoid activities that conflict with the church's mission or "
                    'create divisions among members.',
                'Promote unity and collaboration with other ministries and '
                    'church departments.',
              ]),
            ],
          ),
        ),
      ],
    ),
    (
      title: 'Expected Outcomes',
      kicker: null,
      cover: false,
      body: () => [
        const _Card(
          child: _Bullets(numbered: true, spacing: 14, [
            'Enhance vocational skills, entrepreneurship, innovation, and '
                'career development through continuous learning and '
                'mentorship.',
            'Increase employment, apprenticeship, and business opportunities, '
                'particularly for young people.',
            "Strengthen the church's capacity by mobilising members' "
                'professional expertise, trades, and services for ministry, '
                'community development, and church growth.',
            'Develop ethical, servant-hearted leaders and promote Christian '
                'values in the workplace, business, and society.',
            'Strengthen unity, mutual support, member welfare, and economic '
                "resilience while advancing the church's vision and the "
                'Kingdom of God.',
          ]),
        ),
      ],
    ),
    (
      title: 'Thank You',
      kicker: null,
      cover: true,
      body: () => [
        const _CoverCard(
          title: 'Thank You',
          subtitle: 'Palace Professional Network',
        ),
        const SizedBox(height: 12),
        Center(
          child: TextButton.icon(
            onPressed: () => _goTo(0),
            icon: const Icon(Icons.replay_rounded),
            label: const Text('Back to the first slide'),
          ),
        ),
      ],
    ),
  ];
}

/// One slide: its header, then its content, scrolling if taller than the
/// screen.
class _SlideView extends StatelessWidget {
  final _Slide slide;
  const _SlideView({required this.slide});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 24),
      children: [
        if (slide.cover)
          const SizedBox(height: 24)
        else ...[
          if (slide.kicker != null)
            Text(
              slide.kicker!.toUpperCase(),
              style: const TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.8,
                color: AppColors.violet,
              ),
            ),
          Text(
            slide.title,
            style: TextStyle(
              fontSize: 21,
              height: 1.25,
              fontWeight: FontWeight.w800,
              color: AppColors.violetDark,
            ),
          ),
          const SizedBox(height: 16),
        ],
        ...slide.body(),
      ],
    );
  }
}

class _CoverCard extends StatelessWidget {
  final String title;
  final String subtitle;
  const _CoverCard({required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 32, 24, 36),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: AppColors.heroGradient,
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          Container(
            width: 180,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              // The logo is drawn for a white background in both themes.
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Image.asset(
              'assets/images/ipc_logo.png',
              fit: BoxFit.contain,
              semanticLabel: 'International Palace Church',
            ),
          ),
          const SizedBox(height: 28),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 28,
              height: 1.2,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Color(0xE6FFFFFF), fontSize: 15),
          ),
        ],
      ),
    );
  }
}

/// A content block on a slide, optionally with a tinted heading strip.
class _Card extends StatelessWidget {
  final String? heading;
  final IconData? icon;
  final Widget child;
  const _Card({this.heading, this.icon, required this.child});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (heading != null)
            Container(
              color: AppColors.violet.withValues(alpha: 0.10),
              padding: const EdgeInsets.fromLTRB(14, 10, 14, 10),
              child: Row(
                children: [
                  if (icon != null) ...[
                    Icon(icon, size: 19, color: AppColors.violet),
                    const SizedBox(width: 8),
                  ],
                  Expanded(
                    child: Text(
                      heading!,
                      style: TextStyle(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w700,
                        color: AppColors.violetDark,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          Padding(padding: const EdgeInsets.all(14), child: child),
        ],
      ),
    );
  }
}

class _SubHeading extends StatelessWidget {
  final String text;
  const _SubHeading(this.text);

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 6),
    child: Text(
      text,
      style: TextStyle(
        fontSize: 14.5,
        fontWeight: FontWeight.w700,
        color: AppColors.textDark,
      ),
    ),
  );
}

/// Bulleted or numbered list; [hollow] draws open circles for sub-items.
class _Bullets extends StatelessWidget {
  final List<String> items;
  final bool numbered;
  final bool hollow;
  final double spacing;

  const _Bullets(
    this.items, {
    this.numbered = false,
    this.hollow = false,
    this.spacing = 8,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final (i, item) in items.indexed)
          Padding(
            padding: EdgeInsets.only(top: i == 0 ? 0 : spacing),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: numbered ? 28 : 18,
                  child: numbered
                      ? Text(
                          '${i + 1}.',
                          style: _bodyStyle.copyWith(
                            fontWeight: FontWeight.w700,
                            color: AppColors.violetDark,
                          ),
                        )
                      : Padding(
                          // Centres the dot on the first line of text.
                          padding: const EdgeInsets.only(top: 8),
                          child: Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: hollow ? null : AppColors.violet,
                              border: hollow
                                  ? Border.all(color: AppColors.violet, width: 1.4)
                                  : null,
                            ),
                          ),
                        ),
                ),
                Expanded(child: Text(item, style: _bodyStyle)),
              ],
            ),
          ),
      ],
    );
  }
}

class _Note extends StatelessWidget {
  final String text;
  const _Note(this.text);

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 4),
    child: Text(
      text,
      style: TextStyle(
        fontSize: 13,
        fontStyle: FontStyle.italic,
        color: AppColors.textMuted,
      ),
    ),
  );
}

class _Highlight extends StatelessWidget {
  final IconData icon;
  final String text;
  const _Highlight({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: AppColors.heroGradient),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.white, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                height: 1.4,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _IconLine extends StatelessWidget {
  final IconData icon;
  final String text;
  const _IconLine({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        CircleAvatar(
          radius: 22,
          backgroundColor: AppColors.violet.withValues(alpha: 0.12),
          child: Icon(icon, color: AppColors.violet),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Text(
            text,
            style: _bodyStyle.copyWith(fontSize: 15, fontWeight: FontWeight.w700),
          ),
        ),
      ],
    );
  }
}

class _OutlineRow extends StatelessWidget {
  final int number;
  final String label;
  final VoidCallback onTap;
  const _OutlineRow({
    required this.number,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(10),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            CircleAvatar(
              radius: 14,
              backgroundColor: AppColors.violet.withValues(alpha: 0.12),
              child: Text(
                '$number',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.violet,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(child: Text(label, style: _bodyStyle)),
            Icon(Icons.chevron_right_rounded, color: AppColors.textMuted),
          ],
        ),
      ),
    );
  }
}

/// Top-down chart: one box per level joined by arrows, with optional groups
/// side by side underneath the last level.
class _Hierarchy extends StatelessWidget {
  final List<({IconData icon, String label})> levels;
  final List<String>? branches;
  const _Hierarchy({required this.levels, this.branches});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (final (i, level) in levels.indexed) ...[
          if (i > 0) const _DownArrow(),
          _box(level.icon, level.label),
        ],
        if (branches != null) ...[
          const _DownArrow(),
          Wrap(
            alignment: WrapAlignment.center,
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final b in branches!)
                Chip(
                  avatar: const Icon(
                    Icons.groups_rounded,
                    size: 18,
                    color: AppColors.violet,
                  ),
                  label: Text(b),
                  labelStyle: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: AppColors.violetDark,
                  ),
                  backgroundColor: AppColors.background,
                  side: BorderSide(color: AppColors.fieldBorder),
                ),
            ],
          ),
        ],
      ],
    );
  }

  Widget _box(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.violet, width: 1.2),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 20, color: AppColors.violet),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.textDark,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DownArrow extends StatelessWidget {
  const _DownArrow();

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 4),
    child: Icon(
      Icons.arrow_downward_rounded,
      size: 20,
      color: AppColors.textMuted,
    ),
  );
}

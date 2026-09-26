import 'package:flutter/material.dart';
import '../../models/chat_message.dart';
import '../../theme/app_theme.dart';

/// A poll inside a message bubble: tap options to vote (tapping your
/// choice again withdraws it), with live counts and percentage bars.
class PollCard extends StatelessWidget {
  final ChatPoll poll;
  final String myPhone;
  final bool isMine;
  final void Function(List<String> optionIds) onVote;
  final VoidCallback onViewVotes;

  const PollCard({
    super.key,
    required this.poll,
    required this.myPhone,
    required this.isMine,
    required this.onVote,
    required this.onViewVotes,
  });

  void _tap(String optionId) {
    final mine = poll.choicesOf(myPhone);
    if (poll.allowMultiple) {
      mine.contains(optionId) ? mine.remove(optionId) : mine.add(optionId);
      onVote(mine.toList());
    } else {
      onVote(mine.contains(optionId) ? [] : [optionId]);
    }
  }

  @override
  Widget build(BuildContext context) {
    final fg = isMine ? Colors.white : AppColors.textDark;
    final muted = isMine ? Colors.white70 : AppColors.textMuted;
    final accent = isMine ? Colors.white : AppColors.violet;
    final mine = poll.choicesOf(myPhone);
    final voters = poll.voterCount;

    return SizedBox(
      width: 250,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.poll_outlined, size: 18, color: accent),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  poll.question,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                    color: fg,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 2),
          Text(
            poll.allowMultiple ? 'Select one or more' : 'Select one',
            style: TextStyle(fontSize: 11.5, color: muted),
          ),
          const SizedBox(height: 8),
          for (final option in poll.options)
            InkWell(
              borderRadius: BorderRadius.circular(8),
              onTap: () => _tap(option.id),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 5),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          mine.contains(option.id)
                              ? (poll.allowMultiple
                                    ? Icons.check_box
                                    : Icons.radio_button_checked)
                              : (poll.allowMultiple
                                    ? Icons.check_box_outline_blank
                                    : Icons.radio_button_unchecked),
                          size: 20,
                          color: accent,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(option.text, style: TextStyle(color: fg)),
                        ),
                        Text(
                          '${option.voters.length}',
                          style: TextStyle(
                            color: muted,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Padding(
                      padding: const EdgeInsets.only(left: 28),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: voters == 0
                              ? 0
                              : option.voters.length / voters,
                          minHeight: 5,
                          backgroundColor: accent.withValues(alpha: 0.18),
                          valueColor: AlwaysStoppedAnimation(accent),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 4),
          Center(
            child: TextButton(
              onPressed: onViewVotes,
              style: TextButton.styleFrom(foregroundColor: accent),
              child: Text(
                voters == 1
                    ? 'View votes (1 person)'
                    : 'View votes ($voters people)',
              ),
            ),
          ),
        ],
      ),
    );
  }
}

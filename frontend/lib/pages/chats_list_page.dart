import 'package:flutter/material.dart';
import '../models/chat_message.dart';
import '../models/session.dart';
import '../services/api_service.dart';
import '../services/unread_service.dart';
import '../theme/app_theme.dart';
import '../utils/chat_rooms.dart';
import '../utils/profession_images.dart';
import '../widgets/profile_avatar.dart';
import '../widgets/unread_badge.dart';
import 'chat_page.dart';

class ChatsListPage extends StatefulWidget {
  final UserSession session;

  const ChatsListPage({super.key, required this.session});

  @override
  State<ChatsListPage> createState() => ChatsListPageState();
}

class ChatsListPageState extends State<ChatsListPage> {
  late Future<String?> _myCategoryFuture;
  late Future<List<DmRoomPreview>> _dmRoomsFuture;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    _myCategoryFuture = ApiService.fetchMine().then(
      (b) => b?.professionCategory,
    );
    _dmRoomsFuture = ApiService.fetchDmRooms();
  }

  void refresh() {
    setState(_load);
    UnreadService.refresh();
  }

  /// Opens a chat, then on return clears its badge and reloads the list so
  /// the previews and counts reflect what was just read.
  Future<void> _openChat(String roomId, ChatPage page) async {
    await Navigator.of(context).push(MaterialPageRoute(builder: (_) => page));
    if (!mounted) return;
    UnreadService.markRoomSeen(roomId);
    setState(_load);
  }

  void _openGroupChat(String category) {
    final roomId = ChatRooms.category(category);
    _openChat(
      roomId,
      ChatPage(
        session: widget.session,
        roomId: roomId,
        title: ProfessionImages.shortLabel(category),
        subtitle: 'Group chat for this profession',
      ),
    );
  }

  void _openDm(DmRoomPreview room) {
    _openChat(
      room.roomId,
      ChatPage(
        session: widget.session,
        roomId: room.roomId,
        title: room.otherName,
        imageUrl: room.otherImageUrl,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Chats')),
      body: RefreshIndicator(
        onRefresh: () async => refresh(),
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const Text(
              'Your Profession Group',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
            ),
            const SizedBox(height: 10),
            FutureBuilder<String?>(
              future: _myCategoryFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState != ConnectionState.done) {
                  return const Padding(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    child: Center(child: CircularProgressIndicator()),
                  );
                }
                final category = snapshot.data;
                if (category == null || category.isEmpty) {
                  return const Padding(
                    padding: EdgeInsets.symmetric(vertical: 12),
                    child: Text(
                      'Submit your biodata to join your profession\'s group chat.',
                      style: TextStyle(color: AppColors.textMuted),
                    ),
                  );
                }
                return _GroupChatTile(
                  category: category,
                  onTap: () => _openGroupChat(category),
                );
              },
            ),
            const SizedBox(height: 28),
            const Text(
              'Direct Messages',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
            ),
            const SizedBox(height: 4),
            const Text(
              'Message someone from their profile in the Directory to start a conversation.',
              style: TextStyle(fontSize: 12, color: AppColors.textMuted),
            ),
            const SizedBox(height: 10),
            FutureBuilder<List<DmRoomPreview>>(
              future: _dmRoomsFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState != ConnectionState.done) {
                  return const Padding(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    child: Center(child: CircularProgressIndicator()),
                  );
                }
                if (snapshot.hasError) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Text(
                      'Could not load conversations.\n${snapshot.error}',
                      style: const TextStyle(color: AppColors.textMuted),
                    ),
                  );
                }
                final rooms = snapshot.data ?? [];
                if (rooms.isEmpty) {
                  return const Padding(
                    padding: EdgeInsets.symmetric(vertical: 12),
                    child: Text(
                      'No conversations yet.',
                      style: TextStyle(color: AppColors.textMuted),
                    ),
                  );
                }
                return Column(
                  children: rooms
                      .map(
                        (room) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: _DmTile(
                            room: room,
                            onTap: () => _openDm(room),
                          ),
                        ),
                      )
                      .toList(),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _GroupChatTile extends StatelessWidget {
  final String category;
  final VoidCallback onTap;

  const _GroupChatTile({required this.category, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: AppColors.heroGradient,
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: AppColors.violet.withValues(alpha: 0.3),
                blurRadius: 14,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.22),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.groups, color: Colors.white),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      ProfessionImages.shortLabel(category),
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 2),
                    const Text(
                      'Chat with everyone in this profession',
                      style: TextStyle(fontSize: 12, color: Colors.white70),
                    ),
                  ],
                ),
              ),
              _RoomUnreadBadge(roomId: ChatRooms.category(category)),
              const SizedBox(width: 8),
              const Icon(
                Icons.arrow_forward_ios,
                size: 14,
                color: Colors.white,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DmTile extends StatelessWidget {
  final DmRoomPreview room;
  final VoidCallback onTap;

  const _DmTile({required this.room, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.fieldBorder),
          ),
          child: Row(
            children: [
              ProfileAvatar(
                imageUrl: room.otherImageUrl,
                name: room.otherName,
                radius: 22,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      room.otherName,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    if (room.lastMessage.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        room.lastMessage,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textMuted,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              _RoomUnreadBadge(roomId: room.roomId),
            ],
          ),
        ),
      ),
    );
  }
}

class _RoomUnreadBadge extends StatelessWidget {
  final String roomId;

  const _RoomUnreadBadge({required this.roomId});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder(
      valueListenable: UnreadService.counts,
      builder: (context, counts, _) =>
          UnreadBadge(count: counts.forRoom(roomId)),
    );
  }
}

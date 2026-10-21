import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useMyBiodata } from '@/hooks/queries';
import { categoryRoomId } from '@/lib/chat/rooms';
import { createChatSocket, type ChatSocket } from '@/lib/chat/socket';
import { queryClient, queryKeys } from '@/lib/query-client';
import { useSession } from '@/stores/session';

function refreshChats() {
  void queryClient.invalidateQueries({ queryKey: queryKeys.unread });
  void queryClient.invalidateQueries({ queryKey: queryKeys.dmRooms });
}

/**
 * The app-wide "something changed in your chats" socket, so the chats list
 * and unread badges update the moment a message arrives instead of on the
 * next poll. It never joins a room (each open chat has its own socket); the
 * server sends it `inbox` events for the member's DMs automatically and for
 * their profession group once it's watched.
 *
 * Connected while signed in and in the foreground; a new token (sign-out,
 * another account) always gets a fresh connection.
 */
export function useChatInbox() {
  const token = useSession((s) => s.session?.token);
  const category = useMyBiodata().data?.professionCategory;
  const socketRef = useRef<ChatSocket | null>(null);
  const categoryRef = useRef(category);

  useEffect(() => {
    const previous = categoryRef.current;
    categoryRef.current = category;
    const socket = socketRef.current;
    if (!category || !socket?.connected || category === previous) return;
    if (previous) {
      // The server only adds watched rooms, never removes them, so after a
      // profession change (biodata edited) start a fresh connection; its
      // connect handler watches just the new group.
      socket.disconnect();
      socket.connect();
    } else {
      socket.emit('watch', { roomIds: [categoryRoomId(category)] });
    }
  }, [category]);

  useEffect(() => {
    if (!token) return;

    const disconnect = () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };

    const connect = () => {
      if (socketRef.current?.connected) return;
      disconnect();
      const socket = createChatSocket(token);
      // Also runs after automatic reconnects, which start with no rooms.
      socket.on('connect', () => {
        const current = categoryRef.current;
        if (current) socket.emit('watch', { roomIds: [categoryRoomId(current)] });
      });
      socket.on('inbox', refreshChats);
      socket.connect();
      socketRef.current = socket;
    };

    connect();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        connect();
        // Catch up on anything that arrived while the app was away.
        refreshChats();
      } else if (state === 'background') {
        disconnect();
      }
    });

    return () => {
      subscription.remove();
      disconnect();
    };
  }, [token]);
}

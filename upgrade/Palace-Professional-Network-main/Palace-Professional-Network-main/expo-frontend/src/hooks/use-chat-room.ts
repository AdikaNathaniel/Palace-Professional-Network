import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useStore } from 'zustand';

import { useMyBiodata } from '@/hooks/queries';
import { ChatRoomController, type RoomState } from '@/lib/chat/chat-room';
import { getActiveChatRoom, setActiveChatRoom } from '@/lib/chat/navigation';
import { queryClient, queryKeys } from '@/lib/query-client';
import { useSession } from '@/stores/session';

/**
 * Connects to one chat room for as long as the screen is mounted. Only
 * rendered inside the signed-in stack, so there's always a session.
 */
export function useChatRoom(roomId: string) {
  const session = useSession((s) => s.session)!;
  const myName = useMyBiodata().data?.fullName;
  const [controller] = useState(
    () =>
      new ChatRoomController(roomId, {
        phone: session.phoneNumber,
        name: session.fullName || myName,
        token: session.token,
      }),
  );

  useEffect(() => {
    controller.start();
    return () => {
      controller.stop();
      // What was just read changes the badges and previews.
      void queryClient.invalidateQueries({ queryKey: queryKeys.unread });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dmRooms });
    };
  }, [controller]);

  useFocusEffect(
    useCallback(() => {
      controller.setFocused(true);
      setActiveChatRoom(controller.roomId);
      return () => {
        controller.setFocused(false);
        if (getActiveChatRoom() === controller.roomId) setActiveChatRoom(null);
      };
    }, [controller]),
  );

  return controller;
}

/** Subscribes to one slice of a room's state, so typing doesn't re-render the list. */
export function useRoomState<T>(controller: ChatRoomController, selector: (state: RoomState) => T) {
  return useStore(controller.store, selector);
}

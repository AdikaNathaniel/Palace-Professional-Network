import { useQuery } from '@tanstack/react-query';

import { biodataApi, chatApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query-client';

export function useBiodataOptions() {
  return useQuery({
    queryKey: queryKeys.biodataOptions,
    queryFn: biodataApi.options,
    // Form choices rarely change.
    staleTime: Infinity,
  });
}

export function useMyBiodata() {
  return useQuery({ queryKey: queryKeys.myBiodata, queryFn: biodataApi.mine });
}

export function useDirectory() {
  return useQuery({ queryKey: queryKeys.directory, queryFn: biodataApi.list });
}

export function useDmRooms() {
  return useQuery({ queryKey: queryKeys.dmRooms, queryFn: chatApi.dmRooms });
}

/**
 * Unread badges. Polled as a fallback; the inbox socket will invalidate
 * this immediately when a message arrives.
 */
export function useUnreadCounts() {
  return useQuery({
    queryKey: queryKeys.unread,
    queryFn: chatApi.unread,
    refetchInterval: 20_000,
  });
}

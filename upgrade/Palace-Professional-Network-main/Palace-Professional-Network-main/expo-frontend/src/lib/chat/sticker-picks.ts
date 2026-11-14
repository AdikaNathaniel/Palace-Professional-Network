import type { Sticker } from '@/lib/api/types';

export type StickerPick = { sticker: Sticker; isGif: boolean };

/**
 * The sticker picker is its own (sheet) route, so it hands the choice back
 * to the open chat screen through this, keyed by room.
 */
const listeners = new Map<string, (pick: StickerPick) => void>();

export function onStickerPicked(roomId: string, listener: (pick: StickerPick) => void) {
  listeners.set(roomId, listener);
  return () => {
    if (listeners.get(roomId) === listener) listeners.delete(roomId);
  };
}

export function pickSticker(roomId: string, pick: StickerPick) {
  listeners.get(roomId)?.(pick);
}

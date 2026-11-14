import * as Haptics from 'expo-haptics';

import type { IconName } from '@/components/ui/icon';
import { copyDetail, openContactUrl } from '@/lib/contact';
import { dialable, international, type Leader } from '@/lib/leadership';

export type LeaderAction = {
  name: 'call' | 'whatsapp' | 'copy';
  title: string;
  icon: IconName;
  onPress: () => void;
};

const FAILURE = 'Could not open this contact.';

function open(url: string) {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  void openContactUrl(url, FAILURE);
}

/** Call, WhatsApp and Copy Number, or nothing when no number was given. */
export function leaderActions(leader: Leader): LeaderAction[] {
  const phone = leader.phone;
  if (!phone) return [];
  return [
    {
      name: 'call',
      title: 'Call',
      icon: { ios: 'phone', android: 'call' },
      onPress: () => open(`tel:${dialable(phone)}`),
    },
    {
      name: 'whatsapp',
      title: 'WhatsApp',
      icon: { ios: 'message', android: 'chat' },
      onPress: () => open(`https://wa.me/${international(phone)}`),
    },
    {
      name: 'copy',
      title: 'Copy Number',
      icon: { ios: 'doc.on.doc', android: 'content_copy' },
      onPress: () => void copyDetail(phone, 'Phone number'),
    },
  ];
}

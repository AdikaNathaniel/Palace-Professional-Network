import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Linking } from 'react-native';
import { toast } from 'sonner-native';

/** Copies a member's detail and confirms it, e.g. `copyDetail(phone, 'Phone number')`. */
export async function copyDetail(text: string, what: string) {
  await Clipboard.setStringAsync(text);
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  toast.success(`${what} copied`);
}

/** Opens a tel: / mailto: link, or says so if the device can't (e.g. no phone app). */
export function openContactUrl(url: string) {
  return Linking.openURL(url).catch(() => toast.error('Couldn’t open that on this device.'));
}

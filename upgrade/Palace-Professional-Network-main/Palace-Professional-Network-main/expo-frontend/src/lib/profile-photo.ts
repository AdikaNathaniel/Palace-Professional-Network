import * as ImagePicker from 'expo-image-picker';
import { ActionSheetIOS, Alert, Linking, Platform } from 'react-native';
import { toast } from 'sonner-native';

import type { LocalFile } from '@/lib/api/types';

/** The server rejects profile photos over this size. */
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export type PhotoAction = 'camera' | 'library' | 'remove';

/**
 * Asks where the new profile photo should come from: a native action sheet
 * on iOS, an alert with the same choices on Android. `canRemove` adds a
 * destructive "Remove" option.
 */
export function choosePhotoAction(canRemove: boolean): Promise<PhotoAction | null> {
  const actions: { action: PhotoAction; label: string }[] = [
    { action: 'camera', label: 'Take Photo' },
    { action: 'library', label: 'Choose from Library' },
  ];
  if (canRemove) actions.push({ action: 'remove', label: 'Remove New Photo' });

  return new Promise((resolve) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...actions.map((a) => a.label), 'Cancel'],
          cancelButtonIndex: actions.length,
          destructiveButtonIndex: canRemove ? actions.length - 1 : undefined,
        },
        (index) => resolve(actions[index]?.action ?? null),
      );
      return;
    }
    Alert.alert(
      'Profile photo',
      undefined,
      [
        ...actions.map((a) => ({
          text: a.label,
          style: a.action === 'remove' ? ('destructive' as const) : ('default' as const),
          onPress: () => resolve(a.action),
        })),
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    );
  });
}

function offerSettings(title: string, message: string) {
  Alert.alert(title, message, [
    { text: 'Not Now', style: 'cancel' },
    { text: 'Open Settings', onPress: () => void Linking.openSettings() },
  ]);
}

/**
 * Takes or picks a square, compressed profile photo (Flutter used ~1000px
 * at 85% quality). Returns null if the member cancelled or access was denied.
 */
export async function pickProfilePhoto(source: 'camera' | 'library'): Promise<LocalFile | null> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      offerSettings('Camera Access Is Off', 'Allow camera access in Settings to take a profile photo.');
      return null;
    }
  } else if (Platform.OS === 'android') {
    // iOS's photo picker runs out of process and needs no permission.
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted && !permission.canAskAgain) {
      offerSettings('Photo Access Is Off', 'Allow photo access in Settings to choose a profile photo.');
      return null;
    }
  }

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    shape: 'oval',
    quality: 0.85,
  };
  let result: ImagePicker.ImagePickerResult;
  try {
    result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
  } catch {
    // e.g. no camera (the simulator) or the picker failed to open.
    toast.error(source === 'camera' ? 'Couldn’t open the camera' : 'Couldn’t open your photos');
    return null;
  }
  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return null;

  if (asset.fileSize && asset.fileSize > MAX_PHOTO_BYTES) {
    toast.error('That photo is too large', { description: 'Choose one under 5 MB.' });
    return null;
  }
  // The server only accepts JPG, PNG and WEBP (and checks the extension).
  const mimeType = asset.mimeType ?? 'image/jpeg';
  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  return {
    uri: asset.uri,
    name: `profile-${Date.now()}.${ext}`,
    mimeType: ext === 'jpg' ? 'image/jpeg' : mimeType,
  };
}

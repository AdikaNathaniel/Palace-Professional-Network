import { Text, View } from 'react-native';

import { LegalDocumentView } from '@/components/account/legal-document';
import { Button } from '@/components/ui/button';
import { openContactUrl } from '@/lib/contact';
import { deleteAccountMailto, deletionPolicy, PRIVACY_CONTACT_EMAIL } from '@/lib/legal';
import { useSession } from '@/stores/session';

/**
 * What deleting an account removes, and a button that starts the request.
 * There's no delete endpoint: an administrator deletes the account once the
 * emailed request is verified.
 */
export function DeleteAccountScreen() {
  const phoneNumber = useSession((s) => s.session?.phoneNumber);

  return (
    <LegalDocumentView document={deletionPolicy}>
      {phoneNumber ? (
        <View className="gap-2">
          <Button
            title="Email a Deletion Request"
            variant="destructive"
            accessibilityHint="Opens your email app with the request filled in. Nothing is deleted until we confirm it."
            onPress={() =>
              void openContactUrl(
                deleteAccountMailto(phoneNumber),
                'No email app is set up on this device. Please email us from another device.',
              )
            }
          />
          <Text className="px-1 text-center text-[13px] text-muted">
            {PRIVACY_CONTACT_EMAIL
              ? `Opens a draft to ${PRIVACY_CONTACT_EMAIL} with your phone number (${phoneNumber}). Your account stays active until we confirm the deletion.`
              : `Opens a draft with your phone number (${phoneNumber}). Your account stays active until we confirm the deletion.`}
          </Text>
        </View>
      ) : null}
    </LegalDocumentView>
  );
}

import { LegalDocumentView } from '@/components/account/legal-document';
import { privacyPolicy } from '@/lib/legal';

export default function PrivacyScreen() {
  return <LegalDocumentView document={privacyPolicy} />;
}

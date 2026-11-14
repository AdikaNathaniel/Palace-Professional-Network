/**
 * The privacy policy and account-deletion page, from privacy.md and
 * delete-account.md in the repo root. They aren't hosted anywhere yet, so the
 * app shows them itself; keep the two in step when either changes.
 */

/**
 * Where privacy and account-deletion requests go.
 * TODO: still "[insert privacy contact email]" in privacy.md and
 * delete-account.md. Until it's set, the deletion email opens with no
 * recipient and the pages say a contact address is coming.
 */
export const PRIVACY_CONTACT_EMAIL = '';

export const DELETE_ACCOUNT_SUBJECT = 'Delete my Palace Professional Network account';

/** A `mailto:` draft asking for deletion, with the account's phone number filled in. */
export function deleteAccountMailto(phoneNumber: string) {
  const body = [
    'Please delete my Palace Professional Network account and all of its data.',
    '',
    `Registered phone number: ${phoneNumber}`,
  ].join('\n');
  const query = `subject=${encodeURIComponent(DELETE_ACCOUNT_SUBJECT)}&body=${encodeURIComponent(body)}`;
  return `mailto:${PRIVACY_CONTACT_EMAIL}?${query}`;
}

const contactLine = PRIVACY_CONTACT_EMAIL
  ? `Email ${PRIVACY_CONTACT_EMAIL}.`
  : 'A contact email address will be published here soon.';

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LegalDocument = {
  intro: string;
  meta?: string;
  sections: LegalSection[];
};

export const deletionPolicy: LegalDocument = {
  intro:
    'You can ask for your Palace Professional Network account and all of its data to be deleted at any time, whether or not you still have the app installed.',
  sections: [
    {
      heading: 'What gets deleted',
      bullets: [
        'Your biodata: name, phone number, email, age range, gender, marital status, profession, place of work and profile photo',
        'Your login details (phone number and PIN hash)',
        'Every chat message you’ve sent, in direct messages and group chats',
        'Your membership of any group chat',
      ],
    },
    {
      heading: 'How to ask',
      paragraphs: [
        `Send an email from the app (it fills in the subject and your phone number), or write to us with the phone number your account is registered under and the subject “${DELETE_ACCOUNT_SUBJECT}”. ${contactLine}`,
        'We’ll verify the request, permanently delete your account and data within 7 business days, and reply to confirm once it’s done.',
      ],
    },
    {
      heading: 'After deletion',
      bullets: [
        'You no longer appear in the Professional Directory',
        'Your chat history is no longer visible to other members',
        'To rejoin the network, you’ll need to register a new account',
      ],
    },
  ],
};

export const privacyPolicy: LegalDocument = {
  meta: 'Effective 11 September 2026 · International Palace Church (IPC)',
  intro:
    'Palace Professional Network is a directory and mentorship app for professionals of the International Palace Church (IPC). This policy explains what the app collects when you register your biodata, how it’s used and who can see it.',
  sections: [
    {
      heading: 'Information we collect',
      paragraphs: ['When you register and complete your biodata, we collect:'],
      bullets: [
        'Full name (required): identifies you in the directory and chats',
        'Phone number (required): your login and how other members reach you',
        'Age range, gender and marital status (required): shown on your profile',
        'Profession and trade (required): places you in the right network and group chat',
        'Place of work (required): shown on your profile',
        'Email address (optional): an alternative contact on your profile',
        'Profile photo (optional): shown on your profile and directory card',
      ],
    },
    {
      heading: 'Your PIN and messages',
      paragraphs: [
        'You set a 4-digit PIN to sign in. We store a one-way hash of it, not the PIN itself, so we can’t see or recover it.',
        'If you use chat, we store the messages you send (direct messages and profession group chats), linked to your phone number and the person or group you sent them to.',
      ],
    },
    {
      heading: 'How we use it',
      paragraphs: ['Your information is used only to run the church’s professional network:'],
      bullets: [
        'Building the searchable directory of IPC professionals',
        'Matching you to your profession’s group chat',
        'Letting members message each other one to one',
        'Letting you update your own biodata as your details change',
      ],
    },
    {
      heading: 'We don’t sell or share it',
      paragraphs: [
        'We do not sell or share your information with third parties, and it isn’t used for anything outside the church’s professional fellowship.',
      ],
    },
    {
      heading: 'Who can see it',
      paragraphs: [
        'Your directory profile (name, photo, profession, place of work, phone number and email if you gave one) is visible to other signed-in members. It is not public on the internet.',
        'Direct messages are visible only to the other person. Group chat messages are visible to members of that profession’s group.',
      ],
    },
    {
      heading: 'Storage and security',
      paragraphs: [
        'Biodata and messages are stored in a managed cloud database (MongoDB Atlas); profile photos are stored on the app’s server. All traffic between the app and our servers is encrypted (HTTPS/WSS), and the directory and chats need you to sign in with your phone number and PIN.',
      ],
    },
    {
      heading: 'Keeping and deleting your data',
      paragraphs: [
        'We keep your biodata while you’re an active member, and you can update it yourself at any time. You can ask for a copy of your data, or for your account and biodata to be deleted, using the contact details below.',
      ],
    },
    {
      heading: 'Children',
      paragraphs: [
        'The app is for working professionals and isn’t directed at children under 13. We don’t knowingly collect information from children.',
      ],
    },
    {
      heading: 'Changes to this policy',
      paragraphs: [
        'If this policy changes, we’ll update the effective date at the top. Continuing to use the app after a change means you accept the updated policy.',
      ],
    },
    {
      heading: 'Contact us',
      paragraphs: [
        `For questions about this policy, or to update or delete your data, contact International Palace Church (IPC) about Palace Professional Network. ${contactLine}`,
      ],
    },
  ],
};

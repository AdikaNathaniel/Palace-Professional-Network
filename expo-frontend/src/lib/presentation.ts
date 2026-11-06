/**
 * The PPN Sunday presentation ("Palace Professional  Network-Sunday
 * Presentation 1.pptx" in the repo root), rebuilt as phone-sized slides.
 * Ported from the Flutter app's pages/presentation_page.dart; edit the
 * wording here, and the components in components/presentation/ draw it.
 */
import type { IconName } from '@/components/ui/icon';

export type SlideId =
  | 'cover'
  | 'outline'
  | 'background'
  | 'scripture'
  | 'networks-1'
  | 'networks-2'
  | 'organogram'
  | 'leadership'
  | 'membership'
  | 'meetings'
  | 'services'
  | 'reporting'
  | 'outcomes'
  | 'thanks';

export type BulletStyle = 'dot' | 'number' | 'hollow';

export type Block =
  /** The branded title card on the first and last slides. */
  | { kind: 'cover'; title: string; subtitle: string }
  /** A small centred line under the cover. */
  | { kind: 'hint'; text: string }
  /** A content block, optionally with a tinted heading strip. */
  | { kind: 'card'; heading?: string; icon?: IconName; blocks: Block[] }
  | { kind: 'text'; text: string; weight?: 'medium' | 'semibold' }
  /** A line in the accent colour, introducing what follows. */
  | { kind: 'lead'; text: string }
  | { kind: 'subheading'; text: string }
  /** `indent` nests the list under the item above it. */
  | { kind: 'bullets'; items: string[]; style?: BulletStyle; spacious?: boolean; indent?: boolean }
  /** Small italic print under a card. */
  | { kind: 'note'; text: string }
  /** A white-on-violet callout. */
  | { kind: 'highlight'; icon: IconName; text: string }
  | { kind: 'icon-lines'; lines: { icon: IconName; text: string }[] }
  | { kind: 'quote'; text: string; reference: string }
  /** Numbered topics that jump to their slide. */
  | { kind: 'outline'; items: { label: string; slide: SlideId }[] }
  /** Top-down chart: one box per level joined by arrows, with optional side-by-side branches. */
  | { kind: 'hierarchy'; levels: { icon: IconName; label: string }[]; branches?: string[] }
  /** A button to another slide, e.g. back to the start. */
  | { kind: 'jump'; label: string; icon: IconName; slide: SlideId };

export type Slide = {
  id: SlideId;
  title: string;
  /** Small label above the title, e.g. the deck's "Operational Framework". */
  kicker?: string;
  /** Title and closing slides: no header, just the branded card. */
  cover?: boolean;
  blocks: Block[];
};

const icons = {
  flag: { ios: 'flag', android: 'flag' },
  target: { ios: 'scope', android: 'track_changes' },
  hub: { ios: 'point.3.connected.trianglepath.dotted', android: 'hub' },
  sprout: { ios: 'leaf', android: 'spa' },
  work: { ios: 'briefcase', android: 'work' },
  handyman: { ios: 'hammer', android: 'handyman' },
  storefront: { ios: 'storefront', android: 'storefront' },
  tree: { ios: 'list.bullet.indent', android: 'account_tree' },
  church: { ios: 'building.columns', android: 'church' },
  star: { ios: 'star.fill', android: 'star' },
  groups: { ios: 'person.3', android: 'groups_2' },
  assignment: { ios: 'list.clipboard', android: 'assignment' },
  secretary: { ios: 'square.and.pencil', android: 'edit_note' },
  handshake: { ios: 'wrench.and.screwdriver', android: 'handshake' },
  register: { ios: 'person.badge.plus', android: 'how_to_reg' },
  info: { ios: 'info.circle', android: 'info' },
  repeat: { ios: 'calendar.badge.clock', android: 'event_repeat' },
  bulb: { ios: 'lightbulb', android: 'lightbulb' },
  description: { ios: 'doc.text', android: 'description' },
  verified: { ios: 'checkmark.shield', android: 'verified_user' },
  replay: { ios: 'arrow.counterclockwise', android: 'replay' },
} satisfies Record<string, IconName>;

export const SLIDES: Slide[] = [
  {
    id: 'cover',
    title: 'Palace Professional Network',
    cover: true,
    blocks: [
      { kind: 'cover', title: 'Palace Professional Network', subtitle: 'International Palace Church' },
      { kind: 'hint', text: 'Swipe or tap › to begin' },
    ],
  },
  {
    id: 'outline',
    title: 'Presentation Outline',
    kicker: 'Palace Professional Network',
    blocks: [
      {
        kind: 'card',
        blocks: [
          {
            kind: 'outline',
            items: [
              { label: 'Purpose', slide: 'background' },
              { label: 'Objectives', slide: 'background' },
              { label: 'Proposed Professional Network Groups', slide: 'networks-1' },
              { label: 'Leadership Structure', slide: 'organogram' },
              { label: 'Operational Framework', slide: 'membership' },
              { label: 'Expected Outcomes', slide: 'outcomes' },
            ],
          },
        ],
      },
      { kind: 'note', text: 'Tap a topic to go straight to it.' },
    ],
  },
  {
    id: 'background',
    title: 'Background to Palace Professional Network',
    blocks: [
      {
        kind: 'card',
        heading: 'Purpose',
        icon: icons.flag,
        blocks: [
          {
            kind: 'text',
            weight: 'medium',
            text:
              'The Palace Professional Network (PPN) is an initiative of the ' +
              'church leadership aimed at bringing together members with similar ' +
              'professions, skill sets, and trades to foster networking, ' +
              'collaboration, and mutual growth.',
          },
        ],
      },
      {
        kind: 'card',
        heading: 'Objectives',
        icon: icons.target,
        blocks: [
          {
            kind: 'icon-lines',
            lines: [
              { icon: icons.hub, text: 'Facilitate Professional Networking' },
              { icon: icons.sprout, text: 'Facilitate Professional Mentorship' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'scripture',
    title: 'Scripture Reference',
    blocks: [
      {
        kind: 'card',
        blocks: [
          {
            kind: 'quote',
            text:
              '24 And God said, Let the earth bring forth the living creature ' +
              'after his kind, cattle, and creeping thing, and beast of the ' +
              'earth after his kind: and it was so.\n\n' +
              '25 And God made the beast of the earth after his kind, and ' +
              'cattle after their kind, and everything that creepeth upon the ' +
              'earth after his kind: and God saw that it was good.',
            reference: 'Genesis 1:24-25 (KJV)',
          },
        ],
      },
    ],
  },
  {
    id: 'networks-1',
    title: 'Proposed Professional Networks (1/2)',
    blocks: [
      {
        kind: 'card',
        heading: 'Professional Groups',
        icon: icons.work,
        blocks: [
          {
            kind: 'bullets',
            style: 'number',
            items: [
              'Healthcare Professionals',
              'Teachers and Educators',
              'Lawyers and Legal Professionals',
              'Engineers and Architects',
              'Administrative Professionals',
              'Accountants and Financial Professionals',
              'ICT and Technology Professionals',
              'Media and Communication Professionals',
              'Non-Governmental Organisation Professionals',
              'Service Professionals',
              'Hospitality Professionals',
              'Businessmen/ Women (Artisans & Vendors) *',
            ],
          },
        ],
      },
      { kind: 'note', text: '* Two subgroups within one Professional Group' },
    ],
  },
  {
    id: 'networks-2',
    title: 'Proposed Professional Networks (2/2)',
    blocks: [
      { kind: 'lead', text: '* Businessmen/ Women (Artisans & Vendors)' },
      {
        kind: 'card',
        heading: 'Businessmen/ Women (Artisans)',
        icon: icons.handyman,
        blocks: [
          {
            kind: 'bullets',
            style: 'number',
            items: [
              'Carpenters',
              'Masons and Builders',
              'Electricians',
              'Plumbers',
              'Welders and Fabricators',
              'Tailors /Dressmakers/Fashion Designers',
              'Hairdressers and Barbers',
              'Farmers and Agribusiness Operators',
              'Mechanics and Auto Technicians',
              'Craftsmen and Craftswomen',
            ],
          },
        ],
      },
      {
        kind: 'card',
        heading: 'Businessmen/ Women (Vendors)',
        icon: icons.storefront,
        blocks: [
          {
            kind: 'bullets',
            style: 'number',
            items: [
              'Event Planners (Décor, Caterers, photographers, etc.)',
              'Beauty and Personal Care Service Providers',
              'Traders and Market Women/Men',
              'Retail Shop Owners',
              'Wholesalers and Distributors',
              'Street Vendors and Hawkers',
              'Transport Service Providers',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'organogram',
    title: 'PPN Structure in Church Organogram',
    blocks: [
      {
        kind: 'card',
        heading: 'Hierarchy',
        icon: icons.tree,
        blocks: [
          {
            kind: 'hierarchy',
            levels: [
              { icon: icons.church, label: 'IPC Resident Pastor' },
              { icon: icons.star, label: 'Chief Professional Coordinator' },
              { icon: icons.groups, label: 'Professional Coordinators' },
            ],
            branches: ['PPN-1', 'PPN-2', 'PPN-3', 'PPN-4'],
          },
        ],
      },
      {
        kind: 'card',
        heading: 'Responsibilities',
        icon: icons.assignment,
        blocks: [
          { kind: 'subheading', text: 'Resident Pastor' },
          {
            kind: 'bullets',
            items: [
              'Provides spiritual oversight.',
              "Ensures alignment with the church's vision and doctrine.",
              'Advises the sub-professional groups.',
            ],
          },
          { kind: 'subheading', text: 'Chief Professional Coordinator' },
          {
            kind: 'bullets',
            items: [
              'Provides overall leadership of all the sub-professional groups.',
              'Coordinates meetings and activities.',
              'Represents the group before church leadership.',
              'Organises the annual professional conference or summit.',
              'Mandate is 1 (one) year rotational.',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'leadership',
    title: 'Leadership Structure for each PPN',
    blocks: [
      {
        kind: 'card',
        heading: 'PPN Internal Hierarchy',
        icon: icons.tree,
        blocks: [
          {
            kind: 'hierarchy',
            levels: [
              { icon: icons.star, label: 'Professional Coordinator' },
              { icon: icons.secretary, label: 'Secretary' },
              { icon: icons.handshake, label: 'Principal Member' },
              { icon: icons.groups, label: 'Members' },
            ],
          },
        ],
      },
      {
        kind: 'card',
        heading: 'Responsibilities',
        icon: icons.assignment,
        blocks: [
          { kind: 'subheading', text: 'Professional Coordinator' },
          {
            kind: 'bullets',
            items: [
              'Provides overall leadership.',
              'Represents the group before church leadership.',
              'Coordinates meetings.',
              'Plans Professional events.',
            ],
          },
          { kind: 'subheading', text: 'Secretary' },
          {
            kind: 'bullets',
            items: [
              'Assists the Professional Coordinator.',
              "Acts in the Professional Coordinator's absence.",
              'Plans meetings.',
              'Keeps records and minutes.',
              'Manages communication.',
              'Maintains membership records.',
            ],
          },
          { kind: 'subheading', text: 'The Principal Member' },
          {
            kind: 'bullets',
            items: [
              'Plays the legwork of the group.',
              'Performs logistics, operations and any other task work for the group.',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'membership',
    title: 'Membership',
    kicker: 'Operational Framework',
    blocks: [
      {
        kind: 'card',
        heading: 'Membership shall be open to:',
        icon: icons.register,
        blocks: [
          {
            kind: 'bullets',
            style: 'number',
            items: [
              'Church members.',
              'Individuals practising a recognised profession, trade or vocation.',
              'Tertiary students preparing for careers after school.',
              'Retired professionals willing to mentor others.',
            ],
          },
        ],
      },
      {
        kind: 'highlight',
        icon: icons.info,
        text: 'Members can belong to more than one professional grouping.',
      },
    ],
  },
  {
    id: 'meetings',
    title: 'Meetings and Core Activities',
    kicker: 'Operational Framework',
    blocks: [
      {
        kind: 'card',
        heading: 'Frequency',
        icon: icons.repeat,
        blocks: [{ kind: 'text', text: 'Meetings once every quarter.' }],
      },
      {
        kind: 'card',
        heading: 'Core Activities',
        icon: icons.bulb,
        blocks: [
          { kind: 'text', text: 'The group may organize:' },
          {
            kind: 'bullets',
            items: [
              'Career talks',
              'Skills workshops',
              'Certification awareness',
              'Industry updates',
              'Leadership training',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'services',
    title: 'Professional Services to the Church',
    kicker: 'Operational Framework',
    blocks: [
      {
        kind: 'card',
        blocks: [
          { kind: 'text', weight: 'semibold', text: 'Members shall use their professional expertise by:' },
          {
            kind: 'bullets',
            items: [
              'Advising church leadership',
              'Supporting infrastructure projects',
              'Providing legal, financial, educational, healthcare, media, ' +
                'technology, and administrative services',
              'Supporting church strategic initiatives.',
              'Free health screening',
              'Partner with the church evangelism department to offer ' +
                'professional services such as:',
            ],
          },
          {
            kind: 'bullets',
            style: 'hollow',
            indent: true,
            items: [
              'Legal aid clinics',
              'Financial literacy programs',
              'Entrepreneurship training',
              'Educational support',
              'Technology training',
              'Environmental initiatives',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'reporting',
    title: 'Reporting and Accountability',
    kicker: 'Operational Framework',
    blocks: [
      {
        kind: 'card',
        heading: 'Reporting',
        icon: icons.description,
        blocks: [
          { kind: 'text', weight: 'semibold', text: 'Each Professional Group shall submit:' },
          { kind: 'bullets', items: ['An Annual report covering'] },
          {
            kind: 'bullets',
            style: 'number',
            indent: true,
            items: ['Programs and initiatives', 'Membership updates'],
          },
          { kind: 'text', text: 'to the Resident pastor for the year under review.' },
        ],
      },
      {
        kind: 'card',
        heading: 'Accountability',
        icon: icons.verified,
        blocks: [
          { kind: 'text', weight: 'semibold', text: 'Each Professional Group shall:' },
          {
            kind: 'bullets',
            items: [
              "Operate in accordance with the church's constitution, " +
                'policies, and doctrinal beliefs.',
              'Remain accountable to the resident pastor.',
              "Avoid activities that conflict with the church's mission or " +
                'create divisions among members.',
              'Promote unity and collaboration with other ministries and ' +
                'church departments.',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'outcomes',
    title: 'Expected Outcomes',
    blocks: [
      {
        kind: 'card',
        blocks: [
          {
            kind: 'bullets',
            style: 'number',
            spacious: true,
            items: [
              'Enhance vocational skills, entrepreneurship, innovation, and ' +
                'career development through continuous learning and ' +
                'mentorship.',
              'Increase employment, apprenticeship, and business opportunities, ' +
                'particularly for young people.',
              "Strengthen the church's capacity by mobilising members' " +
                'professional expertise, trades, and services for ministry, ' +
                'community development, and church growth.',
              'Develop ethical, servant-hearted leaders and promote Christian ' +
                'values in the workplace, business, and society.',
              'Strengthen unity, mutual support, member welfare, and economic ' +
                "resilience while advancing the church's vision and the " +
                'Kingdom of God.',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'thanks',
    title: 'Thank You',
    cover: true,
    blocks: [
      { kind: 'cover', title: 'Thank You', subtitle: 'Palace Professional Network' },
      { kind: 'jump', label: 'Back to the first slide', icon: icons.replay, slide: 'cover' },
    ],
  },
];

export function slideIndex(id: SlideId) {
  return SLIDES.findIndex((s) => s.id === id);
}

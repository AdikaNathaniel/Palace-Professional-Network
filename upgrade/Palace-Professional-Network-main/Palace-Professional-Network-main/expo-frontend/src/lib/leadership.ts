/**
 * Palace Professional Network leadership, taken from the "Leadership
 * Structure" block on each group tab of the PPN dashboard spreadsheet
 * (Leads/Palace Professional Network _ Dashboard - New.xlsx). Bios come from
 * Leads/Biography-Leads.docx. Ported from the Flutter app's
 * models/leadership.dart.
 */
import type { ImageSourcePropType } from 'react-native';

import { normalizeSearch } from '@/lib/directory';

export type Leader = {
  /** Stable key for the leader sheet's route, e.g. `ict-coordinator`. */
  id: string;
  name: string;
  role: string;
  /** As written in the spreadsheet; absent when no number was given. */
  phone?: string;
  photo?: ImageSourcePropType;
  bio?: string;
};

export type ProfessionalGroup = {
  /**
   * Matches the backend's profession category text closely enough for
   * `professionImage` to pick the group's illustration.
   */
  name: string;
  coordinator: Leader;
  secretary: Leader;
  principalMember: Leader;
};

export const COORDINATOR_ROLE = 'Professional Coordinator';
export const SECRETARY_ROLE = 'Secretary';
export const PRINCIPAL_MEMBER_ROLE = 'Principal Member';

const photos = {
  ebenezer: require('../../assets/images/leads/ebenezer.jpg'),
  ernest: require('../../assets/images/leads/ernest.jpg'),
  ethel: require('../../assets/images/leads/ethel.jpg'),
  evelyn: require('../../assets/images/leads/evelyn.jpg'),
  judith: require('../../assets/images/leads/judith.jpg'),
  kamal: require('../../assets/images/leads/kamal.jpg'),
  kenneth: require('../../assets/images/leads/kenneth.jpg'),
  priscilla: require('../../assets/images/leads/priscilla.jpg'),
  racheal: require('../../assets/images/leads/racheal.jpg'),
  rhodaline: require('../../assets/images/leads/rhodaline.jpg'),
  richard: require('../../assets/images/leads/richard.jpg'),
  shirley: require('../../assets/images/leads/shirley.jpg'),
} satisfies Record<string, ImageSourcePropType>;

const rachealBio =
  'Racheal is a dedicated healthcare professional and an advocate ' +
  'for maternal and child health, with specialized expertise in ' +
  'nursing, midwifery practice, and public health education. With a ' +
  'decade of hands-on experience in both small clinics and large, ' +
  'state-of-the-art health facilities, she brings a wealth of ' +
  'clinical knowledge and practical insight into maternal and ' +
  'reproductive health.\n\n' +
  'In 2023, she was nominated as the Outstanding Midwife at the ' +
  'Greater Accra Regional Hospital and received the Best Practicing ' +
  'Midwife Award for the Greater Accra Region during the ' +
  'International Day of Midwives. In 2024, she was honoured again as ' +
  'the Outstanding Midwife for the Neonatal Resuscitation Team at ' +
  'Greater Accra Regional Hospital, Ridge.';

/**
 * Head of the Professional Coordinators, who oversees all the groups.
 * Also the Healthcare Professionals group's coordinator.
 */
export const CHIEF_COORDINATOR: Leader = {
  id: 'chief',
  name: 'Mrs. Regina R. Matey',
  role: 'Chief Professional Coordinator',
  phone: '0278060762',
  photo: photos.racheal,
  bio: rachealBio,
};

/** What the Chief Professional Coordinator does, shown under her card. */
export const CHIEF_COORDINATOR_DUTIES =
  'Racheal oversees all the Professional Groups in IPC. She ' +
  'provides overall leadership, coordinates meetings and activities, ' +
  'represents the groups before church leadership, and organises the ' +
  'annual professional conference.';

type LeaderData = Omit<Leader, 'id' | 'role'>;

/** Builds a group, giving each leader its role and an id from `key`. */
function group(
  key: string,
  name: string,
  coordinator: LeaderData,
  secretary: LeaderData,
  principalMember: LeaderData,
): ProfessionalGroup {
  return {
    name,
    coordinator: { ...coordinator, id: `${key}-coordinator`, role: COORDINATOR_ROLE },
    secretary: { ...secretary, id: `${key}-secretary`, role: SECRETARY_ROLE },
    principalMember: { ...principalMember, id: `${key}-principal`, role: PRINCIPAL_MEMBER_ROLE },
  };
}

export const GROUPS: ProfessionalGroup[] = [
  group(
    'accounting',
    'Accountants and Financial Professionals',
    {
      name: 'Mr. Ernest Adu Owusu',
      phone: '0249065107',
      photo: photos.ernest,
      bio:
        'Ernest is a VP in charge of Strategy and Business Development, ' +
        'Global Markets at Black Star Group, a wholly owned Ghanaian ' +
        'Investment Banking firm.',
    },
    { name: 'Ms. Eyram Atsisey', phone: '0543704453' },
    { name: 'Ms. Bernadina Nti-Darko', phone: '0578751553' },
  ),
  group(
    'engineering',
    'Engineers and Architects',
    {
      name: 'Mr. Ebenezer Akyeampong',
      phone: '0246868510',
      photo: photos.ebenezer,
      bio:
        'Ebenezer Asante Akyeampong is an experienced Automobile Engineer, ' +
        'Fleet and Transport Management Professional, Maintenance and ' +
        'Reliability Practitioner, Logistician, and Certified Trainer with ' +
        'over 25 years of professional experience in automobile ' +
        'engineering, fleet operations, transportation management, ' +
        'logistics, maintenance, reliability, road safety, and driver ' +
        'development. He is the Managing Director of ASKBEN Fleet & ' +
        'Maintenance Consultancy.\n\n' +
        'Throughout his career, Ebenezer has worked with both local and ' +
        'multinational organizations, managing diverse vehicle fleets, ' +
        'transportation operations, workshops, maintenance programs, ' +
        'driver performance, fleet compliance, and logistics systems. His ' +
        'multidisciplinary background enables him to bridge the gap ' +
        'between vehicle engineering, fleet management, maintenance ' +
        'reliability, transport operations, logistics, and human ' +
        'performance.',
    },
    { name: 'Delali Mensah', phone: '0201932345' },
    { name: 'Mr. Kobby Woode', phone: '0244209330' },
  ),
  group(
    'legal',
    'Lawyers and Legal Professionals',
    {
      name: 'Ms. Evelyn Baffloe',
      phone: '0243065692',
      photo: photos.evelyn,
      bio:
        'Akweley is a Ghanaian-trained lawyer with nine years\' experience ' +
        'at the Bar and a proven track record in corporate and commercial ' +
        'practice. She is a Solicitor and Barrister of the Supreme Court ' +
        'of Ghana and an Associate at Fugar & Company, one of the leading ' +
        'law firms in the African region.\n\n' +
        'As a member of the firm\'s Corporate and Commercial Desk, she ' +
        'advises clients on complex and commercially significant matters. ' +
        'Her experience spans real estate, property acquisition, and ' +
        'related legal transactions.\n\n' +
        'Akweley holds a Barrister-at-Law Qualifying Certificate, a Master ' +
        'of Arts in Communications, a BSc in Business Administration ' +
        '(Management), a Bachelor of Laws (LL.B.), and a Diploma in ' +
        'Journalism. She is a member of the Ghana Bar Association, Ghana ' +
        'Journalists Association, and the Institute of Public Relations, ' +
        'Ghana.',
    },
    { name: 'Ms. Edinam Yaotse', phone: '0549451546' },
    { name: 'Mr. Benny Ato Sam', phone: '0245505814' },
  ),
  group(
    'teaching',
    'Teachers and Educators',
    {
      name: 'Mr. Richard Adika',
      phone: '0552598991',
      photo: photos.richard,
      bio:
        'Richard is an Educator with a degree in Earth Science (University ' +
        'of Ghana) and a Postgraduate Diploma in Education. Currently ' +
        'teaching at Palace Royal International School, focused on ' +
        'developing learners\' potential through sound educational ' +
        'practice.',
    },
    { name: 'Mrs. Agnes Anang', phone: '0555166228' },
    { name: 'Mr. Joshua Newman', phone: '0543535060' },
  ),
  group(
    'ngo',
    'Non-Governmental Organisation Professionals',
    {
      name: 'Mrs. Shirley Aseweh',
      phone: '0243553466',
      photo: photos.shirley,
      bio:
        'Shirley Aseweh is a dedicated and results-driven Procurement ' +
        'professional with experience in procurement coordination, ' +
        'supplier management, sourcing, contract administration, and ' +
        'compliance within the NGO sector. She is passionate about ethical ' +
        'and efficient procurement, cost savings, process improvement, and ' +
        'ensuring value for money.\n\n' +
        'Shirley holds an MSc in Procurement Management and the MCIPS ' +
        'professional qualification. Beyond her professional life, she is ' +
        'a family-oriented woman and an entrepreneur building her ' +
        'business, Graceful Handpicked. She values integrity, excellence, ' +
        'faith, meaningful relationships, and continuous personal growth.',
    },
    { name: 'Mr. Isaac Nyampong', phone: '0248307521' },
    { name: 'Mrs. Hanna-Belle Nyampong', phone: '0243302006' },
  ),
  group(
    'ict',
    'ICT and Technology Professionals',
    {
      name: 'Mrs. Priscilla Adu',
      phone: '0200023500',
      photo: photos.priscilla,
      bio:
        'Priscilla is a purposeful Christian, IT & Business Systems ' +
        'professional, and ministry enthusiast passionate about serving ' +
        'God and impacting people. She is passionate about young adult ' +
        'ministry, worship, dance, leadership, discipleship, and community ' +
        'transformation.\n\n' +
        'Professionally, she is passionate about technology, digital ' +
        'transformation, cloud computing, cybersecurity, and using ' +
        'innovative solutions to solve real-world problems. Her ultimate ' +
        'desire is to use her gifts, career, and ministry to empower ' +
        'others, inspire growth, and create meaningful impact.',
    },
    { name: 'Mr. Usi Peter' },
    { name: 'Mr. Edward Gyasi' },
  ),
  group(
    'service',
    'Service Professionals',
    {
      name: 'Mr. Kamal Matey',
      phone: '0208000580',
      photo: photos.kamal,
      bio:
        'Kamal A. Matey is a seasoned police officer who has been with the ' +
        'Ghana Police Service for more than a decade. He has served as ' +
        'Aide to the Former Inspector General of Police of the Republic of ' +
        'Ghana, and with the National Election Security Task Force HQ, the ' +
        'Accra Regional Legal Department, the National Operational ' +
        'Department HQ, the Welfare Department HQ, the Research & ' +
        'Monitoring Department, the Information Communication Department ' +
        'and the Project Department.',
    },
    { name: 'Mrs. Gloria N. Abayateye' },
    { name: 'Mr. Elvis Sefa', phone: '0206906401' },
  ),
  group(
    'healthcare',
    'Healthcare Professionals',
    { name: 'Mrs. Regina R. Matey', phone: '0278060762', photo: photos.racheal, bio: rachealBio },
    { name: 'Miss Doreen O. Annang', phone: '0554961198' },
    { name: 'Mrs. Sharon Aseweh', phone: '0246838091' },
  ),
  group(
    'media',
    'Media and Communication Professionals',
    {
      name: 'Mr. Kenneth Bray',
      phone: '0556521538',
      photo: photos.kenneth,
      bio:
        'Kenneth Bray is a Brand Communication and Digital Marketing ' +
        'professional with a keen interest in brand protection and the ' +
        'legal aspects of business and communication. As a Law student, ' +
        'he is passionate about understanding how law and strategic ' +
        'communication can work together to build, strengthen, and ' +
        'protect brands.\n\n' +
        'His interests span brand strategy, brand protection, digital ' +
        'marketing, strategic communication and intellectual property.',
    },
    { name: 'Ms. Jessica Adjei', phone: '057844778' },
    { name: 'Mr. Aaron Eshun', phone: '0543299219' },
  ),
  group(
    'administrative',
    'Administrative Professionals',
    {
      name: 'Mrs. Judith Sarfo',
      phone: '0246329166',
      photo: photos.judith,
      bio:
        'Judith is a dedicated and detail-oriented professional with ' +
        'extensive experience in administration, human resource ' +
        'management, and corporate governance. She currently serves as the ' +
        'Administrator and Acting Company Secretary at the Institute for ' +
        'Fiscal Studies (IFS), Ghana.\n\n' +
        'She holds an MBA in Marketing and a BSc in Marketing from the ' +
        'University of Professional Studies, Accra (UPSA), as well as a ' +
        'Diploma in Communication Studies from the Ghana Institute of ' +
        'Journalism (GIJ), and has completed the Senior Professional in ' +
        'Human Resources International (SPHRi) course.',
    },
    { name: 'Ms. Christiana Borlu', phone: '0504962042' },
    { name: 'Mrs. Sabina Wereko', phone: '0505558873' },
  ),
  group(
    'hospitality',
    'Hospitality Professionals',
    {
      name: 'Mrs. Rhodaline Sackah Pappoe',
      phone: '0544915700',
      photo: photos.rhodaline,
      bio:
        'Rhodaline is a dedicated hospitality professional with over 20 ' +
        'years\' experience in the industry, having served as Restaurant ' +
        'Manager, Conference and Banquet Manager, Operations Manager, and ' +
        'Food and Beverage Manager. She is also a small business owner, ' +
        'running a Gift Shop specializing in cosmetics and distinctive ' +
        'gifts, and is recognised by the Intercontinental Hotel Groups ' +
        '(IHG).\n\n' +
        'Rhodaline is a hardworking, client-centred and God-fearing woman ' +
        'who believes in service with humility and excellence.',
    },
    { name: 'Mrs. Sarah Michael', phone: '026507046' },
    { name: 'Mrs. Catherine Cofie', phone: '393249995538' },
  ),
  group(
    'business',
    'Businessmen and Women (Artisans & Vendors)',
    {
      name: 'Ms. Ethel Adjei',
      phone: '0244182352',
      photo: photos.ethel,
      bio:
        'Lady Ethel is the CEO of Emblish Enterprise, an entrepreneur ' +
        '(Beads/Resin Art designer, importer and merchant trader), a ' +
        'trainer and a pre-school facilitator.\n\n' +
        'She worked as a front desk personnel, sales personnel, ' +
        'administrative assistant, and P.A. to three CEOs for three ' +
        'companies in Ghana for 15 years, and volunteered with an NGO in ' +
        'its administrative sector while building her business. She is ' +
        'now managing her business full time, with over 400 members on ' +
        'her business platform.',
    },
    { name: 'Ms. Vanessa Yayra' },
    { name: 'Mrs. Mavis Blagogee', phone: '0543694433' },
  ),
];

export function groupLeaders(g: ProfessionalGroup): Leader[] {
  return [g.coordinator, g.secretary, g.principalMember];
}

/** The chief or a group leader, with the group they lead (none for the chief). */
export function findLeader(id: string): { leader: Leader; group?: ProfessionalGroup } | null {
  if (id === CHIEF_COORDINATOR.id) return { leader: CHIEF_COORDINATOR };
  for (const g of GROUPS) {
    const leader = groupLeaders(g).find((l) => l.id === id);
    if (leader) return { leader, group: g };
  }
  return null;
}

function matches(text: string, words: string[]) {
  const haystack = normalizeSearch(text);
  return words.every((w) => haystack.includes(w));
}

/**
 * Groups whose name or leaders (name or number) contain every word typed,
 * and whether the chief matches; everything when the query is empty.
 */
export function searchLeadership(query: string) {
  const words = normalizeSearch(query).split(' ').filter(Boolean);
  if (!words.length) return { chief: true, groups: GROUPS };
  const leaderText = (l: Leader) => `${l.name} ${l.phone ?? ''}`;
  return {
    chief: matches(`${leaderText(CHIEF_COORDINATOR)} ${CHIEF_COORDINATOR.role}`, words),
    groups: GROUPS.filter((g) => matches([g.name, ...groupLeaders(g).map(leaderText)].join(' '), words)),
  };
}

/**
 * Local Ghana numbers dial as written; anything else (e.g. an
 * international number written without "+") gets a leading "+".
 */
export function dialable(phone: string) {
  return phone.startsWith('0') ? phone : `+${phone}`;
}

/**
 * wa.me wants the full international number without "+": Ghana
 * numbers written as 0XXXXXXXXX become 233XXXXXXXXX.
 */
export function international(phone: string) {
  return phone.startsWith('0') ? `233${phone.slice(1)}` : phone;
}

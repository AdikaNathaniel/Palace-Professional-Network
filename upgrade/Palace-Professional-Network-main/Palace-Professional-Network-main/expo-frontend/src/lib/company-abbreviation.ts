/**
 * Shortens a member's place of work so it fits on a directory card, e.g.
 * "Palace Royal International School" -> "Palace Royal Int'l Sch." and
 * "Ghana Ports and Harbours Authority" -> "GPHA". The full name is still
 * shown on the member's profile page. Ported from the Flutter app's
 * utils/company_abbreviation.dart.
 */

/** Roughly one line of the card's place-of-work text. */
export const COMPANY_MAX_LENGTH = 24;

const WORDS: Record<string, string> = {
  international: "Int'l",
  limited: 'Ltd',
  company: 'Co.',
  assembly: 'Assy',
  authority: 'Auth.',
  hospital: 'Hosp.',
  school: 'Sch.',
  college: 'Coll.',
  education: 'Educ.',
  services: 'Svcs',
  service: 'Svc',
  regional: 'Reg.',
  management: 'Mgt',
  managers: 'Mgrs',
  national: "Nat'l",
  industrial: 'Ind.',
  commission: 'Comm.',
  programme: 'Prog.',
  development: "Dev't",
  centre: 'Ctr',
  center: 'Ctr',
  complex: 'Cplx',
  secretariat: 'Sec.',
  laboratory: 'Lab',
  medical: 'Med.',
  enterprise: 'Ent.',
  enterprises: 'Ent.',
  insurance: 'Ins.',
  engineering: 'Eng.',
  municipal: 'Mun.',
  university: 'Univ.',
  government: 'Govt',
  ministry: 'Min.',
  department: 'Dept',
  association: 'Assoc.',
  corporation: 'Corp.',
  technology: 'Tech.',
  foundation: 'Fdn',
  agency: 'Agcy',
  institute: 'Inst.',
  metropolitan: 'Metro.',
  district: 'Dist.',
  general: 'Gen.',
  advisory: 'Adv.',
  teaching: 'Tchg',
  and: '&',
};

const STOP_WORDS = new Set(['of', 'and', 'the', 'for', '&', 'at', 'in', 'on']);

/**
 * Words that mark a formal institution, whose initials are commonly used as
 * its name (GPHA, NSCS, SEC...). Without one, a name like "Daisies And
 * Details Nail Studio" is left readable rather than turned into "DDNS".
 */
const INSTITUTION_WORDS = new Set([
  'authority',
  'council',
  'commission',
  'programme',
  'program',
  'secretariat',
  'hospital',
  'assembly',
  'ministry',
  'agency',
  'board',
  'institute',
  'service',
  'services',
  'bank',
  'university',
  'college',
  'school',
  'corporation',
  'department',
]);

const isLetter = (c: string) => c.toLowerCase() !== c.toUpperCase();

export function shortenCompany(placeOfWork: string): string {
  let name = placeOfWork.trim().replace(/\s+/g, ' ');
  if (name.endsWith('.')) name = name.slice(0, -1);
  if (name.length <= COMPANY_MAX_LENGTH) return name;

  // Drop trailing detail: " - Cantonments", " / Remote", "(MLGCRA)", ", Ghana".
  let core = name.split(/\s+[-/]\s+|\s*\(/)[0]!.trim();
  core = core
    .replace(/,\s*\w+\.?$/, '')
    .trim()
    .replace(/[,.]+$/, '');
  // e.g. "Accra, (Itracco Gh. Ltd...)" - the part before "(" isn't the name.
  if (core.length < 8) core = name;
  if (core.length <= COMPANY_MAX_LENGTH) return core;

  const words = core.split(' ');
  const abbreviated = words.map((w) => WORDS[w.toLowerCase()] ?? w).join(' ');
  if (abbreviated.length <= COMPANY_MAX_LENGTH) return abbreviated;

  const significant = words.filter((w) => w && !STOP_WORDS.has(w.toLowerCase()));
  const isProperName = significant.every((w) => !isLetter(w[0]!) || w[0] === w[0]!.toUpperCase());
  const isInstitution = significant.some((w) => INSTITUTION_WORDS.has(w.toLowerCase()));
  if (significant.length >= 3 && isProperName && isInstitution) {
    return significant
      .filter((w) => isLetter(w[0]!))
      .map((w) => w[0]!.toUpperCase())
      .join('');
  }
  // Long free-text answers ("Around agbogba police station") stay as words;
  // the card wraps and ellipsizes them.
  return abbreviated;
}

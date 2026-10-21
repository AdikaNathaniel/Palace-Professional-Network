/** Members in this category also pick a specific trade or business type. */
const BUSINESS_CATEGORY_KEY = 'Businessmen and Women';

export function needsTrade(category: string | null | undefined) {
  return !!category?.includes(BUSINESS_CATEGORY_KEY);
}

type ProfessionFields = { professionCategory: string; professionSubCategory?: string | null };

/**
 * The member's trade, if their category has trades. The API skips empty
 * fields, so a trade saved under the business category stays on the record
 * after the member moves to another profession; it no longer applies.
 */
export function tradeOf(member: ProfessionFields) {
  return needsTrade(member.professionCategory) ? member.professionSubCategory || null : null;
}

/** What a member does, for subtitles: their trade if they have one, else their profession. */
export function professionLine(member: ProfessionFields) {
  return tradeOf(member) ?? member.professionCategory;
}

/** Options for a searchable picker, optionally under headings ("" for none). */
export type OptionGroup = { title: string; items: string[] };

/**
 * Every word typed must appear somewhere in the item or its heading, so
 * "civil eng" finds "Civil Engineer" and "bank teller" finds tellers listed
 * under finance.
 */
export function filterOptionGroups(groups: OptionGroup[], query: string): OptionGroup[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return groups;
  return groups
    .map((group) => ({
      title: group.title,
      items: group.items.filter((item) => {
        const haystack = `${item} ${group.title}`.toLowerCase();
        return words.every((w) => haystack.includes(w));
      }),
    }))
    .filter((group) => group.items.length > 0);
}

import type { ImageSourcePropType } from 'react-native';

/**
 * A profession category's illustration, matched on distinctive keywords
 * since the full category text is long and full of parentheticals. Ported
 * from the Flutter app's utils/profession_images.dart; the short label is
 * `professionShortLabel` in lib/chat/rooms.ts.
 */
const IMAGES: [keyword: string, image: ImageSourcePropType][] = [
  ['Healthcare', require('../../assets/images/professions/healthcare.jpg')],
  ['Engineers', require('../../assets/images/professions/engineers-architects.jpg')],
  ['Lawyers', require('../../assets/images/professions/legal.jpg')],
  ['Legal', require('../../assets/images/professions/legal.jpg')],
  ['ICT', require('../../assets/images/professions/ict.jpg')],
  ['Administrative', require('../../assets/images/professions/administrative.jpg')],
  ['Accountants', require('../../assets/images/professions/accounting.jpg')],
  ['Hospitality', require('../../assets/images/professions/hospitality.jpg')],
  ['Teachers', require('../../assets/images/professions/teachers-educators.jpg')],
  ['Service Professionals', require('../../assets/images/professions/service.jpg')],
  ['Media', require('../../assets/images/professions/media-communication.jpg')],
  ['Non-Governmental', require('../../assets/images/professions/ngo.jpg')],
  ['Businessmen', require('../../assets/images/professions/artisans-vendors.jpg')],
];

const FALLBACK: ImageSourcePropType = require('../../assets/images/professions/service.jpg');

export function professionImage(category: string): ImageSourcePropType {
  return IMAGES.find(([keyword]) => category.includes(keyword))?.[1] ?? FALLBACK;
}

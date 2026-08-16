import type { Biodata } from '../types/biodata';
import { resolveImageUrl } from '../api/config';

export default function BiodataCard({ entry }: { entry: Biodata }) {
  const imageUrl = resolveImageUrl(entry.imageUrl);
  const initial = entry.fullName.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className="biodata-card">
      <div className="biodata-card-avatar">
        {imageUrl ? <img src={imageUrl} alt={entry.fullName} /> : initial}
      </div>
      <div className="biodata-card-body">
        <p className="biodata-card-name">{entry.fullName}</p>
        <p className="biodata-card-role">
          {entry.professionSubCategory || entry.professionCategory}
        </p>
        <div className="biodata-card-meta">💼 {entry.placeOfWork}</div>
        {entry.phoneNumber && <div className="biodata-card-meta">📞 {entry.phoneNumber}</div>}
        {entry.email && <div className="biodata-card-meta">✉️ {entry.email}</div>}
      </div>
    </div>
  );
}

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { fetchAll } from '../api/apiService';
import type { Biodata } from '../types/biodata';
import BiodataCard from './BiodataCard';

export type DirectoryHandle = {
  refresh: () => void;
};

const Directory = forwardRef<DirectoryHandle>((_props, ref) => {
  const [entries, setEntries] = useState<Biodata[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const load = () => {
    setLoading(true);
    setError(null);
    fetchAll()
      .then(setEntries)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useImperativeHandle(ref, () => ({ refresh: load }));

  const filtered = useMemo(() => {
    if (!entries) return [];
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        e.professionCategory.toLowerCase().includes(q) ||
        (e.professionSubCategory ?? '').toLowerCase().includes(q) ||
        e.placeOfWork.toLowerCase().includes(q),
    );
  }, [entries, query]);

  return (
    <>
      <div className="page-heading">
        <h1>Professional Directory</h1>
        <p>Everyone who has submitted their biodata so far</p>
      </div>

      <input
        className="text-input directory-search"
        placeholder="Search by name, profession, or place of work"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          Loading directory…
        </div>
      )}

      {!loading && error && (
        <div className="error-state">
          Could not load the directory.
          <br />
          {error}
          <br />
          <button onClick={load}>Retry</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="empty-state">No professionals found yet.</div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="directory-list">
          {filtered.map((entry) => (
            <BiodataCard key={entry._id ?? entry.phoneNumber} entry={entry} />
          ))}
        </div>
      )}
    </>
  );
});

Directory.displayName = 'Directory';

export default Directory;

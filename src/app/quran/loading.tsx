export default function QuranLoading() {
  return (
    <div className="pb-10" aria-hidden="true">
      {/* Search */}
      <div className="skeleton rounded-2xl mb-8" style={{ height: '2.75rem' }} />

      {/* Section header */}
      <div className="skeleton rounded-md mb-5" style={{ width: '7rem', height: '1.1rem' }} />

      {/* Surah grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="skeleton rounded-2xl" style={{ height: '4.5rem' }} />
        ))}
      </div>
    </div>
  );
}

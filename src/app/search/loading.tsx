export default function SearchLoading() {
  return (
    <div className="pb-10 pt-4" aria-hidden="true">
      {/* Search bar */}
      <div className="skeleton rounded-2xl mb-8" style={{ height: '2.75rem' }} />

      {/* Filter chips */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton rounded-full shrink-0" style={{ width: '5rem', height: '2rem' }} />
        ))}
      </div>

      {/* Results */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton rounded-2xl" style={{ height: '4rem' }} />
        ))}
      </div>
    </div>
  );
}

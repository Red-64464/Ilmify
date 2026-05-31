export default function PrayerTimesLoading() {
  return (
    <div className="pb-10" aria-hidden="true">
      {/* Location card */}
      <div className="skeleton rounded-3xl mb-6" style={{ height: '8rem' }} />

      {/* Next prayer highlight */}
      <div className="skeleton rounded-2xl mb-8" style={{ height: '5rem' }} />

      {/* Prayer times list */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton rounded-2xl" style={{ height: '3.5rem' }} />
        ))}
      </div>
    </div>
  );
}

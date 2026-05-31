// Home page loading skeleton — shown instantly on first navigation
export default function HomeLoading() {
  return (
    <div className="space-y-10 py-6 pb-10" aria-hidden="true">
      {/* Hero */}
      <div
        className="skeleton rounded-3xl"
        style={{ height: '7rem' }}
      />

      {/* Search */}
      <div className="skeleton rounded-2xl" style={{ height: '2.75rem' }} />

      {/* Daily reminder */}
      <div className="skeleton rounded-2xl" style={{ height: '8rem' }} />

      {/* Stats grid */}
      <div>
        <div className="skeleton rounded-md mb-5" style={{ width: '6rem', height: '1.1rem' }} />
        <div className="grid grid-cols-3 gap-3">
          <div className="skeleton rounded-2xl" style={{ height: '6rem' }} />
          <div className="skeleton rounded-2xl" style={{ height: '6rem' }} />
          <div className="skeleton rounded-2xl" style={{ height: '6rem' }} />
        </div>
      </div>

      {/* Quick access */}
      <div>
        <div className="skeleton rounded-md mb-5" style={{ width: '7rem', height: '1.1rem' }} />
        <div className="grid grid-cols-2 gap-3">
          <div className="skeleton rounded-2xl" style={{ height: '5.5rem' }} />
          <div className="skeleton rounded-2xl" style={{ height: '5.5rem' }} />
          <div className="skeleton rounded-2xl" style={{ height: '5.5rem' }} />
          <div className="skeleton rounded-2xl" style={{ height: '5.5rem' }} />
        </div>
      </div>

      {/* Recent topics */}
      <div>
        <div className="skeleton rounded-md mb-5" style={{ width: '8rem', height: '1.1rem' }} />
        <div className="space-y-3">
          <div className="skeleton rounded-2xl" style={{ height: '3.5rem' }} />
          <div className="skeleton rounded-2xl" style={{ height: '3.5rem' }} />
          <div className="skeleton rounded-2xl" style={{ height: '3.5rem' }} />
        </div>
      </div>
    </div>
  );
}

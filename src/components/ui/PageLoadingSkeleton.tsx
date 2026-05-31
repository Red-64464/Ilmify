// Shared skeleton building blocks used by loading.tsx files across all routes.
// Renders with the global .skeleton CSS class (shimmer animation in globals.css).

export function SkeletonLine({ width = '100%', height = '1rem', className = '' }: {
  width?: string; height?: string; className?: string;
}) {
  return (
    <div
      className={`skeleton rounded-md ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ height = '5rem', className = '' }: {
  height?: string; className?: string;
}) {
  return (
    <div
      className={`skeleton rounded-2xl ${className}`}
      style={{ width: '100%', height }}
      aria-hidden="true"
    />
  );
}

export function SkeletonPageHeader() {
  return (
    <div
      className="sticky top-0 z-30 -mx-5 mb-8 px-5 py-5 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10"
      style={{
        background: 'rgba(6, 18, 15, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton rounded-md" style={{ width: '9rem', height: '1.5rem' }} aria-hidden="true" />
          <div className="skeleton rounded-md" style={{ width: '14rem', height: '0.875rem' }} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

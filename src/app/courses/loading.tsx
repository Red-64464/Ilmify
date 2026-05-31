import { SkeletonPageHeader } from '@/components/ui/PageLoadingSkeleton';

export default function CoursesLoading() {
  return (
    <div className="pb-10" aria-hidden="true">
      <SkeletonPageHeader />

      {/* Search */}
      <div className="skeleton rounded-2xl mb-8" style={{ height: '2.75rem' }} />

      {/* Folder cards */}
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="flex items-center gap-3 mb-3">
              <div className="skeleton rounded-lg" style={{ width: '1.5rem', height: '1.5rem' }} />
              <div className="skeleton rounded-md" style={{ width: '9rem', height: '1.2rem' }} />
            </div>
            <div className="space-y-2 ml-1 pl-5" style={{ borderLeft: '2px solid var(--border-subtle)' }}>
              <div className="skeleton rounded-2xl" style={{ height: '3.5rem' }} />
              <div className="skeleton rounded-2xl" style={{ height: '3.5rem' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { SkeletonPageHeader } from '@/components/ui/PageLoadingSkeleton';

export default function ExploreLoading() {
  return (
    <div className="pb-10" aria-hidden="true">
      <SkeletonPageHeader />

      {/* Search */}
      <div className="skeleton rounded-2xl mb-8" style={{ height: '2.75rem' }} />

      {/* Theme cards grid */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton rounded-2xl" style={{ height: '8rem' }} />
        ))}
      </div>
    </div>
  );
}

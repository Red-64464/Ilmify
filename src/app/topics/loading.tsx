import { SkeletonPageHeader } from '@/components/ui/PageLoadingSkeleton';

export default function TopicsLoading() {
  return (
    <div className="pb-10" aria-hidden="true">
      <SkeletonPageHeader />

      {/* Search */}
      <div className="skeleton rounded-2xl mb-8" style={{ height: '2.75rem' }} />

      {/* Topic cards */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton rounded-2xl" style={{ height: '4rem' }} />
        ))}
      </div>
    </div>
  );
}

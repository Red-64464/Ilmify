import { SkeletonPageHeader } from '@/components/ui/PageLoadingSkeleton';

export default function LibraryLoading() {
  return (
    <div className="pb-10" aria-hidden="true">
      <SkeletonPageHeader />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton rounded-full shrink-0" style={{ width: '5.5rem', height: '2rem' }} />
        ))}
      </div>

      {/* Book cards */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton rounded-2xl" style={{ height: '6rem' }} />
        ))}
      </div>
    </div>
  );
}

import { SkeletonPageHeader } from '@/components/ui/PageLoadingSkeleton';

export default function AdminLoading() {
  return (
    <div className="pb-10" aria-hidden="true">
      <SkeletonPageHeader />

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-8 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton rounded-2xl" style={{ height: '5rem' }} />
        ))}
      </div>

      {/* Tables */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton rounded-2xl" style={{ height: '4rem' }} />
        ))}
      </div>
    </div>
  );
}

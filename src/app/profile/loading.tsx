import { SkeletonPageHeader } from '@/components/ui/PageLoadingSkeleton';

export default function ProfileLoading() {
  return (
    <div className="pb-10" aria-hidden="true">
      <SkeletonPageHeader />

      {/* Avatar + info */}
      <div className="flex flex-col items-center gap-4 mb-10">
        <div className="skeleton rounded-full" style={{ width: '5rem', height: '5rem' }} />
        <div className="space-y-2 text-center">
          <div className="skeleton rounded-md mx-auto" style={{ width: '8rem', height: '1.4rem' }} />
          <div className="skeleton rounded-md mx-auto" style={{ width: '12rem', height: '1rem' }} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton rounded-2xl" style={{ height: '5.5rem' }} />
        ))}
      </div>

      {/* Settings sections */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton rounded-2xl" style={{ height: '3.5rem' }} />
        ))}
      </div>
    </div>
  );
}

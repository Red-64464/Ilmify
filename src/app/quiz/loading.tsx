import { SkeletonPageHeader } from '@/components/ui/PageLoadingSkeleton';

export default function QuizLoading() {
  return (
    <div className="pb-10" aria-hidden="true">
      <SkeletonPageHeader />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton rounded-2xl" style={{ height: '5.5rem' }} />
        ))}
      </div>

      {/* Quiz cards */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton rounded-2xl" style={{ height: '4.5rem' }} />
        ))}
      </div>
    </div>
  );
}

import { SkeletonPageHeader } from '@/components/ui/PageLoadingSkeleton';

export default function BookDetailLoading() {
  return (
    <div className="pb-10" aria-hidden="true">
      <SkeletonPageHeader />

      {/* Cover + info */}
      <div className="flex gap-5 mb-8">
        <div className="skeleton rounded-xl shrink-0" style={{ width: '5rem', height: '7rem' }} />
        <div className="flex-1 space-y-3 pt-1">
          <div className="skeleton rounded-md" style={{ width: '80%', height: '1.4rem' }} />
          <div className="skeleton rounded-md" style={{ width: '55%', height: '1rem' }} />
          <div className="skeleton rounded-full" style={{ width: '4rem', height: '1.5rem' }} />
          <div className="skeleton rounded-lg" style={{ width: '100%', height: '0.625rem' }} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-8">
        <div className="skeleton rounded-xl flex-1" style={{ height: '2.75rem' }} />
        <div className="skeleton rounded-xl" style={{ width: '2.75rem', height: '2.75rem' }} />
      </div>

      {/* Notes */}
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="skeleton rounded-2xl" style={{ height: '4rem' }} />
        ))}
      </div>
    </div>
  );
}

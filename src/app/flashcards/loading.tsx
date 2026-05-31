import { SkeletonPageHeader } from '@/components/ui/PageLoadingSkeleton';

export default function FlashcardsLoading() {
  return (
    <div className="pb-10" aria-hidden="true">
      <SkeletonPageHeader />

      {/* Deck cards */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton rounded-2xl" style={{ height: '5rem' }} />
        ))}
      </div>
    </div>
  );
}

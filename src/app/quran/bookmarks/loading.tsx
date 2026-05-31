import { SkeletonPageHeader } from '@/components/ui/PageLoadingSkeleton';

export default function QuranBookmarksLoading() {
  return (
    <div className="pb-10" aria-hidden="true">
      <SkeletonPageHeader />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton rounded-2xl" style={{ height: '4.5rem' }} />
        ))}
      </div>
    </div>
  );
}

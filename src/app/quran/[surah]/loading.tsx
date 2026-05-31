import { SkeletonPageHeader } from '@/components/ui/PageLoadingSkeleton';

export default function SurahLoading() {
  return (
    <div className="pb-10" aria-hidden="true">
      <SkeletonPageHeader />

      {/* Bismillah banner */}
      <div className="skeleton rounded-2xl mb-8" style={{ height: '4rem' }} />

      {/* Ayah cards */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton rounded-2xl" style={{ height: i % 2 === 0 ? '7rem' : '9rem' }} />
        ))}
      </div>
    </div>
  );
}

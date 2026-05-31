import { SkeletonPageHeader } from '@/components/ui/PageLoadingSkeleton';

export default function ThemeDetailLoading() {
  return (
    <div className="pb-10" aria-hidden="true">
      <SkeletonPageHeader />

      {/* Hero banner */}
      <div className="skeleton rounded-3xl mb-8" style={{ height: '10rem' }} />

      {/* Content blocks */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton rounded-2xl" style={{ height: '5rem' }} />
        ))}
      </div>
    </div>
  );
}

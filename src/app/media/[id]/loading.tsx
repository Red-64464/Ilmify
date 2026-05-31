import { SkeletonPageHeader } from '@/components/ui/PageLoadingSkeleton';

export default function MediaDetailLoading() {
  return (
    <div className="pb-10" aria-hidden="true">
      <SkeletonPageHeader />

      {/* Video player placeholder */}
      <div className="skeleton rounded-2xl mb-6" style={{ height: '14rem' }} />

      {/* Title + meta */}
      <div className="space-y-3 mb-6">
        <div className="skeleton rounded-md" style={{ width: '80%', height: '1.5rem' }} />
        <div className="skeleton rounded-md" style={{ width: '50%', height: '1rem' }} />
        <div className="flex gap-2">
          <div className="skeleton rounded-full" style={{ width: '4rem', height: '1.5rem' }} />
          <div className="skeleton rounded-full" style={{ width: '5rem', height: '1.5rem' }} />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <div className="skeleton rounded-md" style={{ width: '100%', height: '1rem' }} />
        <div className="skeleton rounded-md" style={{ width: '90%', height: '1rem' }} />
        <div className="skeleton rounded-md" style={{ width: '75%', height: '1rem' }} />
      </div>
    </div>
  );
}

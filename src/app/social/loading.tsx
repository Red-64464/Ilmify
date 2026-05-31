import { SkeletonPageHeader } from '@/components/ui/PageLoadingSkeleton';

export default function SocialLoading() {
  return (
    <div className="pb-10" aria-hidden="true">
      <SkeletonPageHeader />

      {/* Social post cards (9:16 aspect) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="skeleton rounded-2xl"
            style={{ aspectRatio: '9/16' }}
          />
        ))}
      </div>
    </div>
  );
}

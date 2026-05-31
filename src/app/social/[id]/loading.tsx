import { SkeletonPageHeader } from '@/components/ui/PageLoadingSkeleton';

export default function SocialPostLoading() {
  return (
    <div className="pb-10" aria-hidden="true">
      <SkeletonPageHeader />

      {/* Media */}
      <div className="skeleton rounded-2xl mb-6" style={{ aspectRatio: '9/16', maxHeight: '28rem' }} />

      {/* Caption */}
      <div className="space-y-2 mb-4">
        <div className="skeleton rounded-md" style={{ width: '100%', height: '1rem' }} />
        <div className="skeleton rounded-md" style={{ width: '85%', height: '1rem' }} />
        <div className="skeleton rounded-md" style={{ width: '60%', height: '1rem' }} />
      </div>

      {/* Tags */}
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton rounded-full" style={{ width: '4rem', height: '1.5rem' }} />
        ))}
      </div>
    </div>
  );
}

import { SkeletonPageHeader } from '@/components/ui/PageLoadingSkeleton';

export default function CourseDetailLoading() {
  return (
    <div className="pb-10" aria-hidden="true">
      <SkeletonPageHeader />

      {/* Title + meta */}
      <div className="mb-8 space-y-3">
        <div className="skeleton rounded-md" style={{ width: '70%', height: '1.75rem' }} />
        <div className="skeleton rounded-md" style={{ width: '50%', height: '1rem' }} />
        <div className="flex gap-2">
          <div className="skeleton rounded-full" style={{ width: '4rem', height: '1.5rem' }} />
          <div className="skeleton rounded-full" style={{ width: '5rem', height: '1.5rem' }} />
        </div>
      </div>

      {/* Content blocks */}
      <div className="space-y-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton rounded-2xl" style={{ height: i === 2 ? '8rem' : '4rem' }} />
        ))}
      </div>
    </div>
  );
}

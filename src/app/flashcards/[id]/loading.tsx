import { SkeletonPageHeader } from '@/components/ui/PageLoadingSkeleton';

export default function FlashcardStudyLoading() {
  return (
    <div className="pb-10" aria-hidden="true">
      <SkeletonPageHeader />

      {/* Progress bar */}
      <div className="skeleton rounded-full mb-6" style={{ width: '100%', height: '0.5rem' }} />

      {/* Flashcard */}
      <div className="skeleton rounded-3xl mb-8" style={{ height: '16rem' }} />

      {/* Answer buttons */}
      <div className="grid grid-cols-2 gap-3">
        <div className="skeleton rounded-2xl" style={{ height: '3.5rem' }} />
        <div className="skeleton rounded-2xl" style={{ height: '3.5rem' }} />
      </div>
    </div>
  );
}

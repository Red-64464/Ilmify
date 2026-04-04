export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-primary-700/40 rounded-xl animate-pulse ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-primary-800/60 border border-primary-700/40 rounded-2xl p-5 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    </div>
  );
}

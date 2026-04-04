export function IslamicPattern({ className = '', opacity = 0.03 }: { className?: string; opacity?: number }) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} style={{ opacity }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="islamic-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M30 0L60 30L30 60L0 30Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="30" cy="30" r="8" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <path d="M30 22L38 30L30 38L22 30Z" fill="none" stroke="currentColor" strokeWidth="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#islamic-pattern)" className="text-gold-400" />
      </svg>
    </div>
  );
}

export function IslamicDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 my-6 ${className}`}>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
      <svg width="16" height="16" viewBox="0 0 16 16" className="text-gold-500/40">
        <path d="M8 0L16 8L8 16L0 8Z" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="8" cy="8" r="2" fill="currentColor" />
      </svg>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
    </div>
  );
}

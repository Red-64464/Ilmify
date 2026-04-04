import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  href?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, href, action }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="text-lg font-semibold text-ivory-100 font-heading">{title}</h2>
        {subtitle && <p className="text-sm text-ivory-400 mt-0.5">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-sm text-gold-400 hover:text-gold-300 transition-colors font-medium">
          Voir tout
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
      {action}
    </div>
  );
}

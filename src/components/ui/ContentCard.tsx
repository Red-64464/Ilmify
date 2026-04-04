'use client';

import { Heart, BookOpen, Quote, Lightbulb, Bell, StickyNote } from 'lucide-react';
import { ContentBlock } from '@/types';
import { Card } from './Card';
import { Badge } from './Badge';

const typeConfig: Record<string, { label: string; color: string; badgeVariant: 'gold' | 'teal' | 'sage' | 'default'; icon: React.ReactNode }> = {
  verse: { label: 'Verset', color: 'border-l-ilm-gold', badgeVariant: 'gold', icon: <BookOpen className="w-3.5 h-3.5" /> },
  hadith: { label: 'Hadith', color: 'border-l-ilm-teal', badgeVariant: 'teal', icon: <Quote className="w-3.5 h-3.5" /> },
  quote: { label: 'Citation', color: 'border-l-ilm-sage', badgeVariant: 'sage', icon: <Quote className="w-3.5 h-3.5" /> },
  explanation: { label: 'Explication', color: 'border-l-ilm-cream', badgeVariant: 'default', icon: <Lightbulb className="w-3.5 h-3.5" /> },
  reminder: { label: 'Rappel', color: 'border-l-ilm-gold-light', badgeVariant: 'gold', icon: <Bell className="w-3.5 h-3.5" /> },
  note: { label: 'Note', color: 'border-l-ilm-info', badgeVariant: 'default', icon: <StickyNote className="w-3.5 h-3.5" /> },
};

interface ContentCardProps {
  content: ContentBlock;
}

export function ContentCard({ content }: ContentCardProps) {
  const config = typeConfig[content.type] || typeConfig.note;

  return (
    <Card className={`border-l-4 ${config.color}`}>
      <div className="flex items-start justify-between mb-2">
        <Badge variant={config.badgeVariant} size="sm">
          <span className="flex items-center gap-1">{config.icon} {config.label}</span>
        </Badge>
        <button className="text-ilm-sage hover:text-ilm-gold transition-colors">
          <Heart className={`w-4 h-4 ${content.isFavorite ? 'fill-ilm-gold text-ilm-gold' : ''}`} />
        </button>
      </div>
      {content.title && <h3 className="font-semibold text-ilm-ivory mb-2">{content.title}</h3>}
      <p className="text-sm text-ilm-cream/90 leading-relaxed mb-3">{content.content}</p>
      {(content.source || content.reference) && (
        <div className="text-xs text-ilm-sage mt-2 pt-2 border-t border-ilm-accent/10">
          {content.source && <span>{content.source}</span>}
          {content.source && content.reference && <span> — </span>}
          {content.reference && <span>{content.reference}</span>}
        </div>
      )}
    </Card>
  );
}

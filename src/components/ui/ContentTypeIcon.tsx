import { BookOpen, Quote, Lightbulb, Heart, MessageCircle, FileText, Shield } from 'lucide-react';

const typeConfig: Record<string, { icon: React.ReactNode; label: string; bg: string; textColor: string }> = {
  verse: { icon: <BookOpen className="w-4 h-4" />, label: 'Verset', bg: 'rgba(196,154,61,0.1)', textColor: '#d4ad4a' },
  hadith: { icon: <Quote className="w-4 h-4" />, label: 'Hadith', bg: 'rgba(18,163,147,0.1)', textColor: '#56e2cc' },
  explanation: { icon: <Lightbulb className="w-4 h-4" />, label: 'Explication', bg: 'rgba(245,158,11,0.08)', textColor: '#fbbf24' },
  reminder: { icon: <Heart className="w-4 h-4" />, label: 'Rappel', bg: 'rgba(244,63,94,0.08)', textColor: '#fb7185' },
  quote: { icon: <MessageCircle className="w-4 h-4" />, label: 'Citation', bg: 'rgba(139,92,246,0.08)', textColor: '#a78bfa' },
  note: { icon: <FileText className="w-4 h-4" />, label: 'Note', bg: 'rgba(59,130,246,0.08)', textColor: '#60a5fa' },
  proof: { icon: <Shield className="w-4 h-4" />, label: 'Preuve', bg: 'rgba(16,185,129,0.08)', textColor: '#34d399' },
};

interface ContentTypeIconProps {
  type: string;
  showLabel?: boolean;
  className?: string;
}

export function ContentTypeIcon({ type, showLabel = false, className = '' }: ContentTypeIconProps) {
  const config = typeConfig[type] || typeConfig.note;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${className}`}
      style={{ background: config.bg, color: config.textColor }}
    >
      {config.icon}
      {showLabel && <span className="text-xs font-medium">{config.label}</span>}
    </span>
  );
}

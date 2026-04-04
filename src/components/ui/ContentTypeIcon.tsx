import { BookOpen, Quote, Lightbulb, Heart, MessageCircle, FileText, Shield } from 'lucide-react';

const typeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  verse: { icon: <BookOpen className="w-4 h-4" />, label: 'Verset', color: 'text-gold-400 bg-gold-500/10' },
  hadith: { icon: <Quote className="w-4 h-4" />, label: 'Hadith', color: 'text-teal-400 bg-teal-500/10' },
  explanation: { icon: <Lightbulb className="w-4 h-4" />, label: 'Explication', color: 'text-amber-400 bg-amber-500/10' },
  reminder: { icon: <Heart className="w-4 h-4" />, label: 'Rappel', color: 'text-rose-400 bg-rose-500/10' },
  quote: { icon: <MessageCircle className="w-4 h-4" />, label: 'Citation', color: 'text-purple-400 bg-purple-500/10' },
  note: { icon: <FileText className="w-4 h-4" />, label: 'Note', color: 'text-blue-400 bg-blue-500/10' },
  proof: { icon: <Shield className="w-4 h-4" />, label: 'Preuve', color: 'text-emerald-400 bg-emerald-500/10' },
};

interface ContentTypeIconProps {
  type: string;
  showLabel?: boolean;
  className?: string;
}

export function ContentTypeIcon({ type, showLabel = false, className = '' }: ContentTypeIconProps) {
  const config = typeConfig[type] || typeConfig.note;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg ${config.color} ${className}`}>
      {config.icon}
      {showLabel && <span className="text-xs font-medium">{config.label}</span>}
    </span>
  );
}

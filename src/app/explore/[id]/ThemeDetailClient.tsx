'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, FileQuestion } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ContentTypeIcon } from '@/components/ui/ContentTypeIcon';
import EmptyState from '@/components/ui/EmptyState';
import { themes } from '@/data/themes';
import { contentItems } from '@/data/content';
import type { ContentItem } from '@/types';

const contentTypeTabs = [
  { id: 'all', label: 'Tout' },
  { id: 'verse', label: 'Versets' },
  { id: 'hadith', label: 'Hadiths' },
  { id: 'explanation', label: 'Explications' },
  { id: 'reminder', label: 'Rappels' },
  { id: 'note', label: 'Notes' },
  { id: 'proof', label: 'Preuves' },
];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

/* Visual treatment per content type */
const typeStyles: Record<string, { gradient: string; borderAccent: string }> = {
  verse: { gradient: 'linear-gradient(135deg, rgba(196,154,61,0.06), transparent)', borderAccent: 'rgba(196,154,61,0.1)' },
  hadith: { gradient: 'linear-gradient(135deg, rgba(18,163,147,0.05), transparent)', borderAccent: 'rgba(18,163,147,0.1)' },
  explanation: { gradient: 'linear-gradient(135deg, rgba(245,158,11,0.05), transparent)', borderAccent: 'rgba(245,158,11,0.08)' },
  reminder: { gradient: 'linear-gradient(135deg, rgba(244,63,94,0.04), transparent)', borderAccent: 'rgba(244,63,94,0.08)' },
  quote: { gradient: 'linear-gradient(135deg, rgba(139,92,246,0.04), transparent)', borderAccent: 'rgba(139,92,246,0.08)' },
  note: { gradient: 'linear-gradient(135deg, rgba(59,130,246,0.04), transparent)', borderAccent: 'rgba(59,130,246,0.08)' },
  proof: { gradient: 'linear-gradient(135deg, rgba(16,185,129,0.04), transparent)', borderAccent: 'rgba(16,185,129,0.08)' },
};

export default function ThemeDetailClient({ id }: { id: string }) {
  const [activeTab, setActiveTab] = useState('all');

  const theme = themes.find((t) => t.id === id);
  const items = contentItems.filter((c) => c.themeId === id);

  const filtered: ContentItem[] =
    activeTab === 'all' ? items : items.filter((c) => c.type === activeTab);

  if (!theme) {
    return (
      <div className="pb-10">
        <PageHeader title="Thème introuvable" backButton />
        <EmptyState
          icon={FileQuestion}
          title="Thème introuvable"
          description="Ce thème n'existe pas ou a été supprimé."
        />
      </div>
    );
  }

  return (
    <div className="pb-10">
      <PageHeader title={theme.title} subtitle={theme.titleAr} backButton />

      {/* Theme Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className="relative overflow-hidden rounded-2xl p-6 sm:p-7 mb-8"
          style={{
            background: `linear-gradient(135deg, ${theme.color}08, var(--bg-card) 50%, ${theme.color}04)`,
            boxShadow: 'var(--shadow-elevated)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {/* Ambient glow */}
          <div
            className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, ${theme.color}0c, transparent 70%)` }}
          />

          <div className="relative z-10">
            <div className="flex items-start gap-4 mb-5">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                style={{
                  background: `linear-gradient(135deg, ${theme.color}20, ${theme.color}0a)`,
                }}
              >
                <Star size={24} style={{ color: theme.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
                  {theme.title}
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {theme.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="default" size="sm">
                {theme.contentCount} contenus
              </Badge>
              {theme.progress !== undefined && (
                <div className="flex-1">
                  <ProgressBar
                    value={theme.progress}
                    showLabel
                    color={theme.color}
                    size="md"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="mb-6 overflow-x-auto scrollbar-none -mx-5 px-5">
        <Tabs tabs={contentTypeTabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Content List */}
      <motion.div
        className="space-y-4"
        variants={stagger}
        initial="hidden"
        animate="visible"
        key={activeTab}
      >
        {filtered.map((item) => {
          const style = typeStyles[item.type] || typeStyles.note;
          return (
            <motion.div key={item.id} variants={fadeUp}>
              <div
                className="rounded-2xl p-5 transition-all duration-200"
                style={{
                  background: style.gradient,
                  boxShadow: 'var(--shadow-card)',
                  border: `1px solid ${style.borderAccent}`,
                }}
              >
                <div className="flex items-start gap-3">
                  <ContentTypeIcon type={item.type} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold tracking-tight mb-1.5" style={{ color: 'var(--text-primary)' }}>
                      {item.title}
                    </h3>
                    {item.arabicText && (
                      <p className="text-base font-arabic text-right leading-[2] mb-3" style={{ color: '#d4ad4a' }}>
                        {item.arabicText}
                      </p>
                    )}
                    {item.contentAr && !item.arabicText && (
                      <p className="text-base font-arabic text-right leading-[2] mb-3" style={{ color: '#d4ad4a' }}>
                        {item.contentAr}
                      </p>
                    )}
                    <p className="text-sm line-clamp-4 leading-[1.8]" style={{ color: 'var(--text-secondary)' }}>
                      {item.content}
                    </p>
                    {item.source && (
                      <p className="text-xs mt-3 font-medium" style={{ color: '#2e9e8c' }}>
                        {item.source}
                      </p>
                    )}
                    {item.reference && (
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {item.reference}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {filtered.length === 0 && (
        <EmptyState
          icon={FileQuestion}
          title="Aucun contenu"
          description="Aucun contenu de ce type pour ce thème."
        />
      )}
    </div>
  );
}

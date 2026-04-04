'use client';

import { use, useState } from 'react';
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

export default function ThemeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState('all');

  const theme = themes.find((t) => t.id === id);
  const items = contentItems.filter((c) => c.themeId === id);

  const filtered: ContentItem[] =
    activeTab === 'all' ? items : items.filter((c) => c.type === activeTab);

  if (!theme) {
    return (
      <div className="pb-8">
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
    <div className="pb-8">
      <PageHeader title={theme.title} subtitle={theme.titleAr} backButton />

      {/* Theme Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card glowColor="green" className="p-5 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${theme.color}20` }}
            >
              <Star size={22} style={{ color: theme.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-ivory-200">{theme.title}</h2>
              <p className="text-sm text-ivory-400 mt-1">{theme.description}</p>
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
        </Card>
      </motion.div>

      {/* Tabs */}
      <div className="mb-4 overflow-x-auto">
        <Tabs tabs={contentTypeTabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Content List */}
      <div className="space-y-3">
        {filtered.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <ContentTypeIcon type={item.type} />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-ivory-200 mb-1">
                    {item.title}
                  </h3>
                  {item.arabicText && (
                    <p className="text-base text-gold-300 font-arabic text-right leading-loose mb-2">
                      {item.arabicText}
                    </p>
                  )}
                  {item.contentAr && !item.arabicText && (
                    <p className="text-base text-gold-300 font-arabic text-right leading-loose mb-2">
                      {item.contentAr}
                    </p>
                  )}
                  <p className="text-sm text-ivory-400 line-clamp-3">{item.content}</p>
                  {item.source && (
                    <p className="text-xs text-primary-400 mt-2">{item.source}</p>
                  )}
                  {item.reference && (
                    <p className="text-xs text-ivory-400 mt-1">{item.reference}</p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

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

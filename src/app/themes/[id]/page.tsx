'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Share2 } from 'lucide-react';
import { BookOpen, Star, Moon, Heart as HeartIcon, Sparkles, Shield, Hand, Users } from 'lucide-react';
import { themes, contentBlocks } from '@/data/mockData';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ContentCard } from '@/components/ui/ContentCard';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';

const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = { BookOpen, Star, Moon, Heart: HeartIcon, Sparkles, Shield, Hand, Users };

const contentTabs = [
  { id: 'all', label: 'Tous' },
  { id: 'verse', label: 'Versets' },
  { id: 'hadith', label: 'Hadiths' },
  { id: 'quote', label: 'Citations' },
  { id: 'explanation', label: 'Explications' },
  { id: 'reminder', label: 'Rappels' },
];

export default function ThemeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [activeTab, setActiveTab] = useState('all');

  const theme = themes.find(t => t.id === id);
  if (!theme) {
    return (
      <div className="p-4 md:p-8">
        <EmptyState icon={<BookOpen className="w-8 h-8" />} title="Thème non trouvé" description="Ce thème n'existe pas." />
      </div>
    );
  }

  const Icon = iconMap[theme.icon] || BookOpen;
  const blocks = contentBlocks.filter(c => c.themeId === id);
  const filtered = activeTab === 'all' ? blocks : blocks.filter(c => c.type === activeTab);
  const relatedThemes = themes.filter(t => t.id !== id).slice(0, 3);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/themes" className="inline-flex items-center gap-2 text-ilm-sage hover:text-ilm-ivory text-sm mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>

        <Card className="relative overflow-hidden mb-6">
          <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at top right, ${theme.color}, transparent 70%)` }} />
          <div className="relative flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${theme.color}25` }}>
              <Icon className="w-7 h-7" style={{ color: theme.color }} />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-ilm-ivory">{theme.title}</h1>
              <p className="text-sm text-ilm-sage mt-1">{theme.description}</p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {theme.tags.map(tag => <Badge key={tag} size="sm">{tag}</Badge>)}
                <Badge variant="teal" size="sm">{theme.contentCount} contenus</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="w-9 h-9 rounded-xl bg-ilm-accent/15 flex items-center justify-center text-ilm-sage hover:text-ilm-gold transition-colors">
                <Heart className="w-4 h-4" />
              </button>
              <button className="w-9 h-9 rounded-xl bg-ilm-accent/15 flex items-center justify-center text-ilm-sage hover:text-ilm-ivory transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Content */}
      <Tabs tabs={contentTabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="space-y-3 mt-4">
        {filtered.map((content, i) => (
          <motion.div key={content.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <ContentCard content={content} />
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <EmptyState icon={<BookOpen className="w-8 h-8" />} title="Aucun contenu" description={`Pas de contenu de type "${contentTabs.find(t => t.id === activeTab)?.label}" pour ce thème.`} />
        )}
      </div>

      {/* Related Themes */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-ilm-ivory mb-3">Thèmes liés</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {relatedThemes.map((t) => {
            const RIcon = iconMap[t.icon] || BookOpen;
            return (
              <Link href={`/themes/${t.id}`} key={t.id}>
                <Card hover className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${t.color}20` }}>
                    <RIcon className="w-5 h-5" style={{ color: t.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ilm-ivory truncate">{t.title}</p>
                    <p className="text-xs text-ilm-sage">{t.contentCount} contenus</p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

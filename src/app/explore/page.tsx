'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import SearchInput from '@/components/ui/SearchInput';
import Badge from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { themes } from '@/data/themes';

export default function ExplorePage() {
  const [search, setSearch] = useState('');

  const filtered = themes.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.tags?.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="pb-8">
      <PageHeader title="Explorer" subtitle="Parcourez les thèmes islamiques" />

      <div className="mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher un thème..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((theme, i) => (
          <motion.div
            key={theme.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Link href={`/explore/${theme.id}`}>
              <Card glowColor="green" className="p-5 h-full">
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${theme.color}20` }}
                  >
                    <Star size={20} style={{ color: theme.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-ivory-200 truncate">
                      {theme.title}
                    </h3>
                    {theme.titleAr && (
                      <p className="text-sm text-gold-400 font-arabic">{theme.titleAr}</p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-ivory-400 line-clamp-2 mb-3">
                  {theme.description}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="default" size="sm">
                    {theme.contentCount} contenus
                  </Badge>
                  {theme.progress !== undefined && theme.progress > 0 && (
                    <div className="flex-1 max-w-[120px]">
                      <ProgressBar
                        value={theme.progress}
                        showLabel
                        color={theme.color}
                      />
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <p className="text-ivory-400">Aucun thème trouvé pour &quot;{search}&quot;</p>
        </motion.div>
      )}
    </div>
  );
}

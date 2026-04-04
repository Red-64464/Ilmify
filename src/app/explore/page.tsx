'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import SearchInput from '@/components/ui/SearchInput';
import Badge from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { themes } from '@/data/themes';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

export default function ExplorePage() {
  const [search, setSearch] = useState('');

  const filtered = themes.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.tags?.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="pb-10">
      <PageHeader title="Explorer" subtitle="Parcourez les thèmes islamiques" />

      <div className="mb-8">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher un thème..."
        />
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        {filtered.map((theme) => (
          <motion.div key={theme.id} variants={fadeUp}>
            <Link href={`/explore/${theme.id}`}>
              <motion.div
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring' as const, stiffness: 300, damping: 25 }}
                className="relative overflow-hidden rounded-2xl p-5 sm:p-6 h-full transition-all duration-300"
                style={{
                  background: `linear-gradient(135deg, ${theme.color}08, var(--bg-card) 40%, ${theme.color}04)`,
                  boxShadow: 'var(--shadow-card)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {/* Ambient glow */}
                <div
                  className="absolute -top-12 -right-12 w-28 h-28 rounded-full pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${theme.color}10, transparent 70%)` }}
                />

                <div className="relative z-10">
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background: `linear-gradient(135deg, ${theme.color}18, ${theme.color}08)`,
                      }}
                    >
                      <Star size={20} style={{ color: theme.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
                        {theme.title}
                      </h3>
                      {theme.titleAr && (
                        <p className="text-sm font-arabic mt-0.5" style={{ color: '#d4ad4a' }}>
                          {theme.titleAr}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="text-sm line-clamp-2 mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
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
                </div>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <p style={{ color: 'var(--text-muted)' }}>Aucun thème trouvé pour &quot;{search}&quot;</p>
        </motion.div>
      )}
    </div>
  );
}

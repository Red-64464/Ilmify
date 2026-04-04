'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import { BookOpen, Star, Moon, Heart, Sparkles, Shield, Hand, Users } from 'lucide-react';
import { themes } from '@/data/mockData';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { Tabs } from '@/components/ui/Tabs';

const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = { BookOpen, Star, Moon, Heart, Sparkles, Shield, Hand, Users };

const filterTabs = [
  { id: 'all', label: 'Tous' },
  { id: 'Croyance', label: 'Croyance' },
  { id: 'Pratique', label: 'Pratique' },
  { id: 'Comportement', label: 'Comportement' },
  { id: 'Spiritualité', label: 'Spiritualité' },
];

export default function ThemesPage() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = themes.filter((t) => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === 'all' || t.tags.includes(activeFilter);
    return matchSearch && matchFilter;
  });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-ilm-teal/20 flex items-center justify-center">
            <Compass className="w-5 h-5 text-ilm-teal" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ilm-ivory">Explorer</h1>
            <p className="text-sm text-ilm-sage">Découvrez les thèmes du savoir islamique</p>
          </div>
        </div>
      </motion.div>

      <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un thème..." className="mb-4" />
      <Tabs tabs={filterTabs} activeTab={activeFilter} onChange={setActiveFilter} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {filtered.map((theme, i) => {
          const Icon = iconMap[theme.icon] || BookOpen;
          return (
            <motion.div key={theme.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link href={`/themes/${theme.id}`}>
                <Card hover className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 opacity-5" style={{ background: `radial-gradient(circle, ${theme.color}, transparent)` }} />
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${theme.color}20` }}>
                      <Icon className="w-6 h-6" style={{ color: theme.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-ilm-ivory">{theme.title}</h3>
                      <p className="text-sm text-ilm-sage mt-1 line-clamp-2">{theme.description}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="teal" size="sm">{theme.contentCount} contenus</Badge>
                        {theme.tags.map(tag => <Badge key={tag} size="sm">{tag}</Badge>)}
                      </div>
                      {theme.progress !== undefined && (
                        <div className="mt-3 h-1.5 bg-ilm-darkest rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${theme.progress}%`, background: theme.color }} />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-ilm-sage">
          <Compass className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Aucun thème trouvé</p>
        </div>
      )}
    </div>
  );
}

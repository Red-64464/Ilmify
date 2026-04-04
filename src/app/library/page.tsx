'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, Grid3X3, List, Search } from 'lucide-react';
import { books } from '@/data/mockData';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { Tabs } from '@/components/ui/Tabs';

const statusLabels: Record<string, string> = { to_read: 'À lire', reading: 'En cours', read: 'Lu' };
const statusVariants: Record<string, 'default' | 'gold' | 'teal' | 'sage'> = { to_read: 'sage', reading: 'gold', read: 'teal' };

const tabs = [
  { id: 'all', label: 'Tous' },
  { id: 'reading', label: 'En cours' },
  { id: 'to_read', label: 'À lire' },
  { id: 'read', label: 'Lus' },
];

export default function LibraryPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filtered = books.filter((b) => {
    const matchSearch = !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase());
    const matchTab = activeTab === 'all' || b.status === activeTab;
    return matchSearch && matchTab;
  });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-ilm-accent/30 flex items-center justify-center"><BookOpen className="w-5 h-5 text-ilm-gold" /></div>
          <div><h1 className="text-2xl font-bold text-ilm-ivory">Bibliothèque</h1><p className="text-sm text-ilm-sage">Votre collection personnelle</p></div>
        </div>
      </motion.div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Rechercher un livre..." /></div>
        <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="w-10 h-10 rounded-xl bg-ilm-card border border-ilm-accent/20 flex items-center justify-center text-ilm-sage hover:text-ilm-ivory transition-colors">
          {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
        </button>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4' : 'flex flex-col gap-3 mt-4'}>
        {filtered.map((book, i) => (
          <motion.div key={book.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link href={`/library/${book.id}`}>
              <Card hover className={viewMode === 'list' ? 'flex items-center gap-4' : ''}>
                <div className={viewMode === 'grid' ? 'aspect-[3/4] rounded-xl bg-gradient-to-br from-ilm-accent/40 to-ilm-dark flex items-center justify-center mb-3' : 'w-16 h-20 rounded-lg bg-gradient-to-br from-ilm-accent/40 to-ilm-dark flex items-center justify-center shrink-0'}>
                  <BookOpen className="w-8 h-8 text-ilm-gold/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-ilm-ivory text-sm truncate">{book.title}</h3>
                  <p className="text-xs text-ilm-sage truncate">{book.author}</p>
                  <div className="mt-2"><Badge variant={statusVariants[book.status]} size="sm">{statusLabels[book.status]}</Badge></div>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-ilm-sage"><Search className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>Aucun livre trouvé</p></div>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Heart, Tag } from 'lucide-react';
import { books, bookPassages } from '@/data/mockData';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

const statusLabels: Record<string, string> = { to_read: 'À lire', reading: 'En cours', read: 'Lu' };
const statusVariants: Record<string, 'default' | 'gold' | 'teal' | 'sage'> = { to_read: 'sage', reading: 'gold', read: 'teal' };

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const book = books.find(b => b.id === id);

  if (!book) {
    return <div className="p-4 md:p-8"><EmptyState icon={<BookOpen className="w-8 h-8" />} title="Livre non trouvé" /></div>;
  }

  const passages = bookPassages.filter(p => p.bookId === id);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/library" className="inline-flex items-center gap-2 text-ilm-sage hover:text-ilm-ivory text-sm mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>

        <Card className="mb-6">
          <div className="flex gap-4">
            <div className="w-24 h-32 md:w-32 md:h-44 rounded-xl bg-gradient-to-br from-ilm-accent/40 to-ilm-dark flex items-center justify-center shrink-0">
              <BookOpen className="w-10 h-10 text-ilm-gold/60" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-bold text-ilm-ivory">{book.title}</h1>
              <p className="text-sm text-ilm-sage mt-1">{book.author}</p>
              <Badge variant={statusVariants[book.status]} size="sm" className="mt-2">{statusLabels[book.status]}</Badge>
              <p className="text-sm text-ilm-cream/80 mt-3">{book.description}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge size="sm">{book.category}</Badge>
                <Badge size="sm">{book.language}</Badge>
                {book.tags.map(t => <Badge key={t} variant="sage" size="sm">{t}</Badge>)}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Passages */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ilm-ivory">Mes passages</h2>
          <Badge variant="teal" size="sm">{passages.length} passages</Badge>
        </div>

        {passages.length > 0 ? (
          <div className="space-y-3">
            {passages.map((passage, i) => (
              <motion.div key={passage.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="border-l-4 border-l-ilm-gold/50">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-ilm-ivory">{passage.title}</h3>
                    <button className="text-ilm-sage hover:text-ilm-gold transition-colors">
                      <Heart className={`w-4 h-4 ${passage.isFavorite ? 'fill-ilm-gold text-ilm-gold' : ''}`} />
                    </button>
                  </div>
                  <p className="text-sm text-ilm-cream/90 leading-relaxed mb-2">{passage.content}</p>
                  {passage.reflection && (
                    <div className="mt-2 p-3 rounded-xl bg-ilm-darkest/50 border-l-2 border-ilm-teal/30">
                      <p className="text-xs text-ilm-sage italic">{passage.reflection}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    {passage.page && <Badge size="sm">Page {passage.page}</Badge>}
                    {passage.tags.map(t => <Badge key={t} variant="sage" size="sm"><Tag className="w-2.5 h-2.5 mr-1" />{t}</Badge>)}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState icon={<BookOpen className="w-8 h-8" />} title="Aucun passage" description="Ajoutez des passages marquants de ce livre." />
        )}
      </div>
    </div>
  );
}

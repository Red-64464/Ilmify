'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Brain, Star, CheckCircle, AlertCircle, Play } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { quizQuestions } from '@/data/quiz';
import { themes } from '@/data/themes';

export default function QuizPage() {
  const stats = useMemo(() => {
    const total = quizQuestions.length;
    const mastered = quizQuestions.filter((q) => q.masteryLevel >= 80).length;
    const toReview = quizQuestions.filter((q) => q.masteryLevel < 50).length;
    return { total, mastered, toReview };
  }, []);

  const themeGroups = useMemo(() => {
    const groups: Record<string, number> = {};
    quizQuestions.forEach((q) => {
      groups[q.themeId] = (groups[q.themeId] || 0) + 1;
    });
    return Object.entries(groups).map(([themeId, count]) => {
      const theme = themes.find((t) => t.id === themeId);
      return { themeId, count, theme };
    });
  }, []);

  return (
    <div className="pb-10">
      <PageHeader
        title="Quiz"
        subtitle="Testez vos connaissances"
        rightAction={
          <Link href="/quiz/play">
            <Button variant="primary" size="sm" iconLeft={<Play size={14} />}>
              Commencer
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Total', value: stats.total, icon: Brain, color: '#6366f1' },
          { label: 'Maîtrisées', value: stats.mastered, icon: CheckCircle, color: '#3aaa60' },
          { label: 'À revoir', value: stats.toReview, icon: AlertCircle, color: '#d4991a' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-4 text-center">
              <div
                className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${stat.color}20` }}
              >
                <stat.icon size={18} style={{ color: stat.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Theme Quiz Cards */}
      <h3 className="text-lg font-semibold tracking-tight mb-5 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <Star size={18} style={{ color: '#d4ad4a' }} />
        Quiz par thème
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {themeGroups.map(({ themeId, count, theme }, i) => (
          <motion.div
            key={themeId}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Link href={`/quiz/play?theme=${themeId}`}>
              <Card glowColor="green" className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: theme ? `${theme.color}20` : 'rgba(255,255,255,0.06)',
                    }}
                  >
                    <Brain
                      size={18}
                      style={{ color: theme?.color || '#6366f1' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {theme?.title || themeId}
                    </h4>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {count} question{count > 1 ? 's' : ''}
                    </p>
                  </div>
                  <Badge variant="default" size="sm">{count}</Badge>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Edit3, Save, Trash2, GraduationCap, FileDown, Brain, Loader2,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import BlockEditor from '@/components/editor/BlockEditor';
import { useAuth } from '@/contexts/AuthContext';
import { courseRepository } from '@/lib/repositories/courseRepository';
import { quizRepository } from '@/lib/repositories/quizRepository';
import { generateQuizFromCourse } from '@/lib/ai/groq';
import { useToast } from '@/components/ui/Toast';
import { exportToPdf } from '@/lib/exportPdf';
import type { CoursePage, TopicBlock } from '@/types';

export default function CourseDetailClient({ id: propId }: { id: string }) {
  const { isAdmin, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const paramId = (params?.id as string) || propId;
  const [id, setId] = useState(paramId);
  const { toast } = useToast();
  const [page, setPage] = useState<CoursePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBlocks, setEditBlocks] = useState<TopicBlock[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [folder, setFolder] = useState<{ id: string; title: string; icon?: string } | null>(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  useEffect(() => {
    // In static export, useParams() may return '_placeholder'. Extract real ID from URL.
    if (!id || id === '_placeholder') {
      const segments = window.location.pathname.split('/').filter(Boolean);
      const urlId = segments[segments.length - 1];
      if (urlId && urlId !== '_placeholder') setId(urlId);
    }
  }, [id]);

  useEffect(() => {
    if (authLoading) return;
    if (!id || id === '_placeholder') return;
    setLoading(true);
    courseRepository.getPageById(id).then((p) => {
      setPage(p);
      if (p) {
        setEditTitle(p.title);
        setEditBlocks(p.blocks);
        courseRepository.getFolderById(p.folderId).then(setFolder).catch(() => {});
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id, authLoading, user]);

  const handleSave = useCallback(async () => {
    if (!page || saving) return;
    setSaving(true);
    try {
      const updated = await courseRepository.updatePage(page.id, {
        title: editTitle,
        blocks: editBlocks,
      });
      if (updated) {
        setPage(updated);
        setIsEditing(false);
        toast('success', 'Page de cours sauvegardée');
      } else {
        toast('error', 'Erreur : contenu trop volumineux ou problème serveur');
      }
    } catch {
      toast('error', 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }, [page, editTitle, editBlocks, toast, saving]);

  const handleDelete = useCallback(async () => {
    if (!page) return;
    try {
      await courseRepository.deletePage(page.id);
      toast('success', 'Page de cours supprimée');
      router.push('/courses');
    } catch {
      toast('error', 'Erreur lors de la suppression');
    }
  }, [page, toast, router]);

  const handleGenerateQuiz = useCallback(async () => {
    if (!page || !user || generatingQuiz) return;
    setGeneratingQuiz(true);
    try {
      const textBlocks = page.blocks
        .filter((b) => b.content.trim().length > 10)
        .map((b) => ({ type: b.type, content: b.content }));

      if (textBlocks.length === 0) {
        toast('error', 'Pas assez de contenu pour générer un quiz');
        setGeneratingQuiz(false);
        return;
      }

      const aiQuestions = await generateQuizFromCourse(page.title, textBlocks);
      const courseTheme = `course-${page.id}`;

      for (const q of aiQuestions) {
        await quizRepository.createQuestion(user.id, {
          themeId: courseTheme,
          type: q.type === 'mcq' ? 'mcq' : q.type === 'true-false' ? 'true-false' : 'short-answer',
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          source: page.title,
          difficulty: 'medium',
          tags: ['cours', page.title],
        });
      }

      toast('success', `${aiQuestions.length} question${aiQuestions.length > 1 ? 's' : ''} générée${aiQuestions.length > 1 ? 's' : ''} par l'IA !`);
      router.push(`/quiz/play?theme=${courseTheme}`);
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Erreur lors de la génération du quiz');
    }
    setGeneratingQuiz(false);
  }, [page, user, generatingQuiz, toast, router]);

  if (loading) {
    return (
      <div className="pb-10">
        <div className="flex items-center gap-3 py-5">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-xl cursor-pointer"
            style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
          >
            <ArrowLeft size={18} style={{ color: 'var(--text-secondary)' }} />
          </button>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="pb-10">
        <div className="flex items-center gap-3 py-5">
          <button
            onClick={() => router.push('/courses')}
            className="flex h-10 w-10 items-center justify-center rounded-xl cursor-pointer"
            style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
          >
            <ArrowLeft size={18} style={{ color: 'var(--text-secondary)' }} />
          </button>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Page introuvable ou accès refusé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10">
      {/* Header */}
      <header
        className="sticky top-0 z-30 -mx-5 mb-6 px-5 py-4 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10"
        style={{
          background: 'rgba(6, 18, 15, 0.85)',
          backdropFilter: 'blur(20px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => router.push('/courses')}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl transition-all duration-200 cursor-pointer shrink-0"
            style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
          >
            <ArrowLeft size={18} style={{ color: 'var(--text-secondary)' }} />
          </button>

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-transparent text-lg font-semibold tracking-tight outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
            ) : (
              <>
                <h1 className="text-lg font-semibold tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
                  {page.title}
                </h1>
                {folder && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {folder.icon} {folder.title}
                  </p>
                )}
              </>
            )}
          </div>

          {!isEditing && (
            <>
              <button
                onClick={handleGenerateQuiz}
                disabled={generatingQuiz}
                className="p-2 rounded-lg transition-colors cursor-pointer"
                style={{ color: generatingQuiz ? 'var(--text-muted)' : 'var(--accent)' }}
                title="Générer un quiz depuis ce cours"
              >
                {generatingQuiz ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
              </button>
              <button
                onClick={() => exportToPdf(page.title, page.blocks, folder ? `${folder.icon || ''} ${folder.title}`.trim() : undefined)}
                className="p-2 rounded-lg transition-colors cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
                title="Exporter en PDF"
              >
                <FileDown size={16} />
              </button>
            </>
          )}

          {isAdmin && (
            <div className="flex items-center gap-1.5 shrink-0">
              {isEditing ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                    Annuler
                  </Button>
                  <Button variant="primary" size="sm" iconLeft={<Save size={14} />} onClick={handleSave} disabled={saving}>
                    {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" size="sm" iconLeft={<Edit3 size={14} />} onClick={() => {
                    if (page) {
                      setEditTitle(page.title);
                      setEditBlocks(JSON.parse(JSON.stringify(page.blocks)));
                    }
                    setIsEditing(true);
                  }}>
                    Modifier
                  </Button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="p-2 rounded-lg transition-colors cursor-pointer"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Course badge */}
      {!isEditing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 mb-6 flex-wrap"
        >
          <Badge variant="gold" size="sm">
            <GraduationCap size={12} className="mr-1" />
            Cours
          </Badge>
          {page.tags.map((tag) => (
            <Badge key={tag} variant="default" size="sm">{tag}</Badge>
          ))}
          {page.description && (
            <p className="text-xs w-full mt-1" style={{ color: 'var(--text-muted)' }}>
              {page.description}
            </p>
          )}
        </motion.div>
      )}

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <BlockEditor
          blocks={isEditing ? editBlocks : page.blocks}
          onChange={setEditBlocks}
          readOnly={!isEditing}
        />
      </motion.div>

      {/* Delete modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Supprimer cette page de cours ?"
      >
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Cette action est irréversible. La page &quot;{page.title}&quot; sera définitivement supprimée.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" size="md" onClick={() => setShowDeleteModal(false)} className="flex-1">
            Annuler
          </Button>
          <Button variant="primary" size="md" onClick={handleDelete} className="flex-1">
            Supprimer
          </Button>
        </div>
      </Modal>
    </div>
  );
}

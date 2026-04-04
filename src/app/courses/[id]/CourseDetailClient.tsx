'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Edit3, Save, Trash2, GraduationCap,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import BlockEditor from '@/components/editor/BlockEditor';
import { useAuth } from '@/contexts/AuthContext';
import { courseRepository } from '@/lib/repositories/courseRepository';
import { useToast } from '@/components/ui/Toast';
import type { CoursePage, TopicBlock } from '@/types';

export default function CourseDetailClient({ id }: { id: string }) {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [page, setPage] = useState<CoursePage | null>(() => {
    if (typeof window === 'undefined') return null;
    return courseRepository.getPageById(id);
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(() => {
    if (typeof window === 'undefined') return '';
    const p = courseRepository.getPageById(id);
    return p?.title || '';
  });
  const [editBlocks, setEditBlocks] = useState<TopicBlock[]>(() => {
    if (typeof window === 'undefined') return [];
    const p = courseRepository.getPageById(id);
    return p?.blocks || [];
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const folder = page ? courseRepository.getFolderById(page.folderId) : null;

  const handleSave = useCallback(() => {
    if (!page) return;
    const updated = courseRepository.updatePage(page.id, {
      title: editTitle,
      blocks: editBlocks,
    });
    if (updated) {
      setPage(updated);
      setIsEditing(false);
      toast('success', 'Page de cours sauvegardée');
    }
  }, [page, editTitle, editBlocks, toast]);

  const handleDelete = useCallback(() => {
    if (!page) return;
    courseRepository.deletePage(page.id);
    toast('success', 'Page de cours supprimée');
    router.push('/courses');
  }, [page, toast, router]);

  if (!page) {
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/courses')}
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 cursor-pointer"
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

          {isAdmin && (
            <div className="flex items-center gap-1.5 shrink-0">
              {isEditing ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                    Annuler
                  </Button>
                  <Button variant="primary" size="sm" iconLeft={<Save size={14} />} onClick={handleSave}>
                    Sauvegarder
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" size="sm" iconLeft={<Edit3 size={14} />} onClick={() => setIsEditing(true)}>
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

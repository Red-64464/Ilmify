'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Edit3, Pin, Heart, Trash2,
  Save, Tag,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import BlockEditor from '@/components/editor/BlockEditor';
import { useAuth } from '@/contexts/AuthContext';
import { topicRepository } from '@/lib/repositories/topicRepository';
import { useToast } from '@/components/ui/Toast';
import type { Topic, TopicBlock } from '@/types';

export default function TopicDetailClient({ id: propId }: { id: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || propId;
  const { toast } = useToast();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBlocks, setEditBlocks] = useState<TopicBlock[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    topicRepository.getById(id).then((t) => {
      setTopic(t);
      if (t) {
        setEditTitle(t.title);
        setEditBlocks(t.blocks);
      }
    }).catch(() => { /* loading failed */ });
  }, [id]);

  const isOwner = user && topic && user.id === topic.userId;

  const handleSave = useCallback(async () => {
    if (!topic) return;
    try {
      const blocksToSave = JSON.parse(JSON.stringify(editBlocks)) as TopicBlock[];
      const updated = await topicRepository.update(topic.id, {
        title: editTitle,
        blocks: blocksToSave,
      });
      if (updated) {
        setTopic(updated);
        setEditBlocks(updated.blocks);
        setEditTitle(updated.title);
        setIsEditing(false);
        toast('success', 'Topic sauvegardé');
      } else {
        toast('error', 'Erreur lors de la sauvegarde');
      }
    } catch {
      toast('error', 'Erreur lors de la sauvegarde');
    }
  }, [topic, editTitle, editBlocks, toast]);

  const handleDelete = useCallback(async () => {
    if (!topic) return;
    try {
      await topicRepository.delete(topic.id);
      toast('success', 'Topic supprimé');
      router.push('/topics');
    } catch {
      toast('error', 'Erreur lors de la suppression');
    }
  }, [topic, toast, router]);

  const handleTogglePin = useCallback(async () => {
    if (!topic) return;
    try {
      const updated = await topicRepository.togglePin(topic.id);
      if (updated) setTopic(updated);
    } catch { /* ignore */ }
  }, [topic]);

  const handleToggleFavorite = useCallback(async () => {
    if (!topic) return;
    try {
      const updated = await topicRepository.toggleFavorite(topic.id);
      if (updated) setTopic(updated);
    } catch { /* ignore */ }
  }, [topic]);

  if (!topic) {
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
            onClick={() => router.push('/topics')}
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
              <h1 className="text-lg font-semibold tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
                {topic.title}
              </h1>
            )}
          </div>

          {isOwner && (
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
                  <button
                    onClick={handleTogglePin}
                    className="p-2 rounded-lg transition-colors cursor-pointer"
                    style={{ color: topic.isPinned ? '#2e9e8c' : 'var(--text-muted)' }}
                    title={topic.isPinned ? 'Désépingler' : 'Épingler'}
                  >
                    <Pin size={16} />
                  </button>
                  <button
                    onClick={handleToggleFavorite}
                    className="p-2 rounded-lg transition-colors cursor-pointer"
                    style={{ color: topic.isFavorite ? '#d4ad4a' : 'var(--text-muted)' }}
                    title={topic.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <Heart size={16} fill={topic.isFavorite ? '#d4ad4a' : 'none'} />
                  </button>
                  <Button variant="secondary" size="sm" iconLeft={<Edit3 size={14} />} onClick={() => {
                    setEditTitle(topic.title);
                    setEditBlocks(JSON.parse(JSON.stringify(topic.blocks)));
                    setIsEditing(true);
                  }}>
                    Modifier
                  </Button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="p-2 rounded-lg transition-colors cursor-pointer"
                    style={{ color: 'var(--text-muted)' }}
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Topic metadata */}
      {!isEditing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 mb-6 flex-wrap"
        >
          {topic.category && <Badge variant="green" size="sm">{topic.category}</Badge>}
          {topic.tags.map((tag) => (
            <Badge key={tag} variant="default" size="sm">
              <Tag size={10} className="mr-1" />
              {tag}
            </Badge>
          ))}
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Mis à jour le {new Date(topic.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </motion.div>
      )}

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={isEditing ? '' : 'max-w-none prose-sm'}
      >
        <BlockEditor
          blocks={isEditing ? editBlocks : topic.blocks}
          onChange={setEditBlocks}
          readOnly={!isEditing}
        />
      </motion.div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Supprimer ce topic ?"
      >
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Cette action est irréversible. Le topic &quot;{topic.title}&quot; sera définitivement supprimé.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" size="md" onClick={() => setShowDeleteModal(false)} className="flex-1">
            Annuler
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleDelete}
            className="flex-1"
          >
            Supprimer
          </Button>
        </div>
      </Modal>
    </div>
  );
}

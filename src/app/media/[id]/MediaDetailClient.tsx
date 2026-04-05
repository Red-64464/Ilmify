'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Play, Clock, Plus, Trash2, Eye, EyeOff,
  Edit3, Tag, ExternalLink, Video,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Skeleton from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/layout/AuthGuard';
import { mediaRepository } from '@/lib/repositories/mediaRepository';
import type { MediaVideo, TimestampNote } from '@/types';

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function parseTime(str: string): number {
  const parts = str.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

export default function MediaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [video, setVideo] = useState<MediaVideo | null>(null);
  const [loading, setLoading] = useState(true);

  // Notes
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteTime, setNoteTime] = useState('');
  const [noteText, setNoteText] = useState('');

  // Edit
  const [showEdit, setShowEdit] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editChannel, setEditChannel] = useState('');
  const [editTags, setEditTags] = useState('');

  useEffect(() => {
    mediaRepository.getVideoById(id)
      .then((v) => setVideo(v))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const ytId = video ? extractYouTubeId(video.url) : null;

  const seekTo = (seconds: number) => {
    if (iframeRef.current && ytId) {
      iframeRef.current.src = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&start=${seconds}`;
    }
  };

  const handleAddNote = async () => {
    if (!video || !noteText.trim()) return;
    const time = parseTime(noteTime);
    const newNotes: TimestampNote[] = [...video.notes, { time, text: noteText.trim() }].sort((a, b) => a.time - b.time);
    const updated = await mediaRepository.updateVideo(video.id, { notes: newNotes });
    if (updated) setVideo(updated);
    setShowAddNote(false);
    setNoteTime('');
    setNoteText('');
  };

  const handleDeleteNote = async (index: number) => {
    if (!video) return;
    const newNotes = video.notes.filter((_, i) => i !== index);
    const updated = await mediaRepository.updateVideo(video.id, { notes: newNotes });
    if (updated) setVideo(updated);
  };

  const handleToggleWatched = async () => {
    if (!video) return;
    const updated = await mediaRepository.updateVideo(video.id, { watched: !video.watched });
    if (updated) setVideo(updated);
  };

  const handleSaveEdit = async () => {
    if (!video || !editTitle.trim()) return;
    const updated = await mediaRepository.updateVideo(video.id, {
      title: editTitle.trim(),
      channelName: editChannel.trim() || undefined,
      tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
    });
    if (updated) setVideo(updated);
    setShowEdit(false);
  };

  if (loading) {
    return (
      <AuthGuard>
      <div className="pb-10">
        <div className="mb-6">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--accent)' }}>
            <ArrowLeft size={16} /> Retour
          </button>
        </div>
        <Skeleton className="w-full aspect-video rounded-2xl mb-6" />
        <Skeleton className="h-8 w-3/4 rounded-xl mb-2" />
        <Skeleton className="h-4 w-1/2 rounded-lg" />
      </div>
      </AuthGuard>
    );
  }

  if (!video) {
    return (
      <AuthGuard>
      <div className="pb-10">
        <div className="mb-6">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--accent)' }}>
            <ArrowLeft size={16} /> Retour
          </button>
        </div>
        <div className="text-center py-16">
          <Video size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>Vidéo introuvable.</p>
        </div>
      </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
    <div className="pb-10">
      {/* Back */}
      <div className="mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--accent)' }}>
          <ArrowLeft size={16} /> Retour
        </button>
      </div>

      {/* Player */}
      {ytId ? (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-6" style={{ background: '#000' }}>
          <iframe
            ref={iframeRef}
            src={`https://www.youtube-nocookie.com/embed/${ytId}`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <Card className="aspect-video flex items-center justify-center mb-6">
          <div className="text-center">
            <Video size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-sm flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
              Ouvrir la vidéo <ExternalLink size={14} />
            </a>
          </div>
        </Card>
      )}

      {/* Title + Meta */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight leading-snug" style={{ color: 'var(--text-primary)' }}>{video.title}</h1>
          {video.channelName && (
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{video.channelName}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={handleToggleWatched} className="p-2 rounded-xl hover:bg-white/5 cursor-pointer" title={video.watched ? 'Non vu' : 'Vu'} style={{ color: video.watched ? '#3aaa60' : 'var(--text-muted)' }}>
            {video.watched ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          <button onClick={() => { setEditTitle(video.title); setEditChannel(video.channelName || ''); setEditTags(video.tags.join(', ')); setShowEdit(true); }} className="p-2 rounded-xl hover:bg-white/5 cursor-pointer" style={{ color: 'var(--text-muted)' }}>
            <Edit3 size={18} />
          </button>
        </div>
      </div>

      {/* Tags */}
      {video.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {video.tags.map(t => <Badge key={t} variant="default" size="sm">{t}</Badge>)}
        </div>
      )}

      {/* Timestamped Notes */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Clock size={16} style={{ color: 'var(--accent)' }} />
            Notes horodatées
            <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>({video.notes.length})</span>
          </h2>
          <Button variant="secondary" size="sm" iconLeft={<Plus size={14} />} onClick={() => setShowAddNote(true)}>
            Note
          </Button>
        </div>

        {video.notes.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aucune note. Ajoutez des notes horodatées pour repérer les passages importants.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {video.notes.map((note, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="p-3">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => seekTo(note.time)}
                      className="shrink-0 px-2 py-1 rounded-lg text-xs font-mono font-medium cursor-pointer hover:scale-105 transition-transform"
                      style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                    >
                      {formatTime(note.time)}
                    </button>
                    <p className="flex-1 text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{note.text}</p>
                    <button onClick={() => handleDeleteNote(i)} className="p-1 rounded hover:bg-red-500/10 shrink-0 cursor-pointer" style={{ color: '#f87171' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Note Modal */}
      <Modal isOpen={showAddNote} onClose={() => setShowAddNote(false)} title="Ajouter une note">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Timestamp (ex: 1:23 ou 0:45)</label>
            <input value={noteTime} onChange={(e) => setNoteTime(e.target.value)} placeholder="1:23" className="w-full rounded-xl px-4 py-3 text-sm outline-none font-mono" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Note</label>
            <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={3} placeholder="Votre note..." className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" size="md" onClick={() => setShowAddNote(false)} className="flex-1">Annuler</Button>
            <Button variant="primary" size="md" onClick={handleAddNote} disabled={!noteText.trim()} className="flex-1">Ajouter</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Video Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Modifier la vidéo">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Titre</label>
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Chaîne</label>
            <input value={editChannel} onChange={(e) => setEditChannel(e.target.value)} className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Tags</label>
            <input value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="tag1, tag2" className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" size="md" onClick={() => setShowEdit(false)} className="flex-1">Annuler</Button>
            <Button variant="primary" size="md" onClick={handleSaveEdit} disabled={!editTitle.trim()} className="flex-1">Enregistrer</Button>
          </div>
        </div>
      </Modal>
    </div>
    </AuthGuard>
  );
}

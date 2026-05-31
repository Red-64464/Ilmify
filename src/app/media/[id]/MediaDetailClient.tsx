'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Play, Clock, Plus, Trash2, Eye, EyeOff,
  Edit3, ExternalLink, Video, Sparkles, Loader2, CheckCircle2, BookOpen,
  MessageCircle, ChevronRight, Trophy, Send, RefreshCw,
  Quote, Search, Download, ListVideo, Headphones,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Skeleton from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/layout/AuthGuard';
import dynamic from 'next/dynamic';
import { mediaRepository } from '@/lib/repositories/mediaRepository';
import { topicRepository } from '@/lib/repositories/topicRepository';
import { generateVideoAnalysis, answerVideoQuestion, extractVideoQuotes, findSimilarVideos, type VideoAnalysis } from '@/lib/ai/groq';
import type { MediaVideo, TimestampNote, TopicBlock } from '@/types';

const BlockEditor = dynamic(() => import('@/components/editor/BlockEditor'), {
  ssr: false,
  loading: () => (
    <div className="space-y-3 py-3">
      {[1, 2].map(i => (
        <div key={i} className="skeleton rounded-2xl" style={{ height: '3.5rem' }} aria-hidden="true" />
      ))}
    </div>
  ),
});

type VideoPlatform = 'youtube' | 'tiktok' | 'instagram' | 'twitter';
interface VideoInfo { platform: VideoPlatform; id: string }

function extractVideoInfo(url: string): VideoInfo | null {
  const ytM = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  if (ytM) return { platform: 'youtube', id: ytM[1] };
  const ttM = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (ttM) return { platform: 'tiktok', id: ttM[1] };
  const igM = url.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
  if (igM) return { platform: 'instagram', id: igM[1] };
  const twM = url.match(/(?:twitter|x)\.com\/[^/]+\/status\/(\d+)/);
  if (twM) return { platform: 'twitter', id: twM[1] };
  return null;
}

function getEmbedUrl(info: VideoInfo): string | null {
  switch (info.platform) {
    case 'youtube': return `https://www.youtube-nocookie.com/embed/${info.id}`;
    case 'tiktok':  return `https://www.tiktok.com/embed/v2/${info.id}`;
    case 'instagram': return `https://www.instagram.com/p/${info.id}/embed/`;
    case 'twitter': return null;
  }
}

function platformLabel(info: VideoInfo): string {
  const labels: Record<VideoPlatform, string> = { youtube: 'YouTube', tiktok: 'TikTok', instagram: 'Instagram', twitter: 'Twitter / X' };
  return labels[info.platform];
}

// Keep for backwards compatibility
function extractYouTubeId(url: string): string | null {
  const info = extractVideoInfo(url);
  return info?.platform === 'youtube' ? info.id : null;
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

  // AI analysis
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStep, setAiStep] = useState('');
  const [aiError, setAiError] = useState('');
  const [aiResult, setAiResult] = useState<VideoAnalysis | null>(null);
  const [previewBlocks, setPreviewBlocks] = useState<TopicBlock[] | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTab, setAiTab] = useState<'summary' | 'synthesis' | 'keypoints' | 'chapters' | 'quiz' | 'qa' | 'note'>('summary');
  const [savingTopic, setSavingTopic] = useState(false);
  const [storedTranscript, setStoredTranscript] = useState('');

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Q&A state
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const [qaAnswer, setQaAnswer] = useState<{ answer: string; citation: string } | null>(null);

  // Quotes extraction
  const [quotes, setQuotes] = useState<{ text: string; context: string; percentPosition: number }[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [showQuotes, setShowQuotes] = useState(false);

  // Transcript search
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);

  // Similar videos
  const [similarVideos, setSimilarVideos] = useState<{ id: string; title: string }[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [showSimilar, setShowSimilar] = useState(false);

  // Podcast mode (background audio)
  const [podcastMode, setPodcastMode] = useState(false);

  useEffect(() => {
    mediaRepository.getVideoById(id)
      .then((v) => setVideo(v))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const videoInfo = video ? extractVideoInfo(video.url) : null;
  const ytId = videoInfo?.platform === 'youtube' ? videoInfo.id : null;

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

  const handleAiAnalyze = async (force = false) => {
    if (!ytId || !video) return;

    // Check localStorage cache first
    const cacheKey = `ilmify-ai-${ytId}`;
    if (force) {
      try { localStorage.removeItem(cacheKey); } catch { /* ignore */ }
    }
    try {
      const cached = !force ? localStorage.getItem(cacheKey) : null;
      if (cached) {
        const parsed = JSON.parse(cached) as VideoAnalysis;
        setAiResult(parsed);
        setShowAiModal(true);
        setAiTab('summary');
        // Build preview blocks from cache
        const VALID_TYPES = new Set([
          'paragraph', 'heading1', 'heading2', 'heading3',
          'quote', 'bullet-list', 'numbered-list',
          'callout', 'reflection', 'reminder', 'source',
          'hadith', 'verse', 'dua', 'definition',
          'checklist', 'poem', 'timeline', 'warning', 'divider',
        ]);
        setPreviewBlocks(parsed.blocks
          .filter((b) => VALID_TYPES.has(b.type))
          .map((b, i) => ({
            id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${i}`,
            type: b.type as TopicBlock['type'],
            content: Array.isArray(b.content) ? (b.content as string[]).join('\n') : String(b.content ?? ''),
            metadata: b.metadata,
            order: i,
          })));
        // Still fetch transcript for Q&A
        fetch(process.env.NODE_ENV === 'production'
          ? `/.netlify/functions/youtube-transcript?videoId=${ytId}`
          : `/api/youtube-transcript?videoId=${ytId}`)
          .then(r => r.json())
          .then((d: { transcript?: string }) => { if (d.transcript) setStoredTranscript(d.transcript); })
          .catch(() => {});
        return;
      }
    } catch { /* cache miss or parse error, continue */ }

    setAiLoading(true);
    setAiError('');
    setAiResult(null);
    setPreviewBlocks(null);
    setStoredTranscript('');
    setAiTab('summary');
    setShowAiModal(true);
    // Reset quiz/qa
    setQuizIndex(0); setQuizSelected(null); setQuizAnswered(false); setQuizScore(0); setQuizCompleted(false);
    setQaQuestion(''); setQaAnswer(null);
    try {
      setAiStep('Récupération de la transcription...');
      const endpoint = process.env.NODE_ENV === 'production'
        ? `/.netlify/functions/youtube-transcript?videoId=${ytId}`
        : `/api/youtube-transcript?videoId=${ytId}`;
      const res = await fetch(endpoint);
      const data = await res.json() as { transcript?: string; error?: string };
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la récupération de la transcription');
      if (!data.transcript) throw new Error('Transcription vide');
      setStoredTranscript(data.transcript);
      setAiStep('Analyse du contenu...');
      const analysis = await generateVideoAnalysis(data.transcript, video.title, video.channelName, (step, partial) => {
        setAiStep(step);
        // Show partial results (Stage 1) while Stage 2 is still loading
        if (partial) {
          setAiResult(prev => ({
            summary: partial.summary ?? prev?.summary ?? '',
            synthesis: partial.synthesis ?? prev?.synthesis ?? '',
            keyPoints: partial.keyPoints ?? prev?.keyPoints ?? [],
            blocks: prev?.blocks ?? [],
            chapters: prev?.chapters ?? [],
            quizQuestions: prev?.quizQuestions ?? [],
          }));
        }
      });
      setAiResult(analysis);
      setAiStep('Structuration des blocs...');
      const VALID_TYPES = new Set([
        'paragraph', 'heading1', 'heading2', 'heading3',
        'quote', 'bullet-list', 'numbered-list',
        'callout', 'reflection', 'reminder', 'source',
        'hadith', 'verse', 'dua', 'definition',
        'checklist', 'poem', 'timeline', 'warning', 'divider',
      ]);
      const builtBlocks: TopicBlock[] = analysis.blocks
        .filter((b) => VALID_TYPES.has(b.type))
        .map((b, i) => ({
          id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${i}`,
          type: b.type as TopicBlock['type'],
          content: Array.isArray(b.content) ? (b.content as string[]).join('\n') : String(b.content ?? ''),
          metadata: b.metadata,
          order: i,
        }));
      setPreviewBlocks(builtBlocks);
      // Cache result for instant reload — only if we actually have meaningful data
      const hasContent = analysis.summary || analysis.synthesis || analysis.keyPoints.length > 0 || analysis.blocks.length > 0;
      if (hasContent) {
        try { localStorage.setItem(cacheKey, JSON.stringify(analysis)); } catch { /* quota exceeded */ }
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!qaQuestion.trim() || !storedTranscript || !video || qaLoading) return;
    setQaLoading(true);
    setQaAnswer(null);
    try {
      const result = await answerVideoQuestion(storedTranscript, video.title, qaQuestion.trim());
      setQaAnswer(result);
    } catch {
      setQaAnswer({ answer: 'Erreur lors de la recherche de la réponse.', citation: '' });
    } finally {
      setQaLoading(false);
    }
  };

  const handleCreateTopic = async () => {
    if (!user || !previewBlocks || savingTopic || !video) return;
    setSavingTopic(true);
    try {
      const topic = await topicRepository.create(user.id, video.title, 'Notes');
      await topicRepository.update(topic.id, { blocks: previewBlocks });
      router.push(`/topics/${topic.id}`);
    } catch {
      setSavingTopic(false);
    }
  };

  // ─── Extract Quotes ───
  const handleExtractQuotes = async () => {
    if (!storedTranscript || !video || quotesLoading) return;
    setQuotesLoading(true);
    setShowQuotes(true);
    try {
      const result = await extractVideoQuotes(storedTranscript, video.title);
      setQuotes(result.quotes || []);
    } catch {
      setQuotes([]);
    } finally {
      setQuotesLoading(false);
    }
  };

  // ─── Find Similar Videos ───
  const handleFindSimilar = async () => {
    if (!video || similarLoading) return;
    setSimilarLoading(true);
    setShowSimilar(true);
    try {
      const allVideos = await mediaRepository.getVideosByFolder(video.folderId);
      const others = allVideos.filter((v: { id: string }) => v.id !== video.id);
      const ids = await findSimilarVideos(
        { title: video.title, tags: video.tags, channelName: video.channelName },
        others.map((v: { id: string; title: string; tags: string[]; channelName?: string }) => ({ id: v.id, title: v.title, tags: v.tags, channelName: v.channelName })),
      );
      // Map IDs to {id, title} for display
      const videoMap = new Map(others.map((v: { id: string; title: string }) => [v.id, v.title]));
      setSimilarVideos(ids.map(id => ({ id, title: videoMap.get(id) || id })));
    } catch {
      setSimilarVideos([]);
    } finally {
      setSimilarLoading(false);
    }
  };

  // ─── Download Transcript ───
  const handleDownloadTranscript = (format: 'txt' | 'pdf') => {
    if (!storedTranscript || !video) return;
    if (format === 'txt') {
      const blob = new Blob([storedTranscript], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${video.title.replace(/[^a-zA-Z0-9À-ÿ\s]/g, '').trim()}_transcription.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      printWindow.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>${video.title} - Transcription</title><style>body{font-family:Inter,sans-serif;max-width:800px;margin:0 auto;padding:2rem;color:#111;font-size:0.875rem;line-height:1.9}h1{font-size:1.5rem;margin-bottom:0.5rem}p.meta{color:#666;font-size:0.75rem;margin-bottom:2rem}</style></head><body><h1>${video.title}</h1><p class="meta">${video.channelName || ''} — Transcription exportée depuis Ilmify</p><div style="white-space:pre-wrap">${storedTranscript.replace(/</g, '&lt;')}</div></body></html>`);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  // ─── Toggle Podcast Mode ───
  const togglePodcastMode = () => {
    if (!ytId) return;
    setPodcastMode(!podcastMode);
    if (!podcastMode && iframeRef.current) {
      // Reload iframe with audio-friendly parameters
      iframeRef.current.src = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1`;
    }
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
      {videoInfo ? (() => {
        const embedUrl = getEmbedUrl(videoInfo);
        if (embedUrl) {
          return (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-6" style={{ background: '#000' }}>
              <iframe
                ref={iframeRef}
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                sandbox={videoInfo.platform === 'tiktok' ? 'allow-popups allow-popups-to-escape-sandbox allow-scripts allow-top-navigation allow-same-origin' : undefined}
              />
            </div>
          );
        }
        // Twitter / unsupported: external link card
        return (
          <Card className="aspect-video flex items-center justify-center mb-6">
            <div className="text-center">
              <Video size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Lecture intégrée non disponible pour {platformLabel(videoInfo)}</p>
              <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-sm flex items-center gap-1.5 justify-center" style={{ color: 'var(--accent)' }}>
                Ouvrir <ExternalLink size={14} />
              </a>
            </div>
          </Card>
        );
      })() : (
        <Card className="aspect-video flex items-center justify-center mb-6">
          <div className="text-center">
            <Video size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-sm flex items-center gap-1.5 justify-center" style={{ color: 'var(--accent)' }}>
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
        <div className="flex flex-wrap gap-2 mb-4">
          {video.tags.map(t => <Badge key={t} variant="default" size="sm">{t}</Badge>)}
        </div>
      )}

      {/* ─── Media AI Actions ─── */}
      <div className="flex flex-wrap gap-2 mb-6">
        {storedTranscript && (
          <>
            <button onClick={handleExtractQuotes} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all" style={{ background: 'rgba(212,173,74,0.08)', border: '1px solid rgba(212,173,74,0.15)', color: '#d4ad4a' }}>
              <Quote size={13} /> Citations IA
            </button>
            <button onClick={() => setShowTranscript(!showTranscript)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', color: '#60a5fa' }}>
              <Search size={13} /> Transcription
            </button>
            <button onClick={() => handleDownloadTranscript('txt')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', color: '#a78bfa' }}>
              <Download size={13} /> .txt
            </button>
            <button onClick={() => handleDownloadTranscript('pdf')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', color: '#a78bfa' }}>
              <Download size={13} /> .pdf
            </button>
          </>
        )}
        <button onClick={handleFindSimilar} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all" style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.15)', color: '#ec4899' }}>
          <ListVideo size={13} /> Similaires
        </button>
        {ytId && (
          <button onClick={togglePodcastMode} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all" style={{ background: podcastMode ? 'rgba(46,158,140,0.15)' : 'rgba(46,158,140,0.08)', border: `1px solid ${podcastMode ? 'rgba(46,158,140,0.3)' : 'rgba(46,158,140,0.15)'}`, color: '#2e9e8c' }}>
            <Headphones size={13} /> {podcastMode ? 'Mode vidéo' : 'Mode podcast'}
          </button>
        )}
      </div>

      {/* ─── Podcast Mode Bar ─── */}
      {podcastMode && ytId && (
        <div className="mb-6 p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(46,158,140,0.08), rgba(46,158,140,0.03))', border: '1px solid rgba(46,158,140,0.15)' }}>
          <div className="flex items-center gap-3">
            <Headphones size={20} style={{ color: '#2e9e8c' }} />
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Mode podcast activé</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>L&apos;audio continue en arrière-plan. Minimisez l&apos;app pour écouter.</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Searchable Transcript ─── */}
      <AnimatePresence>
        {showTranscript && storedTranscript && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6">
            <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Search size={14} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text" value={transcriptSearch} onChange={(e) => setTranscriptSearch(e.target.value)}
                  placeholder="Rechercher dans la transcription..."
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto text-xs leading-[1.8] whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                {transcriptSearch.trim() ? (
                  storedTranscript.split(new RegExp(`(${transcriptSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')).map((part, i) =>
                    part.toLowerCase() === transcriptSearch.toLowerCase()
                      ? <mark key={i} style={{ background: 'rgba(212,173,74,0.3)', borderRadius: '2px', padding: '0 2px' }}>{part}</mark>
                      : <span key={i}>{part}</span>
                  )
                ) : storedTranscript}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Quotes Panel ─── */}
      <AnimatePresence>
        {showQuotes && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6">
            <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Quote size={14} style={{ color: '#d4ad4a' }} /> Citations extraites
              </h3>
              {quotesLoading ? (
                <div className="flex items-center gap-2 py-4 justify-center">
                  <Loader2 size={16} className="animate-spin" style={{ color: '#d4ad4a' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Extraction en cours...</span>
                </div>
              ) : quotes.length > 0 ? (
                <div className="space-y-3">
                  {quotes.map((q, i) => (
                    <div key={i} className="p-3 rounded-xl" style={{ background: 'rgba(212,173,74,0.04)', border: '1px solid rgba(212,173,74,0.1)' }}>
                      <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-primary)' }}>« {q.text} »</p>
                      <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>{q.context} — ~{q.percentPosition}%</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-center py-3" style={{ color: 'var(--text-muted)' }}>Aucune citation trouvée</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Similar Videos Panel ─── */}
      <AnimatePresence>
        {showSimilar && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6">
            <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <ListVideo size={14} style={{ color: '#ec4899' }} /> Vidéos similaires
              </h3>
              {similarLoading ? (
                <div className="flex items-center gap-2 py-4 justify-center">
                  <Loader2 size={16} className="animate-spin" style={{ color: '#ec4899' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Recherche...</span>
                </div>
              ) : similarVideos.length > 0 ? (
                <div className="space-y-2">
                  {similarVideos.map((sv) => (
                    <button key={sv.id} onClick={() => { window.location.href = `/media/${sv.id}`; }} className="w-full text-left p-3 rounded-xl cursor-pointer transition-colors hover:bg-white/5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{sv.title}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-center py-3" style={{ color: 'var(--text-muted)' }}>Aucune vidéo similaire trouvée</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* AI Analysis Section */}
      {ytId && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Sparkles size={16} style={{ color: 'var(--accent)' }} />
              Analyse IA
            </h2>
            <Button
              variant="primary"
              size="sm"
              iconLeft={aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              onClick={() => handleAiAnalyze()}
              disabled={aiLoading}
            >
              {aiLoading ? 'Analyse...' : 'Analyser avec l’IA'}
            </Button>
          </div>
          <Card className="p-4">
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Génère automatiquement un <strong style={{ color: 'var(--text-secondary)' }}>résumé</strong>,
              une <strong style={{ color: 'var(--text-secondary)' }}>synthèse</strong>,
              les <strong style={{ color: 'var(--text-secondary)' }}>chapitres</strong>,
              un <strong style={{ color: 'var(--text-secondary)' }}>quiz</strong> et une
              <strong style={{ color: 'var(--text-secondary)' }}> note structurée</strong> à partir de la transcription YouTube.
            </p>
          </Card>
        </div>
      )}

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

      {/* AI Analysis Result Modal */}
      <Modal isOpen={showAiModal} onClose={() => { setShowAiModal(false); setSavingTopic(false); }} title="Analyse IA" maxWidth="48rem">
        {/* Loading state — full spinner only when no partial results yet */}
        {aiLoading && !aiResult && (
          <div className="flex flex-col items-center py-12 gap-6">
            {/* Dual ring spinner */}
            <div className="relative w-20 h-20">
              {/* Outer ring — clockwise, fast */}
              <div
                className="absolute inset-0 rounded-full animate-spin"
                style={{
                  border: '3px solid rgba(46,158,140,0.15)',
                  borderTopColor: 'var(--accent)',
                  borderRightColor: 'rgba(46,158,140,0.5)',
                  animationDuration: '1s',
                }}
              />
              {/* Inner ring — counter-clockwise, slower */}
              <div
                className="absolute inset-[8px] rounded-full animate-spin"
                style={{
                  border: '2px solid rgba(46,158,140,0.1)',
                  borderTopColor: 'rgba(46,158,140,0.7)',
                  borderLeftColor: 'rgba(46,158,140,0.3)',
                  animationDuration: '1.8s',
                  animationDirection: 'reverse',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles size={16} style={{ color: 'var(--accent)' }} />
              </div>
            </div>
            {/* Step text + bouncing dots */}
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{aiStep || 'Analyse en cours...'}</p>
              <div className="flex justify-center gap-1.5 mt-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: 'var(--accent)', animationDelay: `${i * 0.18}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {aiError && !aiLoading && (
          <div className="py-8 text-center">
            <p className="text-sm mb-4" style={{ color: '#f87171' }}>⚠️ {aiError}</p>
            <Button variant="secondary" size="sm" onClick={() => handleAiAnalyze()}>Réessayer</Button>
          </div>
        )}

        {/* Result state — show even during loading if partial results available */}
        {aiResult && (
          <div>
            {/* Inline loading indicator when Stage 2 still loading */}
            {aiLoading && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(46,158,140,0.08)', border: '1px solid rgba(46,158,140,0.15)' }}>
                <Loader2 size={14} className="animate-spin shrink-0" style={{ color: 'var(--accent)' }} />
                <p className="text-xs" style={{ color: 'var(--accent)' }}>{aiStep || 'Finalisation...'}</p>
              </div>
            )}
            {/* Regenerate + Tab bar */}
            {!aiLoading && (
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => handleAiAnalyze(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer hover:brightness-110"
                  style={{ background: 'rgba(46,158,140,0.08)', color: 'var(--accent)' }}
                >
                  <RefreshCw size={12} />
                  Régénérer
                </button>
              </div>
            )}
            <div className="flex flex-wrap gap-1 p-1 rounded-xl mb-4" style={{ background: 'var(--bg-secondary)' }}>
              {([
                { id: 'summary', label: 'Résumé' },
                { id: 'synthesis', label: 'Synthèse' },
                { id: 'keypoints', label: 'Points clés' },
                { id: 'chapters', label: 'Chapitres' },
                { id: 'quiz', label: '🧠 Quiz' },
                { id: 'qa', label: '💬 Question' },
                { id: 'note', label: '📝 Note' },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setAiTab(tab.id); if (tab.id === 'quiz') { setQuizIndex(0); setQuizSelected(null); setQuizAnswered(false); setQuizScore(0); setQuizCompleted(false); } }}
                  className="flex-1 py-2 px-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap"
                  style={{
                    background: aiTab === tab.id ? 'var(--bg-card)' : 'transparent',
                    color: aiTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: aiTab === tab.id ? 'var(--shadow-card)' : 'none',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Résumé */}
            {aiTab === 'summary' && (
              <div
                className="rounded-xl p-5"
                style={{ background: 'rgba(46,158,140,0.06)', border: '1px solid rgba(46,158,140,0.12)' }}
              >
                <p className="text-sm sm:text-base leading-relaxed sm:leading-loose" style={{ color: 'var(--text-primary)' }}>{aiResult.summary}</p>
              </div>
            )}

            {/* Synthèse */}
            {aiTab === 'synthesis' && (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto overscroll-contain pr-1">
                {aiResult.synthesis.split('\n\n').filter(Boolean).map((para, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-4"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
                  >
                    <p className="text-sm sm:text-base leading-relaxed sm:leading-loose" style={{ color: 'var(--text-primary)' }}>{para}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Points clés */}
            {aiTab === 'keypoints' && (
              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {aiResult.keyPoints.map((point, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl p-3"
                    style={{ background: 'var(--bg-secondary)' }}
                  >
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
                    <p className="text-sm leading-snug" style={{ color: 'var(--text-primary)' }}>{point}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Chapitres */}
            {aiTab === 'chapters' && (
              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {aiResult.chapters.length === 0 ? (
                  <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>Aucun chapitre détecté</p>
                ) : aiResult.chapters.map((ch, i) => {
                  const durationSec = video?.duration ? parseTime(video.duration) : 0;
                  const canSeek = !!ytId && durationSec > 0;
                  const startSec = Math.round((ch.percentStart / 100) * durationSec);
                  return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${canSeek ? 'cursor-pointer hover:brightness-110' : ''}`}
                    style={{ background: 'var(--bg-secondary)' }}
                    onClick={() => { if (canSeek) seekTo(startSec); }}
                  >
                    <span
                      className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold"
                      style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-sm font-medium flex-1" style={{ color: 'var(--text-primary)' }}>{ch.title}</p>
                    <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {canSeek ? formatTime(startSec) : `~${ch.percentStart}%`}
                    </span>
                  </div>
                  );
                })}
              </div>
            )}

            {/* Quiz */}
            {aiTab === 'quiz' && (
              <div>
                {aiResult.quizQuestions.length === 0 ? (
                  <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>Aucune question générée</p>
                ) : quizCompleted ? (
                  <div className="text-center py-6 space-y-4">
                    <Trophy size={40} className="mx-auto" style={{ color: '#d4ad4a' }} />
                    <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                      {quizScore}/{aiResult.quizQuestions.length} bonnes réponses
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {quizScore === aiResult.quizQuestions.length ? 'Parfait ! 🎉' : quizScore >= aiResult.quizQuestions.length / 2 ? 'Bien joué ! 👍' : 'Continuez à apprendre ! 📚'}
                    </p>
                    <Button variant="secondary" size="sm" onClick={() => { setQuizIndex(0); setQuizSelected(null); setQuizAnswered(false); setQuizScore(0); setQuizCompleted(false); }}>
                      Recommencer
                    </Button>
                  </div>
                ) : (() => {
                  const q = aiResult.quizQuestions[quizIndex];
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                          Question {quizIndex + 1} / {aiResult.quizQuestions.length}
                        </span>
                        <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                          Score: {quizScore}
                        </span>
                      </div>
                      <div className="rounded-xl p-4" style={{ background: 'rgba(46,158,140,0.06)', border: '1px solid rgba(46,158,140,0.12)' }}>
                        <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>{q.question}</p>
                      </div>
                      <div className="space-y-2">
                        {q.options.map((opt, idx) => {
                          let bg = 'var(--bg-secondary)';
                          let color = 'var(--text-primary)';
                          if (quizAnswered) {
                            if (idx === q.correctAnswer) { bg = 'rgba(58,170,96,0.15)'; color = '#3aaa60'; }
                            else if (idx === quizSelected) { bg = 'rgba(248,113,113,0.15)'; color = '#f87171'; }
                          } else if (idx === quizSelected) {
                            bg = 'rgba(46,158,140,0.12)'; color = 'var(--accent)';
                          }
                          return (
                            <button
                              key={idx}
                              disabled={quizAnswered}
                              onClick={() => setQuizSelected(idx)}
                              className="w-full text-left rounded-xl px-4 py-3 text-sm transition-colors cursor-pointer disabled:cursor-default"
                              style={{ background: bg, color, border: `1px solid ${quizAnswered && idx === q.correctAnswer ? 'rgba(58,170,96,0.3)' : 'transparent'}` }}
                            >
                              <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>{opt}
                            </button>
                          );
                        })}
                      </div>
                      {quizAnswered && (
                        <div className="rounded-xl p-3 text-sm" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                          💡 {q.explanation}
                        </div>
                      )}
                      {!quizAnswered ? (
                        <Button
                          variant="primary" size="md" className="w-full"
                          disabled={quizSelected === null}
                          onClick={() => {
                            setQuizAnswered(true);
                            if (quizSelected === q.correctAnswer) setQuizScore(s => s + 1);
                          }}
                        >
                          Valider
                        </Button>
                      ) : (
                        <Button
                          variant="secondary" size="md" className="w-full"
                          onClick={() => {
                            if (quizIndex + 1 >= aiResult.quizQuestions.length) {
                              setQuizCompleted(true);
                            } else {
                              setQuizIndex(i => i + 1);
                              setQuizSelected(null);
                              setQuizAnswered(false);
                            }
                          }}
                        >
                          {quizIndex + 1 >= aiResult.quizQuestions.length ? 'Voir le résultat' : 'Suivant'}
                          <ChevronRight size={14} className="ml-1" />
                        </Button>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Q&A */}
            {aiTab === 'qa' && (
              <div className="space-y-4">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Posez une question sur le contenu de cette vidéo — l&apos;IA répondra en s&apos;appuyant sur la transcription.
                </p>
                <div className="flex gap-2">
                  <input
                    value={qaQuestion}
                    onChange={(e) => { setQaQuestion(e.target.value); setQaAnswer(null); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAskQuestion(); }}
                    placeholder="Ex: Quelle méthode a-t-il recommandée ?"
                    className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                  />
                  <Button
                    variant="primary" size="md"
                    iconLeft={qaLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    onClick={handleAskQuestion}
                    disabled={!qaQuestion.trim() || qaLoading || !storedTranscript}
                  >
                    {qaLoading ? '' : 'Envoyer'}
                  </Button>
                </div>
                {qaAnswer && (
                  <div className="space-y-3">
                    <div className="rounded-xl p-4" style={{ background: 'rgba(46,158,140,0.06)', border: '1px solid rgba(46,158,140,0.12)' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <MessageCircle size={14} style={{ color: 'var(--accent)' }} />
                        <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>Réponse</span>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{qaAnswer.answer}</p>
                    </div>
                    {qaAnswer.citation && (
                      <div className="rounded-xl p-3" style={{ background: 'var(--bg-secondary)', borderLeft: '3px solid var(--accent)' }}>
                        <p className="text-xs leading-relaxed italic" style={{ color: 'var(--text-secondary)' }}>
                          {qaAnswer.citation}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {!storedTranscript && (
                  <p className="text-xs" style={{ color: '#f87171' }}>⚠️ Transcription non disponible — relancez l&apos;analyse.</p>
                )}
              </div>
            )}

            {/* Note topic */}
            {aiTab === 'note' && (
              <div>
                <div className="max-h-[28rem] overflow-y-auto overscroll-contain mb-4 rounded-xl px-2" style={{ border: '1px solid var(--border-light)' }}>
                  {previewBlocks && previewBlocks.length > 0 ? (
                    <BlockEditor blocks={previewBlocks} onChange={() => {}} readOnly />
                  ) : (
                    <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>Aucun bloc généré</p>
                  )}
                </div>
                <Button
                  variant="primary"
                  size="md"
                  iconLeft={savingTopic ? <Loader2 size={15} className="animate-spin" /> : <BookOpen size={15} />}
                  onClick={handleCreateTopic}
                  disabled={savingTopic || !user || !previewBlocks}
                  className="w-full"
                >
                  {savingTopic ? 'Création du topic...' : 'Enregistrer comme topic'}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
    </AuthGuard>
  );
}

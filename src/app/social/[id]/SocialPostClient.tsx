'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Heart, Trash2, ExternalLink, Loader2, Captions, Sparkles, Download,
  MessageSquare, Plus, AlertTriangle, BookOpen, Tag,
} from 'lucide-react';
import AuthGuard from '@/components/layout/AuthGuard';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { socialPostRepository } from '@/lib/repositories/socialPostRepository';
import { platformLabel, platformColor } from '@/lib/social/platforms';
import { buildVtt, parseVtt } from '@/lib/social/vtt';
import { translateSegments, analyzeSocialPost } from '@/lib/ai/socialAI';
import type {
  SocialPost, SocialTranscript, SocialSubtitle, SocialAnnotation, SocialAnalysis,
} from '@/types';

type Lang = 'fr' | 'ar' | 'en';

const SUB_LANGS: Array<{ code: Lang; label: string; emoji: string }> = [
  { code: 'fr', label: 'Français', emoji: '🇫🇷' },
  { code: 'ar', label: 'العربية', emoji: '🇸🇦' },
  { code: 'en', label: 'English', emoji: '🇬🇧' },
];

export default function SocialPostClient({ postId }: { postId: string }) {
  return (
    <AuthGuard>
      <Inner postId={postId} />
    </AuthGuard>
  );
}

function Inner({ postId }: { postId: string }) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [post, setPost] = useState<SocialPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [transcript, setTranscript] = useState<SocialTranscript | null>(null);
  const [subtitles, setSubtitles] = useState<SocialSubtitle[]>([]);
  const [annotations, setAnnotations] = useState<SocialAnnotation[]>([]);
  const [analysis, setAnalysis] = useState<SocialAnalysis | null>(null);

  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [videoError, setVideoError] = useState(false);
  const [refreshingVideo, setRefreshingVideo] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [newAnnotation, setNewAnnotation] = useState('');
  const [currentTime, setCurrentTime] = useState(0);

  const frenchSubtitle = useMemo(
    () => subtitles.find((subtitle) => subtitle.language === 'fr') || null,
    [subtitles],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    if (postId === '_placeholder') { setLoading(false); return; }

    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const p = await socialPostRepository.getById(postId);
        if (!p) { setNotFound(true); return; }
        if (cancelled) return;
        setPost(p);

        const [t, subs, anns, an] = await Promise.all([
          socialPostRepository.getTranscript(postId),
          socialPostRepository.listSubtitles(postId),
          socialPostRepository.listAnnotations(postId),
          socialPostRepository.getAnalysis(postId),
        ]);
        if (cancelled) return;
        setTranscript(t);
        setSubtitles(subs);
        setAnnotations(anns);
        setAnalysis(an);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user, authLoading, postId]);

  // Parse subtitle cues for the custom overlay (prefer FR, fallback to first available)
  const overlayCues = useMemo(() => {
    const sub = frenchSubtitle || subtitles[0];
    if (!sub?.vttContent) return [];
    return parseVtt(sub.vttContent);
  }, [frenchSubtitle, subtitles]);

  // Active subtitle text based on currentTime
  const activeSubtitleText = useMemo(() => {
    if (overlayCues.length === 0) return '';
    const cue = overlayCues.find((c) => currentTime >= c.start && currentTime <= c.end);
    return cue?.text || '';
  }, [overlayCues, currentTime]);

  // ── Actions ──
  const handleTranscribe = async () => {
    if (!post || !user) return;
    setError(''); setWorking('transcribe');
    try {
      const res = await fetch('/api/social/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: post.url }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Transcription échouée (${res.status})`);
      }
      const data = await res.json() as { text: string; language: string; segments: SocialTranscript['segments'] };

      const saved = await socialPostRepository.upsertTranscript(user.id, post.id, {
        sourceLanguage: data.language,
        text: data.text,
        segments: data.segments,
      });
      setTranscript(saved);

      // Auto-generate original-language subtitle track
      if (saved.segments.length > 0) {
        const vtt = buildVtt(saved.segments);
        const sub = await socialPostRepository.upsertSubtitle(user.id, post.id, {
          language: saved.sourceLanguage || 'auto',
          label: SUB_LANGS.find((l) => l.code === saved.sourceLanguage)?.label || 'Original',
          vttContent: vtt,
          isOriginal: true,
        });
        setSubtitles((prev) => [...prev.filter((s) => s.language !== sub.language), sub]);

        // Auto-translate to French if the video is NOT in French
        if (saved.sourceLanguage !== 'fr' && saved.segments.length > 0) {
          try {
            setWorking('subtitles-fr');
            const frSegments = await translateSegments(saved.segments, 'fr', saved.sourceLanguage);
            const frVtt = buildVtt(frSegments);
            const frSub = await socialPostRepository.upsertSubtitle(user.id, post.id, {
              language: 'fr',
              label: 'Français',
              vttContent: frVtt,
              isOriginal: false,
            });
            setSubtitles((prev) => [...prev.filter((s) => s.language !== 'fr'), frSub]);
          } catch (e) {
            console.warn('Auto-traduction FR échouée:', e);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setWorking(null);
    }
  };

  const handleGenerateSubtitles = async (lang: Lang) => {
    if (!post || !user || !transcript) return;
    setError(''); setWorking(`subtitles-${lang}`);
    try {
      const translated = await translateSegments(transcript.segments, lang, transcript.sourceLanguage);
      const vtt = buildVtt(translated);
      const saved = await socialPostRepository.upsertSubtitle(user.id, post.id, {
        language: lang,
        label: SUB_LANGS.find((l) => l.code === lang)?.label || lang,
        vttContent: vtt,
        isOriginal: false,
      });
      setSubtitles((prev) => [...prev.filter((s) => s.language !== lang), saved]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setWorking(null);
    }
  };

  const handleAnalyze = async () => {
    if (!post || !user || !transcript) return;
    setError(''); setWorking('analyze');
    try {
      const result = await analyzeSocialPost(transcript.text, {
        caption: post.caption,
        author: post.author,
        platform: platformLabel(post.platform),
      });
      const saved = await socialPostRepository.upsertAnalysis(user.id, post.id, result);
      setAnalysis(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setWorking(null);
    }
  };

  const handleDownloadStyledVideo = async () => {
    if (!post || !frenchSubtitle) {
      setError('Genere d abord les sous-titres francais avant l export MP4.');
      return;
    }

    setError('');
    setWorking('export-video');

    try {
      const res = await fetch('/api/social/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: post.url,
          platform: post.platform,
          externalId: post.externalId,
          title: post.title || post.caption || `social-${post.id}`,
          subtitleVtt: frenchSubtitle.vttContent,
          aspectMode: post.platform === 'youtube' ? 'landscape' : 'portrait',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Export MP4 impossible (${res.status})`);
      }

      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = getDownloadName(
        res.headers.get('content-disposition'),
        post.title || post.caption || 'ilmify-social-export',
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setWorking(null);
    }
  };

  const handleRefreshMedia = async () => {
    if (!post || refreshingVideo) return;
    setRefreshingVideo(true);
    setError('');
    try {
      const res = await fetch('/api/social/refresh-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Impossible de récupérer la vidéo');
      setPost((prev) => prev ? { ...prev, mediaUrl: data.mediaUrl } : prev);
      setVideoError(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du refresh vidéo');
    } finally {
      setRefreshingVideo(false);
    }
  };

  const handleAddAnnotation = async () => {
    if (!post || !user || !newAnnotation.trim()) return;
    try {
      const time = videoRef.current?.currentTime ?? currentTime;
      const ann = await socialPostRepository.createAnnotation(user.id, post.id, {
        timeSec: time,
        text: newAnnotation.trim(),
      });
      setAnnotations((prev) => [...prev, ann].sort((a, b) => a.timeSec - b.timeSec));
      setNewAnnotation('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const handleDeleteAnnotation = async (id: string) => {
    try {
      await socialPostRepository.deleteAnnotation(id);
      setAnnotations((prev) => prev.filter((a) => a.id !== id));
    } catch { /* ignore */ }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play().catch(() => {});
    }
  };

  const toggleFavorite = async () => {
    if (!post) return;
    const up = await socialPostRepository.update(post.id, { isFavorite: !post.isFavorite });
    if (up) setPost(up);
  };

  const handleDelete = async () => {
    if (!post) return;
    if (!confirm('Supprimer ce post et toutes ses données (transcription, sous-titres, analyses) ?')) return;
    await socialPostRepository.remove(post.id);
    router.push('/social');
  };

  // ── Render ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8" style={{ background: 'var(--bg-base)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Post introuvable.</p>
        <Button variant="secondary" iconLeft={<ArrowLeft size={14} />} onClick={() => router.push('/social')}>
          Retour
        </Button>
      </div>
    );
  }

  const color = platformColor(post.platform);

  return (
    <div className="min-h-screen pb-32" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 px-4 md:px-8 py-3 flex items-center gap-3"
        style={{
          background: 'rgba(6, 18, 15, 0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <button
          onClick={() => router.push('/social')}
          className="flex h-10 w-10 items-center justify-center rounded-xl cursor-pointer"
          style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
          aria-label="Retour"
        >
          <ArrowLeft size={18} style={{ color: 'var(--text-primary)' }} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
              style={{ background: color, color: 'white' }}
            >
              {platformLabel(post.platform)}
            </span>
            {post.author && (
              <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>@{post.author}</span>
            )}
          </div>
          <h1 className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {post.title || post.caption?.slice(0, 80) || 'Sans titre'}
          </h1>
        </div>
        <button
          onClick={toggleFavorite}
          className="p-2 rounded-lg cursor-pointer"
          style={{ background: 'var(--bg-card)' }}
          aria-label="Favori"
        >
          <Heart size={16} fill={post.isFavorite ? '#ff4b7d' : 'none'} style={{ color: post.isFavorite ? '#ff4b7d' : 'var(--text-primary)' }} />
        </button>
        <a href={post.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg cursor-pointer" style={{ background: 'var(--bg-card)' }} aria-label="Source">
          <ExternalLink size={16} style={{ color: 'var(--text-primary)' }} />
        </a>
        <button onClick={handleDelete} className="p-2 rounded-lg cursor-pointer" style={{ background: 'var(--bg-card)', color: '#f5a5a5' }} aria-label="Supprimer">
          <Trash2 size={16} />
        </button>
      </header>

      <div className="px-4 md:px-8 max-w-5xl mx-auto mt-6 grid md:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] gap-6">
        {/* Main player column */}
        <div className="flex flex-col gap-5 min-w-0">
          <div
            className="rounded-2xl overflow-hidden mx-auto"
            style={{
              background: 'black',
              width: '100%',
              maxWidth: post.platform === 'youtube' ? '100%' : '420px',
              aspectRatio: post.platform === 'youtube' ? '16/9' : '9/16',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {post.platform === 'youtube' && post.externalId ? (
              <iframe
                src={`https://www.youtube.com/embed/${post.externalId}?rel=0&modestbranding=1`}
                title={post.title || 'YouTube'}
                className="w-full h-full"
                allow="accelerated-2d-canvas; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : post.mediaUrl && !videoError ? (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  src={`/api/social/media-proxy?url=${encodeURIComponent(post.mediaUrl)}&platform=${post.platform}&postId=${post.id}`}
                  controls
                  playsInline
                  poster={post.thumbnailUrl}
                  className="w-full h-full"
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onError={() => setVideoError(true)}
                />
                {activeSubtitleText && (
                  <div
                    className="absolute left-0 right-0 flex justify-center pointer-events-none"
                    style={{ bottom: '48px' }}
                  >
                    <span
                      style={{
                        background: 'rgba(0, 0, 0, 0.78)',
                        color: '#ffffff',
                        fontSize: '1.05rem',
                        fontWeight: 500,
                        lineHeight: 1.5,
                        padding: '4px 12px',
                        borderRadius: '6px',
                        textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                        maxWidth: '90%',
                        textAlign: 'center',
                        wordBreak: 'break-word',
                      }}
                    >
                      {activeSubtitleText}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center p-6" style={{ color: 'var(--text-secondary)' }}>
                {post.thumbnailUrl && (
                  <Image src={post.thumbnailUrl} alt={post.title || ''} width={160} height={280} unoptimized className="rounded-xl object-cover" />
                )}
                <p className="text-xs">
                  {videoError ? 'Le lien vidéo a expiré.' : 'URL média non disponible.'}
                </p>
                <button
                  onClick={handleRefreshMedia}
                  disabled={refreshingVideo}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-opacity disabled:opacity-50"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  {refreshingVideo
                    ? <><Loader2 size={14} className="animate-spin" /> Récupération…</>
                    : '↻ Récupérer la vidéo'}
                </button>
                <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: 'var(--accent)' }}>
                  Ouvrir chez {platformLabel(post.platform)}
                </a>
              </div>
            )}
          </div>

          {/* Caption */}
          {post.caption && (
            <Card hoverable={false} glowColor="none">
              <div className="p-4">
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-primary)', lineHeight: 1.55 }}>
                  {post.caption}
                </p>
              </div>
            </Card>
          )}

          {/* AI Analysis section */}
          {analysis && (
            <Card hoverable={false} glowColor="gold">
              <div className="p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} style={{ color: 'var(--gold)' }} />
                  <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--gold)' }}>Analyse IA</h3>
                </div>
                {analysis.summary && (
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    {analysis.summary}
                  </p>
                )}

                {analysis.keyPoints.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <h4 className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Points clés</h4>
                    <ul className="flex flex-col gap-2">
                      {analysis.keyPoints.map((kp, i) => (
                        <li key={i} className="flex gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                          <span style={{ color: 'var(--gold)' }}>▸</span>
                          <span><strong>{kp.title}</strong>{kp.detail ? ` — ${kp.detail}` : ''}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.citations.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <h4 className="text-xs uppercase tracking-wide flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                      <BookOpen size={12} />Citations islamiques
                    </h4>
                    <div className="flex flex-col gap-2">
                      {analysis.citations.map((c, i) => (
                        <div key={i} className="rounded-lg p-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                          <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--gold)' }}>
                            {c.type} {c.reference ? `— ${c.reference}` : ''}
                          </div>
                          {c.arabic && (
                            <p className="text-right text-base" style={{ fontFamily: "'Amiri', serif", color: 'var(--text-primary)' }}>{c.arabic}</p>
                          )}
                          {c.text && <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>{c.text}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.topics.map((t, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
                      >
                        <Tag size={10} />{t.tag}
                      </span>
                    ))}
                  </div>
                )}

                {analysis.dubiousFlags.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <h4 className="text-xs uppercase tracking-wide flex items-center gap-1" style={{ color: '#f5a5a5' }}>
                      <AlertTriangle size={12} />À vérifier
                    </h4>
                    {analysis.dubiousFlags.map((f, i) => (
                      <div key={i} className="rounded-lg p-3 text-sm" style={{ background: 'rgba(220, 80, 80, 0.08)', border: '1px solid rgba(220, 80, 80, 0.2)', color: '#f5a5a5' }}>
                        <strong>{f.severity}:</strong> {f.reason}
                        {f.quote && <p className="italic mt-1 text-xs">« {f.quote} »</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Side column */}
        <aside className="flex flex-col gap-4 min-w-0">
          {error && (
            <div className="rounded-lg p-3 text-sm" style={{ background: 'rgba(220, 80, 80, 0.1)', color: '#f5a5a5', border: '1px solid rgba(220, 80, 80, 0.3)' }}>
              {error}
            </div>
          )}

          {/* Pipeline actions */}
          <Card hoverable={false}>
            <div className="p-4 flex flex-col gap-3">
              <h3 className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Pipeline IA</h3>

              <Button
                variant={transcript ? 'secondary' : 'primary'}
                size="sm"
                iconLeft={<Captions size={14} />}
                loading={working === 'transcribe'}
                onClick={handleTranscribe}
              >
                {transcript ? 'Re-transcrire' : '1. Transcrire'}
              </Button>

              {transcript && (
                <div className="flex flex-col gap-2">
                  <div className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                    2. Sous-titres traduits
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SUB_LANGS.map((l) => {
                      const existing = subtitles.find((s) => s.language === l.code);
                      return (
                        <button
                          key={l.code}
                          onClick={() => handleGenerateSubtitles(l.code)}
                          disabled={working === `subtitles-${l.code}`}
                          className="text-xs px-2.5 py-1 rounded-lg cursor-pointer flex items-center gap-1"
                          style={{
                            background: existing ? 'var(--accent)' : 'var(--bg-elevated)',
                            color: existing ? 'white' : 'var(--text-primary)',
                            border: '1px solid var(--border-subtle)',
                            opacity: working === `subtitles-${l.code}` ? 0.6 : 1,
                          }}
                        >
                          {working === `subtitles-${l.code}` ? <Loader2 size={11} className="animate-spin" /> : <span>{l.emoji}</span>}
                          {l.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {transcript && (
                <Button
                  variant={analysis ? 'secondary' : 'gold'}
                  size="sm"
                  iconLeft={<Sparkles size={14} />}
                  loading={working === 'analyze'}
                  onClick={handleAnalyze}
                >
                  {analysis ? 'Ré-analyser' : '3. Analyser avec l\'IA'}
                </Button>
              )}

              {frenchSubtitle ? (
                <Button
                  variant="gold"
                  size="sm"
                  iconLeft={<Download size={14} />}
                  loading={working === 'export-video'}
                  onClick={handleDownloadStyledVideo}
                >
                  4. Export MP4 Ilmify
                </Button>
              ) : transcript ? (
                <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                  Genere une piste FR pour exporter un MP4 avec sous-titres incrustes.
                </p>
              ) : null}
            </div>
          </Card>

          {/* Annotations */}
          <Card hoverable={false}>
            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={14} style={{ color: 'var(--text-secondary)' }} />
                <h3 className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Mes notes</h3>
                <span className="text-[11px] px-1.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                  {annotations.length}
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  value={newAnnotation}
                  onChange={(e) => setNewAnnotation(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddAnnotation(); }}
                  placeholder={`Note à ${formatTime(currentTime)}…`}
                  className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
                />
                <Button variant="primary" size="sm" iconLeft={<Plus size={12} />} onClick={handleAddAnnotation} disabled={!newAnnotation.trim()}>
                  Ajouter
                </Button>
              </div>

              <div className="flex flex-col gap-1.5 max-h-80 overflow-y-auto">
                {annotations.map((a) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-2 rounded-lg p-2 group"
                    style={{ background: 'var(--bg-elevated)' }}
                  >
                    <button
                      onClick={() => handleSeek(a.timeSec)}
                      className="text-[11px] font-mono px-1.5 py-0.5 rounded cursor-pointer"
                      style={{ background: 'var(--accent)', color: 'white' }}
                    >
                      {formatTime(a.timeSec)}
                    </button>
                    <p className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>{a.text}</p>
                    <button
                      onClick={() => handleDeleteAnnotation(a.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={12} style={{ color: '#f5a5a5' }} />
                    </button>
                  </motion.div>
                ))}
                {annotations.length === 0 && (
                  <p className="text-xs text-center py-3" style={{ color: 'var(--text-secondary)' }}>
                    Aucune note. Ajoute des repères à des moments clés.
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Stats */}
          {post.durationSec && (
            <Card hoverable={false}>
              <div className="p-4 grid grid-cols-2 gap-3 text-center">
                <Stat label="Durée" value={formatTime(post.durationSec)} />
                {post.stats.views != null && <Stat label="Vues" value={formatCount(post.stats.views)} />}
                {post.stats.likes != null && <Stat label="Likes" value={formatCount(post.stats.likes)} />}
                {post.stats.comments != null && <Stat label="Commentaires" value={formatCount(post.stats.comments)} />}
              </div>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>{label}</div>
    </div>
  );
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function getDownloadName(contentDisposition: string | null, fallbackTitle: string): string {
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="([^"]+)"/i);
    if (match?.[1]) return match[1];
  }

  const safeBase = fallbackTitle
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .toLowerCase();

  return `${safeBase || 'ilmify-social-export'}.mp4`;
}

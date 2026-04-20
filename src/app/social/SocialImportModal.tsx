'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, Loader2, X, Sparkles } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { parseSocialUrl, platformLabel } from '@/lib/social/platforms';
import { socialPostRepository } from '@/lib/repositories/socialPostRepository';
import { translateSegments } from '@/lib/ai/socialAI';
import { buildVtt } from '@/lib/social/vtt';
import type { SocialPost } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onImported: (post: SocialPost) => void;
}

type Stage = 'idle' | 'parsing' | 'importing' | 'saving' | 'transcribing' | 'translating' | 'done' | 'error';

export default function SocialImportModal({ isOpen, onClose, userId, onImported }: Props) {
  const [url, setUrl] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [message, setMessage] = useState('');

  const reset = () => {
    setUrl('');
    setStage('idle');
    setMessage('');
  };

  const handleImport = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    const parsed = parseSocialUrl(trimmed);
    if (!parsed) {
      setStage('error');
      setMessage('URL non reconnue. Support : TikTok, Instagram, X/Twitter, YouTube.');
      return;
    }

    // 1. Check if already imported
    try {
      const existing = await socialPostRepository.getByUrl(userId, parsed.canonicalUrl);
      if (existing) {
        onImported(existing);
        reset();
        onClose();
        return;
      }
    } catch { /* ignore */ }

    // 2. Call /api/social/import
    setStage('importing');
    setMessage(`Extraction depuis ${platformLabel(parsed.platform)}…`);

    try {
      const res = await fetch('/api/social/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erreur API (${res.status})`);
      }
      const data = await res.json();

      // 3. Save to Supabase
      setStage('saving');
      setMessage('Sauvegarde dans ta bibliothèque…');

      const saved = await socialPostRepository.create(userId, {
        url: data.url,
        platform: data.platform,
        externalId: data.externalId,
        title: data.title,
        author: data.author,
        authorAvatarUrl: data.authorAvatarUrl,
        caption: data.caption,
        thumbnailUrl: data.thumbnailUrl,
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType || 'video',
        durationSec: data.durationSec,
        stats: data.stats || {},
        tags: [],
        isFavorite: false,
        isArchived: false,
      });

      // 4. Auto-transcribe
      setStage('transcribing');
      setMessage('Transcription audio en cours…');

      try {
        const tRes = await fetch('/api/social/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmed }),
        });
        if (tRes.ok) {
          const tData = await tRes.json() as {
            text: string;
            language: string;
            segments: Array<{ start: number; end: number; text: string }>;
          };

          const transcript = await socialPostRepository.upsertTranscript(userId, saved.id, {
            sourceLanguage: tData.language,
            text: tData.text,
            segments: tData.segments,
          });

          // Save original-language subtitle track
          if (transcript.segments.length > 0) {
            const origVtt = buildVtt(transcript.segments);
            await socialPostRepository.upsertSubtitle(userId, saved.id, {
              language: transcript.sourceLanguage || 'auto',
              label: transcript.sourceLanguage === 'fr' ? 'Français' : transcript.sourceLanguage === 'ar' ? 'العربية' : transcript.sourceLanguage === 'en' ? 'English' : 'Original',
              vttContent: origVtt,
              isOriginal: true,
            });
          }

          // 5. Auto-translate to French if not already French
          if (tData.language !== 'fr' && tData.segments.length > 0) {
            setStage('translating');
            setMessage('Traduction des sous-titres en français…');
            try {
              const frSegments = await translateSegments(tData.segments, 'fr', tData.language);
              const frVtt = buildVtt(frSegments);
              await socialPostRepository.upsertSubtitle(userId, saved.id, {
                language: 'fr',
                label: 'Français',
                vttContent: frVtt,
                isOriginal: false,
              });
            } catch (e) {
              console.warn('Auto-traduction FR échouée:', e);
            }
          }
        }
      } catch (e) {
        console.warn('Auto-transcription échouée:', e);
      }

      setStage('done');
      onImported(saved);
      reset();
      onClose();
    } catch (err) {
      setStage('error');
      setMessage(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  const busy = stage === 'importing' || stage === 'saving' || stage === 'transcribing' || stage === 'translating';

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { if (!busy) { reset(); onClose(); } }}
      title="Importer un post"
      maxWidth="32rem"
    >
      <div className="p-5 flex flex-col gap-4">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Colle un lien TikTok, Instagram Reels, X (Twitter) ou YouTube.
        </p>

        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
            URL
          </label>
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)' }}>
            <Link2 size={16} style={{ color: 'var(--text-secondary)' }} />
            <input
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); if (stage === 'error') setStage('idle'); }}
              placeholder="https://www.tiktok.com/@user/video/..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: 'var(--text-primary)' }}
              disabled={busy}
            />
            {url && !busy && (
              <button onClick={() => setUrl('')} className="cursor-pointer" aria-label="Effacer">
                <X size={14} style={{ color: 'var(--text-secondary)' }} />
              </button>
            )}
          </div>
        </div>

        {stage === 'error' && (
          <div className="rounded-lg p-3 text-sm" style={{ background: 'rgba(220, 80, 80, 0.1)', color: '#f5a5a5', border: '1px solid rgba(220, 80, 80, 0.3)' }}>
            {message}
          </div>
        )}

        {busy && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm"
            style={{ color: 'var(--accent)' }}
          >
            <Loader2 size={14} className="animate-spin" />
            {message}
          </motion.div>
        )}

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="ghost" onClick={() => { if (!busy) { reset(); onClose(); } }} disabled={busy}>Annuler</Button>
          <Button
            variant="primary"
            onClick={handleImport}
            loading={busy}
            iconLeft={!busy ? <Sparkles size={14} /> : undefined}
            disabled={!url.trim()}
          >
            Importer
          </Button>
        </div>
      </div>
    </Modal>
  );
}

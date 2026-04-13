'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Play, Trash2, Loader2 } from 'lucide-react';

interface AudioRecorderProps {
  onSave: (audioDataUrl: string, fileName: string) => void;
  onCancel: () => void;
}

export default function AudioRecorder({ onSave, onCancel }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [processing, setProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch {
      alert('Impossible d\'accéder au microphone. Vérifiez les permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const handleSave = useCallback(async () => {
    if (!audioUrl) return;
    setProcessing(true);
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const fileName = `note_vocale_${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
        onSave(dataUrl, fileName);
      };
      reader.readAsDataURL(blob);
    } catch {
      onCancel();
    }
  }, [audioUrl, onSave, onCancel]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  };

  return (
    <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: isRecording ? 'rgba(239,68,68,0.15)' : 'rgba(46,158,140,0.1)',
            animation: isRecording ? 'pulse 1.5s ease-in-out infinite' : undefined,
          }}
        >
          <Mic size={18} style={{ color: isRecording ? '#ef4444' : '#2e9e8c' }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {isRecording ? 'Enregistrement en cours...' : audioUrl ? 'Enregistrement terminé' : 'Note vocale'}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDuration(duration)}</p>
        </div>
      </div>

      {/* Playback */}
      {audioUrl && !isRecording && (
        <div className="mb-3">
          <audio src={audioUrl} controls className="w-full h-10" style={{ filter: 'invert(0.85) hue-rotate(180deg)' }} />
        </div>
      )}

      <div className="flex items-center gap-2">
        {!audioUrl && !isRecording && (
          <button
            onClick={startRecording}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all"
            style={{ background: 'rgba(46,158,140,0.1)', color: '#2e9e8c', border: '1px solid rgba(46,158,140,0.2)' }}
          >
            <Mic size={13} /> Enregistrer
          </button>
        )}
        {isRecording && (
          <button
            onClick={stopRecording}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <Square size={13} /> Arrêter
          </button>
        )}
        {audioUrl && !isRecording && (
          <>
            <button
              onClick={handleSave}
              disabled={processing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all"
              style={{ background: 'rgba(46,158,140,0.1)', color: '#2e9e8c', border: '1px solid rgba(46,158,140,0.2)' }}
            >
              {processing ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />} Sauvegarder
            </button>
            <button
              onClick={() => { if (audioUrl) URL.revokeObjectURL(audioUrl); setAudioUrl(null); setDuration(0); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all"
              style={{ background: 'rgba(239,68,68,0.06)', color: '#f87171', border: '1px solid rgba(239,68,68,0.1)' }}
            >
              <Trash2 size={13} /> Supprimer
            </button>
          </>
        )}
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ml-auto"
          style={{ color: 'var(--text-muted)' }}
        >
          Annuler
        </button>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

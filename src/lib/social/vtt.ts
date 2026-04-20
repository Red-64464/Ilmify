import type { TranscriptSegment } from '@/types';

/** Formate un nombre de secondes en timestamp WebVTT HH:MM:SS.mmm */
export function formatVttTimestamp(seconds: number): string {
  const s = Math.max(0, seconds);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  const ms = Math.floor((s - Math.floor(s)) * 1000);
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  const mmm = String(ms).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${mmm}`;
}

/** Construit un fichier WebVTT à partir de segments */
export function buildVtt(segments: TranscriptSegment[], label?: string): string {
  const lines: string[] = ['WEBVTT'];
  if (label) lines.push(`NOTE ${label}`);
  lines.push('');
  segments.forEach((seg, i) => {
    if (!seg.text?.trim()) return;
    lines.push(String(i + 1));
    lines.push(`${formatVttTimestamp(seg.start)} --> ${formatVttTimestamp(seg.end)}`);
    lines.push(seg.text.replace(/\r?\n/g, ' ').trim());
    lines.push('');
  });
  return lines.join('\n');
}

/** Parse un WebVTT vers des segments — utile pour re-traduire */
export function parseVtt(vtt: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const blocks = vtt.split(/\r?\n\r?\n/);
  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;
    const timeLine = lines.find((l) => l.includes('-->'));
    if (!timeLine) continue;
    const [startStr, endStr] = timeLine.split('-->').map((s) => s.trim().split(' ')[0]);
    const text = lines.slice(lines.indexOf(timeLine) + 1).join(' ');
    const start = parseVttTime(startStr);
    const end = parseVttTime(endStr);
    if (Number.isFinite(start) && Number.isFinite(end) && text) {
      segments.push({ start, end, text });
    }
  }
  return segments;
}

function parseVttTime(s: string): number {
  const m = s.match(/^(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})$/);
  if (!m) {
    const m2 = s.match(/^(\d{1,2}):(\d{2})[.,](\d{1,3})$/);
    if (m2) return parseInt(m2[1]) * 60 + parseInt(m2[2]) + parseInt(m2[3]) / 1000;
    return NaN;
  }
  return parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseInt(m[3]) + parseInt(m[4]) / 1000;
}

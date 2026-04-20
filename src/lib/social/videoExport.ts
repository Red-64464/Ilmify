import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { resolveSocialMedia } from '@/lib/social/resolvers';
import { parseVtt } from '@/lib/social/vtt';
import type { SocialPlatform } from '@/types';

const require = createRequire(import.meta.url);
const ffmpegPath = require('ffmpeg-static') as string | null;

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

type AspectMode = 'portrait' | 'landscape';

interface VideoCandidate {
  url: string;
  source: string;
  headers: Record<string, string>;
}

interface VideoDimensions {
  width: number;
  height: number;
}

export interface ExportStyledVideoInput {
  url: string;
  platform: SocialPlatform;
  externalId?: string;
  title?: string;
  subtitleVtt: string;
  aspectMode?: AspectMode;
}

export interface ExportStyledVideoResult {
  buffer: Buffer;
  fileName: string;
}

export async function exportStyledSocialVideo(
  input: ExportStyledVideoInput,
): Promise<ExportStyledVideoResult> {
  if (!ffmpegPath) {
    throw new Error('FFmpeg non disponible sur ce serveur.');
  }

  const segments = parseVtt(input.subtitleVtt);
  if (segments.length === 0) {
    throw new Error('Aucune piste de sous-titres exploitable n a ete trouvee.');
  }

  const tempDir = await mkdtemp(join(tmpdir(), 'ilmify-social-export-'));
  const inputPath = join(tempDir, 'source.mp4');
  const subtitlePath = join(tempDir, 'styled.ass');
  const outputPath = join(tempDir, 'output.mp4');

  try {
    await downloadBestSource({
      url: input.url,
      platform: input.platform,
      externalId: input.externalId,
      destPath: inputPath,
    });

    const dimensions = await probeVideoDimensions(tempDir);
    const assContent = buildIlmifyAss(
      input.subtitleVtt,
      dimensions,
      input.aspectMode || defaultAspect(input.platform),
    );
    await writeFile(subtitlePath, assContent, 'utf8');

    await runFfmpeg(tempDir);

    return {
      buffer: await readFile(outputPath),
      fileName: buildFileName(input.title),
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function downloadBestSource(args: {
  url: string;
  platform: SocialPlatform;
  externalId?: string;
  destPath: string;
}): Promise<void> {
  const candidates = await getVideoCandidates(args.url, args.platform, args.externalId);
  if (candidates.length === 0) {
    throw new Error('Impossible de trouver une source video exportable pour ce post.');
  }

  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      await downloadToFile(candidate.url, args.destPath, candidate.headers);
      return;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error('Le telechargement de la video a echoue.');
}

async function getVideoCandidates(
  url: string,
  platform: SocialPlatform,
  externalId?: string,
): Promise<VideoCandidate[]> {
  const headers = buildSourceHeaders(platform);
  const candidates: VideoCandidate[] = [];

  if (/^https?:\/\/.+\.(mp4|webm|mov|m4v)(?:\?.*)?$/i.test(url)) {
    candidates.push({
      url,
      source: 'direct-url',
      headers,
    });
  }

  const resolved = await resolveSocialMedia(platform, url, externalId);
  if (resolved?.mediaUrl) {
    candidates.push({
      url: resolved.mediaUrl,
      source: resolved.source,
      headers,
    });
  }

  try {
    const ydl = await fetchViaYtDlp(url);
    const playable = pickPlayableUrl(ydl);
    if (playable) {
      candidates.push({
        url: playable,
        source: 'ytdlp',
        headers,
      });
    }
  } catch {
    // Direct resolvers already tried first.
  }

  return dedupeCandidates(candidates);
}

function dedupeCandidates(candidates: VideoCandidate[]): VideoCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (seen.has(candidate.url)) return false;
    seen.add(candidate.url);
    return true;
  });
}

async function downloadToFile(
  url: string,
  destPath: string,
  headers: Record<string, string>,
): Promise<void> {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Telechargement video echoue (${response.status}).`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength < 1024) {
    throw new Error('La source video recue est trop petite ou invalide.');
  }

  await writeFile(destPath, buffer);
}

function buildSourceHeaders(platform: SocialPlatform): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': UA,
    Accept: '*/*',
  };

  const referer = refererFor(platform);
  if (referer) headers.Referer = referer;

  return headers;
}

function refererFor(platform: SocialPlatform): string {
  switch (platform) {
    case 'tiktok':
      return 'https://www.tiktok.com/';
    case 'instagram':
      return 'https://www.instagram.com/';
    case 'twitter':
      return 'https://twitter.com/';
    case 'youtube':
      return 'https://www.youtube.com/';
    default:
      return '';
  }
}

async function runFfmpeg(cwd: string): Promise<void> {
  await spawnProcess(
    ffmpegPath!,
    [
      '-y',
      '-hide_banner',
      '-loglevel',
      'error',
      '-i',
      'source.mp4',
      '-map',
      '0:v:0',
      '-map',
      '0:a?',
      '-vf',
      'ass=styled.ass',
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '22',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-movflags',
      '+faststart',
      'output.mp4',
    ],
    cwd,
  );
}

function spawnProcess(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      windowsHide: true,
    });

    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr.trim() || `FFmpeg a quitte avec le code ${code}.`));
    });
  });
}

async function probeVideoDimensions(cwd: string): Promise<VideoDimensions> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      ffmpegPath!,
      ['-hide_banner', '-i', 'source.mp4'],
      { cwd, windowsHide: true },
    );

    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', () => {
      const match = stderr.match(/Video:\s.*?(\d{2,5})x(\d{2,5})[\s,]/);
      if (!match) {
        resolve({ width: 1280, height: 720 });
        return;
      }

      resolve({
        width: parseInt(match[1], 10),
        height: parseInt(match[2], 10),
      });
    });
  });
}

function buildIlmifyAss(
  vttContent: string,
  dimensions: VideoDimensions,
  fallbackAspectMode: AspectMode,
): string {
  const segments = parseVtt(vttContent);
  const aspectMode =
    dimensions.height > dimensions.width ? 'portrait' : dimensions.width > dimensions.height ? 'landscape' : fallbackAspectMode;
  const portrait = aspectMode === 'portrait';
  const playResX = dimensions.width;
  const playResY = dimensions.height;
  const fontSize = clamp(
    Math.round(dimensions.height * (portrait ? 0.048 : 0.065)),
    portrait ? 24 : 22,
    portrait ? 56 : 42,
  );
  const marginX = Math.round(dimensions.width * (portrait ? 0.1 : 0.09));
  const marginV = Math.round(dimensions.height * (portrait ? 0.12 : 0.085));
  const maxCharsPerLine = portrait ? 24 : 40;
  const maxLines = portrait ? 3 : 2;

  const events = segments
    .map((segment) => {
      const text = wrapSubtitleText(
        cleanSubtitleText(segment.text),
        maxCharsPerLine,
        maxLines,
      );
      if (!text) return null;

      return [
        'Dialogue: 0',
        toAssTime(segment.start),
        toAssTime(segment.end),
        'Ilmify',
        '',
        '0',
        '0',
        '0',
        '',
        `{\\blur0.6}${escapeAssText(text).replace(/\n/g, '\\N')}`,
      ].join(',');
    })
    .filter(Boolean)
    .join('\n');

  return `[Script Info]
Title: Ilmify Styled Export
ScriptType: v4.00+
PlayResX: ${playResX}
PlayResY: ${playResY}
ScaledBorderAndShadow: yes
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Ilmify,Arial,${fontSize},&H00DDE9EF,&H004AADD4,&H22434A0F,&H001D4B65,-1,0,0,0,100,100,0.2,0,3,3.2,0,2,${marginX},${marginX},${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${events}
`;
}

function cleanSubtitleText(text: string): string {
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wrapSubtitleText(text: string, maxCharsPerLine: number, maxLines: number): string {
  if (!text) return '';

  const words = text.split(' ').filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];
    const candidate = current ? `${current} ${word}` : word;

    if (candidate.length <= maxCharsPerLine || !current) {
      current = candidate;
      continue;
    }

    lines.push(current);
    current = word;

    if (lines.length === maxLines - 1) {
      lines.push([current, ...words.slice(index + 1)].join(' '));
      current = '';
      break;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.slice(0, maxLines).join('\n');
}

function escapeAssText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/{/g, '(').replace(/}/g, ')');
}

function toAssTime(seconds: number): string {
  const safe = Math.max(0, seconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = Math.floor(safe % 60);
  const centis = Math.round((safe - Math.floor(safe)) * 100);

  return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
}

function defaultAspect(platform: SocialPlatform): AspectMode {
  return platform === 'youtube' ? 'landscape' : 'portrait';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function buildFileName(title?: string): string {
  const base = sanitizeFileName(title || 'ilmify-social-export');
  return `${base || 'ilmify-social-export'}-ilmify.mp4`;
}

function sanitizeFileName(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .toLowerCase();
}

async function fetchViaYtDlp(url: string): Promise<Record<string, unknown>> {
  const mod = await import('youtube-dl-exec');
  const youtubedl =
    (mod as unknown as { default: typeof import('youtube-dl-exec').default }).default ??
    (mod as unknown as typeof import('youtube-dl-exec').default);

  const info = await youtubedl(url, {
    dumpSingleJson: true,
    noCheckCertificates: true,
    noWarnings: true,
    preferFreeFormats: true,
  });

  return info as unknown as Record<string, unknown>;
}

function pickPlayableUrl(info: Record<string, unknown>): string | undefined {
  const top = info.url as string | undefined;
  if (top && top.startsWith('http')) {
    return top;
  }

  const formats = (info.formats as Array<Record<string, unknown>>) || [];
  const combined = formats.filter(
    (format) =>
      format.vcodec &&
      format.vcodec !== 'none' &&
      format.acodec &&
      format.acodec !== 'none' &&
      typeof format.url === 'string',
  );

  if (combined.length > 0) {
    combined.sort((left, right) => {
      const leftMp4 = left.ext === 'mp4' ? 0 : 1;
      const rightMp4 = right.ext === 'mp4' ? 0 : 1;
      if (leftMp4 !== rightMp4) return leftMp4 - rightMp4;
      return ((right.tbr as number) || 0) - ((left.tbr as number) || 0);
    });
    return combined[0].url as string;
  }

  const any = formats.find((format) => typeof format.url === 'string');
  return any?.url as string | undefined;
}

import { NextRequest, NextResponse } from 'next/server';
import { exportStyledSocialVideo } from '@/lib/social/videoExport';
import type { SocialPlatform } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

interface ExportRequestBody {
  url?: string;
  platform?: SocialPlatform;
  externalId?: string;
  title?: string;
  subtitleVtt?: string;
  aspectMode?: 'portrait' | 'landscape';
}

const SUPPORTED_PLATFORMS = new Set<SocialPlatform>([
  'tiktok',
  'instagram',
  'twitter',
  'youtube',
  'other',
]);

export async function POST(req: NextRequest): Promise<Response> {
  let body: ExportRequestBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
  }

  const url = (body.url || '').trim();
  const subtitleVtt = (body.subtitleVtt || '').trim();
  const platform = body.platform;

  if (!url) {
    return NextResponse.json({ error: 'URL manquante' }, { status: 400 });
  }

  if (!subtitleVtt) {
    return NextResponse.json({ error: 'Sous-titres FR manquants' }, { status: 400 });
  }

  if (!platform || !SUPPORTED_PLATFORMS.has(platform)) {
    return NextResponse.json({ error: 'Plateforme non supportee' }, { status: 400 });
  }

  try {
    const result = await exportStyledSocialVideo({
      url,
      platform,
      externalId: body.externalId,
      title: body.title,
      subtitleVtt,
      aspectMode: body.aspectMode,
    });

    return new NextResponse(result.buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': String(result.buffer.byteLength),
        'Content-Disposition': `attachment; filename="${result.fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Export MP4 impossible';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

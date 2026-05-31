import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveSocialMedia } from '@/lib/social/resolvers';
import { parseSocialUrl } from '@/lib/social/platforms';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'ilmify' } },
  );
  const { postId } = await req.json().catch(() => ({}));
  if (!postId) return NextResponse.json({ error: 'postId requis' }, { status: 400 });

  const { data: post, error } = await supabaseAdmin
    .from('social_posts')
    .select('id, url, platform, external_id')
    .eq('id', postId)
    .single();

  if (error || !post) return NextResponse.json({ error: 'Post introuvable' }, { status: 404 });

  const parsed = parseSocialUrl(post.url);
  const resolved = await resolveSocialMedia(
    post.platform as Parameters<typeof resolveSocialMedia>[0],
    parsed?.canonicalUrl ?? post.url,
    post.external_id ?? undefined,
  );

  if (!resolved?.mediaUrl) {
    return NextResponse.json({ error: 'Impossible de résoudre le lien vidéo' }, { status: 502 });
  }

  await supabaseAdmin
    .from('social_posts')
    .update({ media_url: resolved.mediaUrl, updated_at: new Date().toISOString() })
    .eq('id', postId);

  return NextResponse.json({ mediaUrl: resolved.mediaUrl });
}

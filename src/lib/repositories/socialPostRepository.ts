import type {
  SocialPost,
  SocialPlatform,
  SocialTranscript,
  SocialSubtitle,
  SocialAnnotation,
  SocialAnalysis,
  TranscriptSegment,
  IslamicCitation,
  KeyPoint,
  DubiousFlag,
  SocialPostStats,
} from '@/types';
import type { Json } from '@/lib/supabase/types';
import { supabase } from '@/lib/supabase/client';

// ── Row mappers ──
function rowToPost(row: Record<string, unknown>): SocialPost {
  return {
    id: row.id as string,
    url: row.url as string,
    platform: row.platform as SocialPlatform,
    externalId: (row.external_id as string) || undefined,
    title: (row.title as string) || undefined,
    author: (row.author as string) || undefined,
    authorAvatarUrl: (row.author_avatar_url as string) || undefined,
    caption: (row.caption as string) || undefined,
    thumbnailUrl: (row.thumbnail_url as string) || undefined,
    mediaUrl: (row.media_url as string) || undefined,
    mediaType: (row.media_type as 'video' | 'image' | 'audio') || 'video',
    durationSec: (row.duration_sec as number) ?? undefined,
    stats: (row.stats as SocialPostStats) || {},
    themeTag: (row.theme_tag as string) || undefined,
    tags: (row.tags as string[]) || [],
    isFavorite: !!row.is_favorite,
    isArchived: !!row.is_archived,
    importedAt: row.imported_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToTranscript(row: Record<string, unknown>): SocialTranscript {
  return {
    id: row.id as string,
    postId: row.post_id as string,
    sourceLanguage: (row.source_language as string) || undefined,
    text: (row.text as string) || '',
    segments: (row.segments as TranscriptSegment[]) || [],
    createdAt: row.created_at as string,
  };
}

function rowToSubtitle(row: Record<string, unknown>): SocialSubtitle {
  return {
    id: row.id as string,
    postId: row.post_id as string,
    language: row.language as string,
    label: (row.label as string) || undefined,
    vttContent: row.vtt_content as string,
    isOriginal: !!row.is_original,
    createdAt: row.created_at as string,
  };
}

function rowToAnnotation(row: Record<string, unknown>): SocialAnnotation {
  return {
    id: row.id as string,
    postId: row.post_id as string,
    timeSec: (row.time_sec as number) || 0,
    text: (row.text as string) || '',
    color: (row.color as string) || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToAnalysis(row: Record<string, unknown>): SocialAnalysis {
  return {
    id: row.id as string,
    postId: row.post_id as string,
    summary: (row.summary as string) || undefined,
    keyPoints: (row.key_points as KeyPoint[]) || [],
    citations: (row.citations as IslamicCitation[]) || [],
    topics: (row.topics as Array<{ tag: string; description?: string }>) || [],
    dubiousFlags: (row.dubious_flags as DubiousFlag[]) || [],
    languageDetected: (row.language_detected as string) || undefined,
    createdAt: row.created_at as string,
  };
}

export const socialPostRepository = {
  // ── Posts ──
  async list(): Promise<SocialPost[]> {
    const { data, error } = await supabase
      .from('social_posts')
      .select('*')
      .eq('is_archived', false)
      .order('imported_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(rowToPost);
  },

  async listByPlatform(platform: SocialPlatform): Promise<SocialPost[]> {
    const { data, error } = await supabase
      .from('social_posts')
      .select('*')
      .eq('platform', platform)
      .eq('is_archived', false)
      .order('imported_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(rowToPost);
  },

  async listByTheme(themeTag: string): Promise<SocialPost[]> {
    const { data, error } = await supabase
      .from('social_posts')
      .select('*')
      .eq('theme_tag', themeTag)
      .order('imported_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(rowToPost);
  },

  async getById(id: string): Promise<SocialPost | null> {
    const { data, error } = await supabase
      .from('social_posts')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return rowToPost(data);
  },

  async getByUrl(userId: string, url: string): Promise<SocialPost | null> {
    const { data, error } = await supabase
      .from('social_posts')
      .select('*')
      .eq('user_id', userId)
      .eq('url', url)
      .maybeSingle();
    if (error) return null;
    return data ? rowToPost(data) : null;
  },

  async create(
    userId: string,
    input: Omit<SocialPost, 'id' | 'importedAt' | 'updatedAt'>,
  ): Promise<SocialPost> {
    const { data, error } = await supabase
      .from('social_posts')
      .insert({
        user_id: userId,
        url: input.url,
        platform: input.platform,
        external_id: input.externalId || null,
        title: input.title || null,
        author: input.author || null,
        author_avatar_url: input.authorAvatarUrl || null,
        caption: input.caption || null,
        thumbnail_url: input.thumbnailUrl || null,
        media_url: input.mediaUrl || null,
        media_type: input.mediaType || 'video',
        duration_sec: input.durationSec ?? null,
        stats: (input.stats || {}) as unknown as Json,
        theme_tag: input.themeTag || null,
        tags: input.tags || [],
        is_favorite: input.isFavorite || false,
        is_archived: input.isArchived || false,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return rowToPost(data);
  },

  async update(id: string, updates: Partial<SocialPost>): Promise<SocialPost | null> {
    const db: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) db.title = updates.title || null;
    if (updates.caption !== undefined) db.caption = updates.caption || null;
    if (updates.thumbnailUrl !== undefined) db.thumbnail_url = updates.thumbnailUrl || null;
    if (updates.mediaUrl !== undefined) db.media_url = updates.mediaUrl || null;
    if (updates.durationSec !== undefined) db.duration_sec = updates.durationSec ?? null;
    if (updates.stats !== undefined) db.stats = updates.stats as unknown as Json;
    if (updates.themeTag !== undefined) db.theme_tag = updates.themeTag || null;
    if (updates.tags !== undefined) db.tags = updates.tags;
    if (updates.isFavorite !== undefined) db.is_favorite = updates.isFavorite;
    if (updates.isArchived !== undefined) db.is_archived = updates.isArchived;

    const { data, error } = await supabase
      .from('social_posts')
      .update(db)
      .eq('id', id)
      .select()
      .single();
    if (error) return null;
    return rowToPost(data);
  },

  async remove(id: string): Promise<boolean> {
    const { error } = await supabase.from('social_posts').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },

  // ── Transcripts ──
  async getTranscript(postId: string): Promise<SocialTranscript | null> {
    const { data, error } = await supabase
      .from('social_post_transcripts')
      .select('*')
      .eq('post_id', postId)
      .maybeSingle();
    if (error) return null;
    return data ? rowToTranscript(data) : null;
  },

  async upsertTranscript(
    userId: string,
    postId: string,
    payload: { sourceLanguage?: string; text: string; segments: TranscriptSegment[] },
  ): Promise<SocialTranscript> {
    const { data, error } = await supabase
      .from('social_post_transcripts')
      .upsert(
        {
          post_id: postId,
          user_id: userId,
          source_language: payload.sourceLanguage || null,
          text: payload.text,
          segments: payload.segments as unknown as Json,
        },
        { onConflict: 'post_id' },
      )
      .select()
      .single();
    if (error) throw new Error(error.message);
    return rowToTranscript(data);
  },

  // ── Subtitles ──
  async listSubtitles(postId: string): Promise<SocialSubtitle[]> {
    const { data, error } = await supabase
      .from('social_post_subtitles')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(rowToSubtitle);
  },

  async upsertSubtitle(
    userId: string,
    postId: string,
    payload: { language: string; label?: string; vttContent: string; isOriginal?: boolean },
  ): Promise<SocialSubtitle> {
    const { data, error } = await supabase
      .from('social_post_subtitles')
      .upsert(
        {
          post_id: postId,
          user_id: userId,
          language: payload.language,
          label: payload.label || null,
          vtt_content: payload.vttContent,
          is_original: !!payload.isOriginal,
        },
        { onConflict: 'post_id,language' },
      )
      .select()
      .single();
    if (error) throw new Error(error.message);
    return rowToSubtitle(data);
  },

  async deleteSubtitle(postId: string, language: string): Promise<boolean> {
    const { error } = await supabase
      .from('social_post_subtitles')
      .delete()
      .eq('post_id', postId)
      .eq('language', language);
    if (error) throw new Error(error.message);
    return true;
  },

  // ── Annotations ──
  async listAnnotations(postId: string): Promise<SocialAnnotation[]> {
    const { data, error } = await supabase
      .from('social_post_annotations')
      .select('*')
      .eq('post_id', postId)
      .order('time_sec', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(rowToAnnotation);
  },

  async createAnnotation(
    userId: string,
    postId: string,
    payload: { timeSec: number; text: string; color?: string },
  ): Promise<SocialAnnotation> {
    const { data, error } = await supabase
      .from('social_post_annotations')
      .insert({
        post_id: postId,
        user_id: userId,
        time_sec: payload.timeSec,
        text: payload.text,
        color: payload.color || null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return rowToAnnotation(data);
  },

  async deleteAnnotation(id: string): Promise<boolean> {
    const { error } = await supabase.from('social_post_annotations').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },

  // ── Analyses ──
  async getAnalysis(postId: string): Promise<SocialAnalysis | null> {
    const { data, error } = await supabase
      .from('social_post_analyses')
      .select('*')
      .eq('post_id', postId)
      .maybeSingle();
    if (error) return null;
    return data ? rowToAnalysis(data) : null;
  },

  async upsertAnalysis(
    userId: string,
    postId: string,
    payload: Omit<SocialAnalysis, 'id' | 'postId' | 'createdAt'>,
  ): Promise<SocialAnalysis> {
    const { data, error } = await supabase
      .from('social_post_analyses')
      .upsert(
        {
          post_id: postId,
          user_id: userId,
          summary: payload.summary || null,
          key_points: (payload.keyPoints || []) as unknown as Json,
          citations: (payload.citations || []) as unknown as Json,
          topics: (payload.topics || []) as unknown as Json,
          dubious_flags: (payload.dubiousFlags || []) as unknown as Json,
          language_detected: payload.languageDetected || null,
        },
        { onConflict: 'post_id' },
      )
      .select()
      .single();
    if (error) throw new Error(error.message);
    return rowToAnalysis(data);
  },
};

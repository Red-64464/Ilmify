import type { QuranMemorization, QuranBookmark, QuranReadingPosition, QuranSettings } from '@/types';
import { supabase } from '@/lib/supabase/client';

// --- Mappers ---

function rowToMemorization(row: Record<string, unknown>): QuranMemorization {
  return {
    id: row.id as string,
    surahNumber: row.surah_number as number,
    status: row.status as QuranMemorization['status'],
    memorizedAyahs: (row.memorized_ayahs as number[]) || [],
    lastReviewedAt: (row.last_reviewed_at as string) || undefined,
    startedAt: (row.started_at as string) || undefined,
    completedAt: (row.completed_at as string) || undefined,
    reviewCount: (row.review_count as number) || 0,
    notes: (row.notes as string) || undefined,
  };
}

function rowToBookmark(row: Record<string, unknown>): QuranBookmark {
  return {
    id: row.id as string,
    surahNumber: row.surah_number as number,
    ayahNumber: row.ayah_number as number,
    note: (row.note as string) || undefined,
    category: row.category as QuranBookmark['category'],
    createdAt: row.created_at as string,
  };
}

function rowToPosition(row: Record<string, unknown>): QuranReadingPosition {
  return {
    surahNumber: row.surah_number as number,
    ayahNumber: row.ayah_number as number,
    juzNumber: (row.juz_number as number) || undefined,
    timestamp: row.updated_at as string,
  };
}

function rowToSettings(row: Record<string, unknown>): QuranSettings {
  return {
    reciterId: row.reciter_id as number,
    arabicFontSize: row.arabic_font_size as number,
    translationLang: row.translation_lang as QuranSettings['translationLang'],
    showTransliteration: row.show_transliteration as boolean,
  };
}

// --- Repository ---

export const quranRepository = {
  // ── Memorization ──

  async getMemorizations(userId: string): Promise<QuranMemorization[]> {
    const { data, error } = await supabase
      .from('quran_memorization')
      .select('*')
      .eq('user_id', userId)
      .order('surah_number', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(rowToMemorization);
  },

  async upsertMemorization(userId: string, mem: QuranMemorization): Promise<void> {
    const { error } = await supabase
      .from('quran_memorization')
      .upsert(
        {
          user_id: userId,
          surah_number: mem.surahNumber,
          status: mem.status,
          memorized_ayahs: mem.memorizedAyahs,
          last_reviewed_at: mem.lastReviewedAt ?? null,
          started_at: mem.startedAt ?? null,
          completed_at: mem.completedAt ?? null,
          review_count: mem.reviewCount,
          notes: mem.notes ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,surah_number' }
      );
    if (error) throw new Error(error.message);
  },

  // ── Bookmarks ──

  async getBookmarks(userId: string): Promise<QuranBookmark[]> {
    const { data, error } = await supabase
      .from('quran_bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(rowToBookmark);
  },

  async addBookmark(
    userId: string,
    surahNumber: number,
    ayahNumber: number,
    category: QuranBookmark['category'] = 'favorite',
    note?: string,
  ): Promise<QuranBookmark> {
    const { data, error } = await supabase
      .from('quran_bookmarks')
      .upsert(
        {
          user_id: userId,
          surah_number: surahNumber,
          ayah_number: ayahNumber,
          category,
          note: note ?? null,
        },
        { onConflict: 'user_id,surah_number,ayah_number' }
      )
      .select()
      .single();
    if (error) throw new Error(error.message);
    return rowToBookmark(data as unknown as Record<string, unknown>);
  },

  async removeBookmark(userId: string, surahNumber: number, ayahNumber: number): Promise<void> {
    const { error } = await supabase
      .from('quran_bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('surah_number', surahNumber)
      .eq('ayah_number', ayahNumber);
    if (error) throw new Error(error.message);
  },

  async updateBookmarkNote(userId: string, surahNumber: number, ayahNumber: number, note: string): Promise<void> {
    const { error } = await supabase
      .from('quran_bookmarks')
      .update({ note })
      .eq('user_id', userId)
      .eq('surah_number', surahNumber)
      .eq('ayah_number', ayahNumber);
    if (error) throw new Error(error.message);
  },

  async updateBookmarkCategory(
    userId: string,
    surahNumber: number,
    ayahNumber: number,
    category: QuranBookmark['category'],
  ): Promise<void> {
    const { error } = await supabase
      .from('quran_bookmarks')
      .update({ category })
      .eq('user_id', userId)
      .eq('surah_number', surahNumber)
      .eq('ayah_number', ayahNumber);
    if (error) throw new Error(error.message);
  },

  // ── Reading Position ──

  async getPosition(userId: string): Promise<QuranReadingPosition | null> {
    const { data, error } = await supabase
      .from('quran_reading_position')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message); // PGRST116 = no rows
    if (!data) return null;
    return rowToPosition(data as unknown as Record<string, unknown>);
  },

  async savePosition(userId: string, pos: QuranReadingPosition): Promise<void> {
    const { error } = await supabase
      .from('quran_reading_position')
      .upsert(
        {
          user_id: userId,
          surah_number: pos.surahNumber,
          ayah_number: pos.ayahNumber,
          juz_number: pos.juzNumber ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
    if (error) throw new Error(error.message);
  },

  // ── Settings ──

  async getSettings(userId: string): Promise<QuranSettings | null> {
    const { data, error } = await supabase
      .from('quran_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    if (!data) return null;
    return rowToSettings(data as unknown as Record<string, unknown>);
  },

  async saveSettings(userId: string, settings: QuranSettings): Promise<void> {
    const { error } = await supabase
      .from('quran_settings')
      .upsert(
        {
          user_id: userId,
          reciter_id: settings.reciterId,
          arabic_font_size: settings.arabicFontSize,
          translation_lang: settings.translationLang,
          show_transliteration: settings.showTransliteration,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
    if (error) throw new Error(error.message);
  },
};

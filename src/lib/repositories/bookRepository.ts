import type { Book, BookPassage } from '@/types';
import { supabase } from '@/lib/supabase/client';

function rowToBook(row: Record<string, unknown>): Book {
  return {
    id: row.id as string,
    title: row.title as string,
    author: row.author as string,
    coverUrl: (row.cover_url as string) || undefined,
    description: row.description as string,
    category: row.category as string,
    language: row.language as string,
    isbn: (row.isbn as string) || undefined,
    status: row.status as Book['status'],
    progress: row.progress != null ? (row.progress as number) : undefined,
    rating: row.rating != null ? (row.rating as number) : undefined,
    tags: (row.tags as string[]) || [],
    personalNotes: (row.personal_notes as string) || undefined,
    passageCount: (row.passage_count as number) || 0,
    startedAt: (row.started_at as string) || undefined,
    finishedAt: (row.finished_at as string) || undefined,
    addedAt: row.added_at as string,
  };
}

function rowToPassage(row: Record<string, unknown>): BookPassage {
  return {
    id: row.id as string,
    bookId: row.book_id as string,
    title: row.title as string,
    content: row.content as string,
    personalReflection: (row.personal_reflection as string) || undefined,
    pageNumber: (row.page_number as number) || undefined,
    tags: (row.tags as string[]) || [],
    isFavorite: row.is_favorite as boolean,
    isImportant: (row.is_important as boolean) || undefined,
    themeId: (row.theme_id as string) || undefined,
    addedAt: row.added_at as string,
    imageUrl: (row.image_url as string) || undefined,
    linkUrl: (row.link_url as string) || undefined,
  };
}

export const bookRepository = {
  // Books
  async getAll(userId?: string): Promise<Book[]> {
    let query = supabase
      .from('books')
      .select('*')
      .order('added_at', { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map(rowToBook);
  },

  async getById(id: string): Promise<Book | null> {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return rowToBook(data);
  },

  async create(userId: string, data: Omit<Book, 'id' | 'addedAt'>): Promise<Book> {
    const { data: row, error } = await supabase
      .from('books')
      .insert({
        user_id: userId,
        title: data.title,
        author: data.author,
        cover_url: data.coverUrl || null,
        description: data.description,
        category: data.category,
        language: data.language,
        isbn: data.isbn || null,
        status: data.status,
        progress: data.progress || null,
        rating: data.rating || null,
        tags: data.tags,
        personal_notes: data.personalNotes || null,
        passage_count: data.passageCount || 0,
        started_at: data.startedAt || null,
        finished_at: data.finishedAt || null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return rowToBook(row);
  },

  async update(id: string, updates: Partial<Omit<Book, 'id'>>): Promise<Book | null> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.author !== undefined) dbUpdates.author = updates.author;
    if (updates.coverUrl !== undefined) dbUpdates.cover_url = updates.coverUrl || null;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.language !== undefined) dbUpdates.language = updates.language;
    if (updates.isbn !== undefined) dbUpdates.isbn = updates.isbn || null;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
    if (updates.rating !== undefined) dbUpdates.rating = updates.rating;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.personalNotes !== undefined) dbUpdates.personal_notes = updates.personalNotes;
    if (updates.passageCount !== undefined) dbUpdates.passage_count = updates.passageCount;
    if (updates.startedAt !== undefined) dbUpdates.started_at = updates.startedAt;
    if (updates.finishedAt !== undefined) dbUpdates.finished_at = updates.finishedAt;

    const { data, error } = await supabase
      .from('books')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    if (error) return null;
    return rowToBook(data);
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('books').delete().eq('id', id);
    return !error;
  },

  async search(query: string, userId?: string): Promise<Book[]> {
    if (!query.trim()) return this.getAll(userId);
    const q = `%${query}%`;
    let dbQuery = supabase
      .from('books')
      .select('*')
      .or(`title.ilike.${q},author.ilike.${q},category.ilike.${q}`)
      .order('added_at', { ascending: false });
    if (userId) dbQuery = dbQuery.eq('user_id', userId);
    const { data, error } = await dbQuery;
    if (error) throw new Error(error.message);
    return (data || []).map(rowToBook);
  },

  // Passages
  async getPassagesByBook(bookId: string): Promise<BookPassage[]> {
    const { data, error } = await supabase
      .from('book_passages')
      .select('*')
      .eq('book_id', bookId)
      .order('added_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(rowToPassage);
  },

  async getPassageById(id: string): Promise<BookPassage | null> {
    const { data, error } = await supabase
      .from('book_passages')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return rowToPassage(data);
  },

  async createPassage(userId: string, data: Omit<BookPassage, 'id' | 'addedAt'>): Promise<BookPassage> {
    const { data: row, error } = await supabase
      .from('book_passages')
      .insert({
        book_id: data.bookId,
        user_id: userId,
        title: data.title,
        content: data.content,
        personal_reflection: data.personalReflection || null,
        page_number: data.pageNumber || null,
        tags: data.tags,
        is_favorite: data.isFavorite,
        is_important: data.isImportant || false,
        theme_id: data.themeId || null,
        image_url: data.imageUrl || null,
        link_url: data.linkUrl || null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Update passage count
    const { count } = await supabase
      .from('book_passages')
      .select('*', { count: 'exact', head: true })
      .eq('book_id', data.bookId);
    await supabase.from('books').update({ passage_count: count || 0 }).eq('id', data.bookId);

    return rowToPassage(row);
  },

  async updatePassage(id: string, updates: Partial<Omit<BookPassage, 'id'>>): Promise<BookPassage | null> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.personalReflection !== undefined) dbUpdates.personal_reflection = updates.personalReflection;
    if (updates.pageNumber !== undefined) dbUpdates.page_number = updates.pageNumber;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.isFavorite !== undefined) dbUpdates.is_favorite = updates.isFavorite;
    if (updates.isImportant !== undefined) dbUpdates.is_important = updates.isImportant;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl || null;
    if (updates.linkUrl !== undefined) dbUpdates.link_url = updates.linkUrl || null;

    const { data, error } = await supabase
      .from('book_passages')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    if (error) return null;
    return rowToPassage(data);
  },

  async deletePassage(id: string): Promise<boolean> {
    const passage = await this.getPassageById(id);
    const { error } = await supabase.from('book_passages').delete().eq('id', id);
    if (error) return false;

    if (passage) {
      const { count } = await supabase
        .from('book_passages')
        .select('*', { count: 'exact', head: true })
        .eq('book_id', passage.bookId);
      await supabase.from('books').update({ passage_count: count || 0 }).eq('id', passage.bookId);
    }
    return true;
  },

  async togglePassageFavorite(id: string): Promise<BookPassage | null> {
    const passage = await this.getPassageById(id);
    if (!passage) return null;
    return this.updatePassage(id, { isFavorite: !passage.isFavorite });
  },

  async togglePassageImportant(id: string): Promise<BookPassage | null> {
    const passage = await this.getPassageById(id);
    if (!passage) return null;
    return this.updatePassage(id, { isImportant: !passage.isImportant });
  },
};

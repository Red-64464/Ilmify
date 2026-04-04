import type { Topic, TopicBlock } from '@/types';
import type { Json } from '@/lib/supabase/types';
import { supabase } from '@/lib/supabase/client';

function rowToTopic(row: Record<string, unknown>): Topic {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    icon: (row.icon as string) || undefined,
    coverImage: (row.cover_image as string) || undefined,
    blocks: (row.blocks as TopicBlock[]) || [],
    tags: (row.tags as string[]) || [],
    category: (row.category as string) || undefined,
    isPinned: row.is_pinned as boolean,
    isFavorite: row.is_favorite as boolean,
    isArchived: row.is_archived as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export const topicRepository = {
  async getByUser(userId: string): Promise<Topic[]> {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(rowToTopic);
  },

  async getById(id: string): Promise<Topic | null> {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return rowToTopic(data);
  },

  async create(userId: string, title: string, category?: string): Promise<Topic> {
    const defaultBlock: TopicBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: 'paragraph',
      content: '',
      order: 0,
    };

    const { data, error } = await supabase
      .from('topics')
      .insert({
        user_id: userId,
        title,
        blocks: [defaultBlock] as unknown as Json,
        tags: [],
        category: category || null,
        is_pinned: false,
        is_favorite: false,
        is_archived: false,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return rowToTopic(data);
  },

  async update(id: string, updates: Partial<Omit<Topic, 'id' | 'userId' | 'createdAt'>>): Promise<Topic | null> {
    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon || null;
    if (updates.coverImage !== undefined) dbUpdates.cover_image = updates.coverImage || null;
    if (updates.blocks !== undefined) dbUpdates.blocks = updates.blocks;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.category !== undefined) dbUpdates.category = updates.category || null;
    if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
    if (updates.isFavorite !== undefined) dbUpdates.is_favorite = updates.isFavorite;
    if (updates.isArchived !== undefined) dbUpdates.is_archived = updates.isArchived;

    const { data, error } = await supabase
      .from('topics')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    if (error) return null;
    return rowToTopic(data);
  },

  async updateBlocks(id: string, blocks: TopicBlock[]): Promise<Topic | null> {
    return this.update(id, { blocks });
  },

  async togglePin(id: string): Promise<Topic | null> {
    const topic = await this.getById(id);
    if (!topic) return null;
    return this.update(id, { isPinned: !topic.isPinned });
  },

  async toggleFavorite(id: string): Promise<Topic | null> {
    const topic = await this.getById(id);
    if (!topic) return null;
    return this.update(id, { isFavorite: !topic.isFavorite });
  },

  async archive(id: string): Promise<Topic | null> {
    return this.update(id, { isArchived: true });
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('topics').delete().eq('id', id);
    return !error;
  },

  async duplicate(id: string, userId: string): Promise<Topic | null> {
    const original = await this.getById(id);
    if (!original) return null;

    const newBlocks = original.blocks.map((b) => ({
      ...b,
      id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    }));

    const { data, error } = await supabase
      .from('topics')
      .insert({
        user_id: userId,
        title: `${original.title} (copie)`,
        icon: original.icon || null,
        cover_image: original.coverImage || null,
        blocks: newBlocks as unknown as Json,
        tags: original.tags,
        category: original.category || null,
        is_pinned: false,
        is_favorite: false,
        is_archived: false,
      })
      .select()
      .single();
    if (error) return null;
    return rowToTopic(data);
  },

  async search(userId: string, query: string): Promise<Topic[]> {
    if (!query.trim()) return this.getByUser(userId);
    const q = `%${query}%`;
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .or(`title.ilike.${q},category.ilike.${q}`)
      .order('updated_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(rowToTopic);
  },
};

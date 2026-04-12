import type { CourseFolder, CoursePage, TopicBlock } from '@/types';
import type { Json } from '@/lib/supabase/types';
import { supabase } from '@/lib/supabase/client';

function rowToFolder(row: Record<string, unknown>): CourseFolder {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) || undefined,
    icon: (row.icon as string) || undefined,
    parentId: (row.parent_id as string) || undefined,
    order: (row.order_num as number) || 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToPage(row: Record<string, unknown>): CoursePage {
  return {
    id: row.id as string,
    folderId: row.folder_id as string,
    title: row.title as string,
    description: (row.description as string) || undefined,
    blocks: (row.blocks as TopicBlock[]) || [],
    tags: (row.tags as string[]) || [],
    icon: (row.icon as string) || undefined,
    coverImage: (row.cover_image as string) || undefined,
    order: (row.order_num as number) || 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export const courseRepository = {
  // Folders
  async getFolders(parentId?: string): Promise<CourseFolder[]> {
    let query = supabase
      .from('course_folders')
      .select('*')
      .order('order_num', { ascending: true });

    if (parentId) {
      query = query.eq('parent_id', parentId);
    } else {
      query = query.is('parent_id', null);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map(rowToFolder);
  },

  async getAllFolders(): Promise<CourseFolder[]> {
    const { data, error } = await supabase
      .from('course_folders')
      .select('*')
      .order('order_num', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(rowToFolder);
  },

  async getFolderById(id: string): Promise<CourseFolder | null> {
    const { data, error } = await supabase
      .from('course_folders')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return rowToFolder(data);
  },

  async createFolder(userId: string, data: Omit<CourseFolder, 'id' | 'createdAt' | 'updatedAt'>): Promise<CourseFolder> {
    const { data: row, error } = await supabase
      .from('course_folders')
      .insert({
        user_id: userId,
        title: data.title,
        description: data.description || null,
        icon: data.icon || null,
        parent_id: data.parentId || null,
        order_num: data.order,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return rowToFolder(row);
  },

  async updateFolder(id: string, updates: Partial<Omit<CourseFolder, 'id' | 'createdAt'>>): Promise<CourseFolder | null> {
    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description || null;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon || null;
    if (updates.parentId !== undefined) dbUpdates.parent_id = updates.parentId || null;
    if (updates.order !== undefined) dbUpdates.order_num = updates.order;

    const { data, error } = await supabase
      .from('course_folders')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return rowToFolder(data);
  },

  async deleteFolder(id: string): Promise<boolean> {
    const { error } = await supabase.from('course_folders').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },

  // Pages
  async getPagesByFolder(folderId: string): Promise<CoursePage[]> {
    const { data, error } = await supabase
      .from('course_pages')
      .select('*')
      .eq('folder_id', folderId)
      .order('order_num', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(rowToPage);
  },

  async getAllPages(): Promise<CoursePage[]> {
    const { data, error } = await supabase
      .from('course_pages')
      .select('*')
      .order('order_num', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(rowToPage);
  },

  /** Lightweight query for list/preview — no blocks */
  async listPages(limit?: number): Promise<Pick<CoursePage, 'id' | 'folderId' | 'title' | 'description' | 'icon' | 'order'>[]> {
    let query = supabase
      .from('course_pages')
      .select('id, folder_id, title, description, icon, order_num')
      .order('order_num', { ascending: true });
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map((r) => ({
      id: r.id as string,
      folderId: r.folder_id as string,
      title: r.title as string,
      description: (r.description as string) || undefined,
      icon: (r.icon as string) || undefined,
      order: (r.order_num as number) || 0,
    }));
  },

  async getPageById(id: string): Promise<CoursePage | null> {
    const { data, error } = await supabase
      .from('course_pages')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return rowToPage(data);
  },

  async createPage(userId: string, data: Omit<CoursePage, 'id' | 'createdAt' | 'updatedAt'>): Promise<CoursePage> {
    const { data: row, error } = await supabase
      .from('course_pages')
      .insert({
        folder_id: data.folderId,
        user_id: userId,
        title: data.title,
        description: data.description || null,
        blocks: (data.blocks || []) as unknown as Json,
        tags: data.tags,
        icon: data.icon || null,
        cover_image: data.coverImage || null,
        order_num: data.order,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return rowToPage(row);
  },

  async updatePage(id: string, updates: Partial<Omit<CoursePage, 'id' | 'createdAt'>>): Promise<CoursePage | null> {
    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description || null;
    if (updates.blocks !== undefined) dbUpdates.blocks = updates.blocks;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon || null;
    if (updates.coverImage !== undefined) dbUpdates.cover_image = updates.coverImage || null;
    if (updates.order !== undefined) dbUpdates.order_num = updates.order;
    if (updates.folderId !== undefined) dbUpdates.folder_id = updates.folderId;

    const { data, error } = await supabase
      .from('course_pages')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    if (error) return null;
    return rowToPage(data);
  },

  async updatePageBlocks(id: string, blocks: TopicBlock[]): Promise<CoursePage | null> {
    return this.updatePage(id, { blocks });
  },

  async deletePage(id: string): Promise<boolean> {
    const { error } = await supabase.from('course_pages').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },

  async searchPages(query: string): Promise<CoursePage[]> {
    if (!query.trim()) return this.getAllPages();
    const q = `%${query}%`;
    const { data, error } = await supabase
      .from('course_pages')
      .select('*')
      .or(`title.ilike.${q},description.ilike.${q}`)
      .order('order_num', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(rowToPage);
  },

  createDefaultBlock(): TopicBlock {
    return {
      id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: 'paragraph',
      content: '',
      order: 0,
    };
  },
};

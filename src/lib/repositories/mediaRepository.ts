import type { MediaFolder, MediaVideo, TimestampNote } from '@/types';
import type { Json } from '@/lib/supabase/types';
import { supabase } from '@/lib/supabase/client';

function rowToFolder(row: Record<string, unknown>): MediaFolder {
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

function rowToVideo(row: Record<string, unknown>): MediaVideo {
  return {
    id: row.id as string,
    folderId: row.folder_id as string,
    title: row.title as string,
    url: row.url as string,
    thumbnailUrl: (row.thumbnail_url as string) || undefined,
    channelName: (row.channel_name as string) || undefined,
    duration: (row.duration as string) || undefined,
    notes: (row.notes as TimestampNote[]) || [],
    tags: (row.tags as string[]) || [],
    watched: (row.watched as boolean) || false,
    order: (row.order_num as number) || 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export const mediaRepository = {
  // Folders
  async getFolders(parentId?: string): Promise<MediaFolder[]> {
    let query = supabase
      .from('media_folders')
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

  async getAllFolders(): Promise<MediaFolder[]> {
    const { data, error } = await supabase
      .from('media_folders')
      .select('*')
      .order('order_num', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(rowToFolder);
  },

  async getFolderById(id: string): Promise<MediaFolder | null> {
    const { data, error } = await supabase
      .from('media_folders')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return rowToFolder(data);
  },

  async createFolder(userId: string, data: Omit<MediaFolder, 'id' | 'createdAt' | 'updatedAt'>): Promise<MediaFolder> {
    const { data: row, error } = await supabase
      .from('media_folders')
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

  async updateFolder(id: string, updates: Partial<Omit<MediaFolder, 'id' | 'createdAt'>>): Promise<MediaFolder | null> {
    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description || null;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon || null;
    if (updates.parentId !== undefined) dbUpdates.parent_id = updates.parentId || null;
    if (updates.order !== undefined) dbUpdates.order_num = updates.order;

    const { data, error } = await supabase
      .from('media_folders')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return rowToFolder(data);
  },

  async deleteFolder(id: string): Promise<boolean> {
    const { error } = await supabase.from('media_folders').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },

  // Videos
  async getVideosByFolder(folderId: string): Promise<MediaVideo[]> {
    const { data, error } = await supabase
      .from('media_videos')
      .select('*')
      .eq('folder_id', folderId)
      .order('order_num', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(rowToVideo);
  },

  async getAllVideos(): Promise<MediaVideo[]> {
    const { data, error } = await supabase
      .from('media_videos')
      .select('*')
      .order('order_num', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(rowToVideo);
  },

  async getVideoById(id: string): Promise<MediaVideo | null> {
    const { data, error } = await supabase
      .from('media_videos')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return rowToVideo(data);
  },

  async createVideo(userId: string, data: Omit<MediaVideo, 'id' | 'createdAt' | 'updatedAt'>): Promise<MediaVideo> {
    const { data: row, error } = await supabase
      .from('media_videos')
      .insert({
        folder_id: data.folderId,
        user_id: userId,
        title: data.title,
        url: data.url,
        thumbnail_url: data.thumbnailUrl || null,
        channel_name: data.channelName || null,
        duration: data.duration || null,
        notes: (data.notes || []) as unknown as Json,
        tags: data.tags || [],
        watched: data.watched || false,
        order_num: data.order,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return rowToVideo(row);
  },

  async updateVideo(id: string, updates: Partial<Omit<MediaVideo, 'id' | 'createdAt'>>): Promise<MediaVideo | null> {
    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.url !== undefined) dbUpdates.url = updates.url;
    if (updates.thumbnailUrl !== undefined) dbUpdates.thumbnail_url = updates.thumbnailUrl || null;
    if (updates.channelName !== undefined) dbUpdates.channel_name = updates.channelName || null;
    if (updates.duration !== undefined) dbUpdates.duration = updates.duration || null;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes as unknown as Json;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.watched !== undefined) dbUpdates.watched = updates.watched;
    if (updates.order !== undefined) dbUpdates.order_num = updates.order;
    if (updates.folderId !== undefined) dbUpdates.folder_id = updates.folderId;

    const { data, error } = await supabase
      .from('media_videos')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    if (error) return null;
    return rowToVideo(data);
  },

  async deleteVideo(id: string): Promise<boolean> {
    const { error } = await supabase.from('media_videos').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },

  async searchVideos(query: string): Promise<MediaVideo[]> {
    if (!query.trim()) return this.getAllVideos();
    const q = `%${query}%`;
    const { data, error } = await supabase
      .from('media_videos')
      .select('*')
      .or(`title.ilike.${q},channel_name.ilike.${q}`)
      .order('order_num', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(rowToVideo);
  },
};

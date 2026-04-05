import type { Favorite } from '@/types';
import { supabase } from '@/lib/supabase/client';

function rowToFavorite(row: Record<string, unknown>): Favorite {
  return {
    id: row.id as string,
    itemType: row.item_type as Favorite['itemType'],
    itemId: row.item_id as string,
    title: (row.title as string) || undefined,
    preview: (row.preview as string) || undefined,
    addedAt: row.added_at as string,
  };
}

export const favoriteRepository = {
  async getAll(userId: string): Promise<Favorite[]> {
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .order('added_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(rowToFavorite);
  },

  async add(userId: string, fav: Omit<Favorite, 'id' | 'addedAt'>): Promise<Favorite> {
    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        item_type: fav.itemType,
        item_id: fav.itemId,
        title: fav.title || null,
        preview: fav.preview || null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return rowToFavorite(data);
  },

  async remove(userId: string, itemType: string, itemId: string): Promise<void> {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('item_type', itemType)
      .eq('item_id', itemId);
    if (error) throw new Error(error.message);
  },

  async isFavorite(userId: string, itemType: string, itemId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('item_type', itemType)
      .eq('item_id', itemId)
      .maybeSingle();
    if (error) return false;
    return !!data;
  },

  async toggle(userId: string, fav: Omit<Favorite, 'id' | 'addedAt'>): Promise<boolean> {
    const exists = await this.isFavorite(userId, fav.itemType, fav.itemId);
    if (exists) {
      await this.remove(userId, fav.itemType, fav.itemId);
      return false;
    }
    await this.add(userId, fav);
    return true;
  },
};

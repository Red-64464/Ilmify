import { supabase } from '@/lib/supabase/client';

export const activityRepository = {
  async log(userId: string, activityType: string) {
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('user_activity')
      .select('id, count')
      .eq('user_id', userId)
      .eq('activity_date', today)
      .eq('activity_type', activityType)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('user_activity')
        .update({ count: existing.count + 1 })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('user_activity')
        .insert({ user_id: userId, activity_date: today, activity_type: activityType, count: 1 });
    }
  },

  async getTodayActivities(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('user_activity')
      .select('*')
      .eq('user_id', userId)
      .eq('activity_date', today);
    return data || [];
  },

  async getStreak(userId: string): Promise<number> {
    const { data } = await supabase
      .from('user_activity')
      .select('activity_date')
      .eq('user_id', userId)
      .order('activity_date', { ascending: false })
      .limit(365);

    if (!data || data.length === 0) return 0;

    const uniqueDates = [...new Set(data.map(d => d.activity_date))].sort().reverse();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Determine start offset: if today has activity start from 0, else if yesterday does start from 1
    const todayStr = today.toISOString().split('T')[0];
    let offset = 0;
    if (uniqueDates[0] !== todayStr) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (uniqueDates[0] === yesterday.toISOString().split('T')[0]) {
        offset = 1;
      } else {
        return 0;
      }
    }

    let streak = 0;
    for (let i = 0; i < uniqueDates.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i - offset);
      const expectedStr = expected.toISOString().split('T')[0];
      if (uniqueDates[i] === expectedStr) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  },

  async getWeekActivity(userId: string) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data } = await supabase
      .from('user_activity')
      .select('*')
      .eq('user_id', userId)
      .gte('activity_date', weekAgo.toISOString().split('T')[0])
      .order('activity_date', { ascending: true });
    return data || [];
  },
};

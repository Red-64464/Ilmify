import { supabase } from '@/lib/supabase/client';

export const activityRepository = {
  // Single atomic DB call via PostgreSQL function (replaces the old SELECT + UPDATE/INSERT N+1).
  async log(userId: string, activityType: string): Promise<void> {
    try {
      await supabase.rpc('log_activity', { p_user_id: userId, p_type: activityType });
    } catch {
      // Fire-and-forget: activity tracking must never propagate errors to the caller.
    }
  },

  async getTodayActivities(userId: string): Promise<{ activity_type: string; count: number }[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('user_activity')
      .select('activity_type, count')
      .eq('user_id', userId)
      .eq('activity_date', today);
    return (data as unknown as { activity_type: string; count: number }[]) || [];
  },

  async getStreak(userId: string): Promise<number> {
    const { data } = await supabase
      .from('user_activity')
      .select('activity_date')
      .eq('user_id', userId)
      .order('activity_date', { ascending: false })
      .limit(365);

    if (!data || data.length === 0) return 0;

    const uniqueDates = [...new Set(data.map(d => d.activity_date as string))].sort().reverse();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
      if (uniqueDates[i] === expected.toISOString().split('T')[0]) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  },

  async getWeekActivity(userId: string): Promise<{ activity_date: string; activity_type: string; count: number }[]> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data } = await supabase
      .from('user_activity')
      .select('activity_date, activity_type, count')
      .eq('user_id', userId)
      .gte('activity_date', weekAgo.toISOString().split('T')[0])
      .order('activity_date', { ascending: true });
    return (data as unknown as { activity_date: string; activity_type: string; count: number }[]) || [];
  },
};

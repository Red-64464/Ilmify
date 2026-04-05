import type { FlashcardDeck, Flashcard } from '@/types';
import { supabase } from '@/lib/supabase/client';

function rowToDeck(row: Record<string, unknown>): FlashcardDeck {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    themeId: (row.theme_id as string) || undefined,
    cardCount: (row.card_count as number) || 0,
    masteredCount: (row.mastered_count as number) || 0,
    color: row.color as string,
    icon: (row.icon as string) || undefined,
    lastStudiedAt: (row.last_studied_at as string) || undefined,
    toReviewCount: (row.to_review_count as number) || 0,
    tags: (row.tags as string[]) || [],
    createdAt: row.created_at as string,
  };
}

function rowToCard(row: Record<string, unknown>): Flashcard {
  return {
    id: row.id as string,
    deckId: row.deck_id as string,
    front: row.front as string,
    back: row.back as string,
    tags: (row.tags as string[]) || [],
    difficulty: row.difficulty as Flashcard['difficulty'],
    masteryLevel: (row.mastery_level as number) || 0,
    nextReviewAt: (row.next_review_at as string) || undefined,
    reviewCount: (row.review_count as number) || 0,
    themeId: (row.theme_id as string) || undefined,
    lastReviewedAt: (row.last_reviewed_at as string) || undefined,
    createdAt: (row.created_at as string) || undefined,
  };
}

export const flashcardRepository = {
  // Decks
  async getAllDecks(userId?: string): Promise<FlashcardDeck[]> {
    let query = supabase
      .from('flashcard_decks')
      .select('*')
      .order('created_at', { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map(rowToDeck);
  },

  async getDeckById(id: string): Promise<FlashcardDeck | null> {
    const { data, error } = await supabase
      .from('flashcard_decks')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return rowToDeck(data);
  },

  async createDeck(userId: string, data: Omit<FlashcardDeck, 'id' | 'createdAt' | 'cardCount' | 'masteredCount' | 'toReviewCount'>): Promise<FlashcardDeck> {
    const { data: row, error } = await supabase
      .from('flashcard_decks')
      .insert({
        user_id: userId,
        title: data.title,
        description: data.description,
        theme_id: data.themeId || null,
        color: data.color,
        icon: data.icon || null,
        tags: data.tags,
        card_count: 0,
        mastered_count: 0,
        to_review_count: 0,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return rowToDeck(row);
  },

  async updateDeck(id: string, updates: Partial<Omit<FlashcardDeck, 'id'>>): Promise<FlashcardDeck | null> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.themeId !== undefined) dbUpdates.theme_id = updates.themeId || null;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon || null;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.cardCount !== undefined) dbUpdates.card_count = updates.cardCount;
    if (updates.masteredCount !== undefined) dbUpdates.mastered_count = updates.masteredCount;
    if (updates.toReviewCount !== undefined) dbUpdates.to_review_count = updates.toReviewCount;
    if (updates.lastStudiedAt !== undefined) dbUpdates.last_studied_at = updates.lastStudiedAt;

    const { data, error } = await supabase
      .from('flashcard_decks')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return rowToDeck(data);
  },

  async deleteDeck(id: string): Promise<boolean> {
    const { error } = await supabase.from('flashcard_decks').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },

  async refreshDeckCounts(deckId: string): Promise<void> {
    const { data: cards, error: fetchError } = await supabase
      .from('flashcards')
      .select('mastery_level')
      .eq('deck_id', deckId);

    if (fetchError) throw new Error(fetchError.message);

    const total = cards?.length || 0;
    const mastered = cards?.filter((c) => (c.mastery_level as number) >= 80).length || 0;

    const { error: updateError } = await supabase.from('flashcard_decks').update({
      card_count: total,
      mastered_count: mastered,
      to_review_count: total - mastered,
    }).eq('id', deckId);

    if (updateError) throw new Error(updateError.message);
  },

  // Cards
  async getCardsByDeck(deckId: string): Promise<Flashcard[]> {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('deck_id', deckId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(rowToCard);
  },

  async createCard(userId: string, data: Omit<Flashcard, 'id' | 'createdAt' | 'reviewCount' | 'masteryLevel'>): Promise<Flashcard> {
    const { data: row, error } = await supabase
      .from('flashcards')
      .insert({
        deck_id: data.deckId,
        user_id: userId,
        front: data.front,
        back: data.back,
        tags: data.tags || [],
        difficulty: data.difficulty || 'medium',
        mastery_level: 0,
        review_count: 0,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await this.refreshDeckCounts(data.deckId);
    return rowToCard(row);
  },

  async deleteCard(id: string): Promise<boolean> {
    // Get deck_id before deleting
    const { data: card } = await supabase
      .from('flashcards')
      .select('deck_id')
      .eq('id', id)
      .single();

    const { error } = await supabase.from('flashcards').delete().eq('id', id);
    if (error) throw new Error(error.message);

    if (card) {
      await this.refreshDeckCounts(card.deck_id as string);
    }
    return true;
  },

  async importCards(userId: string, deckId: string, cardsData: { front: string; back: string; tags?: string[]; difficulty?: 'easy' | 'medium' | 'hard' }[]): Promise<number> {
    const rows = cardsData.map((item) => ({
      deck_id: deckId,
      user_id: userId,
      front: item.front,
      back: item.back,
      tags: item.tags || [],
      difficulty: item.difficulty || 'medium',
      mastery_level: 0,
      review_count: 0,
    }));

    const { error } = await supabase.from('flashcards').insert(rows);
    if (error) throw new Error(error.message);

    await this.refreshDeckCounts(deckId);
    return cardsData.length;
  },

  async searchCards(query: string, userId?: string): Promise<Flashcard[]> {
    if (!query.trim()) return [];
    const q = `%${query}%`;
    let dbQuery = supabase
      .from('flashcards')
      .select('*')
      .or(`front.ilike.${q},back.ilike.${q}`)
      .order('created_at', { ascending: false })
      .limit(20);
    if (userId) dbQuery = dbQuery.eq('user_id', userId);
    const { data, error } = await dbQuery;
    if (error) return [];
    return (data || []).map(rowToCard);
  },

  async searchDecks(query: string, userId?: string): Promise<FlashcardDeck[]> {
    if (!query.trim()) return [];
    const q = `%${query}%`;
    let dbQuery = supabase
      .from('flashcard_decks')
      .select('*')
      .or(`title.ilike.${q},description.ilike.${q}`)
      .order('created_at', { ascending: false })
      .limit(20);
    if (userId) dbQuery = dbQuery.eq('user_id', userId);
    const { data, error } = await dbQuery;
    if (error) return [];
    return (data || []).map(rowToDeck);
  },

  /**
   * SM-2 inspired review: update mastery, review count, and schedule next review.
   * SM-2 inspired spaced repetition with Leitner intervals.
   * rating: 0 = Again, 1 = Hard, 2 = Good, 3 = Easy
   *
   * Intervals:
   *   Again (0): reset → review in 10min (same session), interval resets
   *   Hard  (1): same interval × 1.2, min 1 day
   *   Good  (2): interval × 2.5 (1→2→5→12→30 days pattern)
   *   Easy  (3): interval × 3.5, min 4 days
   */
  async reviewCard(cardId: string, rating: 0 | 1 | 2 | 3): Promise<void> {
    const { data: card, error: fetchErr } = await supabase
      .from('flashcards')
      .select('mastery_level, review_count, deck_id, next_review_at, last_reviewed_at')
      .eq('id', cardId)
      .single();
    if (fetchErr || !card) return;

    const oldMastery = (card.mastery_level as number) || 0;
    const reviewCount = ((card.review_count as number) || 0) + 1;

    // Calculate previous interval in days
    const lastReview = card.last_reviewed_at ? new Date(card.last_reviewed_at as string) : null;
    const nextReview = card.next_review_at ? new Date(card.next_review_at as string) : null;
    let prevInterval = 1;
    if (lastReview && nextReview) {
      prevInterval = Math.max(1, Math.round((nextReview.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24)));
    }

    let newMastery: number;
    let intervalDays: number;
    switch (rating) {
      case 0: // Again — reset progress, review today
        newMastery = Math.max(0, oldMastery - 30);
        intervalDays = 0;
        break;
      case 1: // Hard — small penalty, short interval
        newMastery = Math.max(0, oldMastery - 5);
        intervalDays = Math.max(1, Math.round(prevInterval * 1.2));
        break;
      case 2: // Good — standard SM-2 progression
        newMastery = Math.min(100, oldMastery + 15 + (100 - oldMastery) * 0.15);
        intervalDays = reviewCount === 1 ? 1 : reviewCount === 2 ? 3 : Math.round(prevInterval * 2.5);
        break;
      case 3: // Easy — fast progression
        newMastery = Math.min(100, oldMastery + 25 + (100 - oldMastery) * 0.25);
        intervalDays = reviewCount <= 2 ? 4 : Math.round(prevInterval * 3.5);
        break;
    }

    const scheduledReview = new Date();
    scheduledReview.setDate(scheduledReview.getDate() + intervalDays);

    const { error } = await supabase
      .from('flashcards')
      .update({
        mastery_level: Math.round(newMastery),
        review_count: reviewCount,
        last_reviewed_at: new Date().toISOString(),
        next_review_at: scheduledReview.toISOString(),
      })
      .eq('id', cardId);

    if (!error) {
      await this.refreshDeckCounts(card.deck_id as string);
    }
  },

  /** Get cards that are due for review (next_review_at <= now or null) */
  async getDueCards(deckId: string): Promise<Flashcard[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('deck_id', deckId)
      .or(`next_review_at.is.null,next_review_at.lte.${now}`)
      .order('next_review_at', { ascending: true, nullsFirst: true });
    if (error) return [];
    return (data || []).map(rowToCard);
  },
};

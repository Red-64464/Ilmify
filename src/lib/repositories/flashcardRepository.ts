import type { FlashcardDeck, Flashcard } from '@/types';
import { flashcardDecks as defaultDecks, flashcards as defaultCards } from '@/data/flashcards';

const DECKS_KEY = 'ilmify-flashcard-decks';
const CARDS_KEY = 'ilmify-flashcards';

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getAllDecks(): FlashcardDeck[] {
  if (typeof window === 'undefined') return defaultDecks;
  const stored = localStorage.getItem(DECKS_KEY);
  if (!stored) {
    localStorage.setItem(DECKS_KEY, JSON.stringify(defaultDecks));
    return defaultDecks;
  }
  return JSON.parse(stored);
}

function saveDecks(decks: FlashcardDeck[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
}

function getAllCards(): Flashcard[] {
  if (typeof window === 'undefined') return defaultCards;
  const stored = localStorage.getItem(CARDS_KEY);
  if (!stored) {
    localStorage.setItem(CARDS_KEY, JSON.stringify(defaultCards));
    return defaultCards;
  }
  return JSON.parse(stored);
}

function saveCards(cards: Flashcard[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
}

export const flashcardRepository = {
  // Decks
  getAllDecks(): FlashcardDeck[] {
    return getAllDecks();
  },

  getDeckById(id: string): FlashcardDeck | null {
    return getAllDecks().find((d) => d.id === id) || null;
  },

  createDeck(data: Omit<FlashcardDeck, 'id' | 'createdAt' | 'cardCount' | 'masteredCount' | 'toReviewCount'>): FlashcardDeck {
    const deck: FlashcardDeck = {
      ...data,
      id: generateId('deck'),
      cardCount: 0,
      masteredCount: 0,
      toReviewCount: 0,
      createdAt: new Date().toISOString(),
    };
    const all = getAllDecks();
    all.push(deck);
    saveDecks(all);
    return deck;
  },

  updateDeck(id: string, updates: Partial<Omit<FlashcardDeck, 'id'>>): FlashcardDeck | null {
    const all = getAllDecks();
    const index = all.findIndex((d) => d.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates };
    saveDecks(all);
    return all[index];
  },

  deleteDeck(id: string): boolean {
    const decks = getAllDecks().filter((d) => d.id !== id);
    saveDecks(decks);
    // Also delete associated cards
    const cards = getAllCards().filter((c) => c.deckId !== id);
    saveCards(cards);
    return true;
  },

  // Refresh deck counts from actual cards
  refreshDeckCounts(deckId: string): void {
    const cards = getAllCards().filter((c) => c.deckId === deckId);
    const mastered = cards.filter((c) => c.masteryLevel >= 80).length;
    this.updateDeck(deckId, {
      cardCount: cards.length,
      masteredCount: mastered,
      toReviewCount: cards.length - mastered,
    });
  },

  // Cards
  getCardsByDeck(deckId: string): Flashcard[] {
    return getAllCards().filter((c) => c.deckId === deckId);
  },

  createCard(data: Omit<Flashcard, 'id' | 'createdAt' | 'reviewCount' | 'masteryLevel'>): Flashcard {
    const card: Flashcard = {
      ...data,
      id: generateId('card'),
      masteryLevel: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
    };
    const all = getAllCards();
    all.push(card);
    saveCards(all);
    this.refreshDeckCounts(data.deckId);
    return card;
  },

  deleteCard(id: string): boolean {
    const cards = getAllCards();
    const card = cards.find((c) => c.id === id);
    const updated = cards.filter((c) => c.id !== id);
    saveCards(updated);
    if (card) {
      this.refreshDeckCounts(card.deckId);
    }
    return true;
  },

  // Import cards from JSON
  importCards(deckId: string, cardsData: { front: string; back: string; tags?: string[]; difficulty?: 'easy' | 'medium' | 'hard' }[]): number {
    let count = 0;
    for (const item of cardsData) {
      this.createCard({
        deckId,
        front: item.front,
        back: item.back,
        tags: item.tags || [],
        difficulty: item.difficulty || 'medium',
      });
      count++;
    }
    return count;
  },
};

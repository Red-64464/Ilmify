import type { Book, BookPassage } from '@/types';
import { books as defaultBooks, bookPassages as defaultPassages } from '@/data/books';

const BOOKS_KEY = 'ilmify-books';
const PASSAGES_KEY = 'ilmify-passages';

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getAllBooks(): Book[] {
  if (typeof window === 'undefined') return defaultBooks;
  const stored = localStorage.getItem(BOOKS_KEY);
  if (!stored) {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(defaultBooks));
    return defaultBooks;
  }
  return JSON.parse(stored);
}

function saveBooks(books: Book[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}

function getAllPassages(): BookPassage[] {
  if (typeof window === 'undefined') return defaultPassages;
  const stored = localStorage.getItem(PASSAGES_KEY);
  if (!stored) {
    localStorage.setItem(PASSAGES_KEY, JSON.stringify(defaultPassages));
    return defaultPassages;
  }
  return JSON.parse(stored);
}

function savePassages(passages: BookPassage[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PASSAGES_KEY, JSON.stringify(passages));
}

export const bookRepository = {
  // Books
  getAll(): Book[] {
    return getAllBooks();
  },

  getById(id: string): Book | null {
    return getAllBooks().find((b) => b.id === id) || null;
  },

  create(data: Omit<Book, 'id' | 'addedAt'>): Book {
    const book: Book = {
      ...data,
      id: generateId('book'),
      addedAt: new Date().toISOString(),
    };
    const all = getAllBooks();
    all.push(book);
    saveBooks(all);
    return book;
  },

  update(id: string, updates: Partial<Omit<Book, 'id'>>): Book | null {
    const all = getAllBooks();
    const index = all.findIndex((b) => b.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates };
    saveBooks(all);
    return all[index];
  },

  delete(id: string): boolean {
    const books = getAllBooks().filter((b) => b.id !== id);
    saveBooks(books);
    // Also delete associated passages
    const passages = getAllPassages().filter((p) => p.bookId !== id);
    savePassages(passages);
    return true;
  },

  search(query: string): Book[] {
    if (!query.trim()) return this.getAll();
    const q = query.toLowerCase();
    return this.getAll().filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.tags.some((t) => t.toLowerCase().includes(q))
    );
  },

  // Passages
  getPassagesByBook(bookId: string): BookPassage[] {
    return getAllPassages()
      .filter((p) => p.bookId === bookId)
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
  },

  getPassageById(id: string): BookPassage | null {
    return getAllPassages().find((p) => p.id === id) || null;
  },

  createPassage(data: Omit<BookPassage, 'id' | 'addedAt'>): BookPassage {
    const passage: BookPassage = {
      ...data,
      id: generateId('passage'),
      addedAt: new Date().toISOString(),
    };
    const all = getAllPassages();
    all.push(passage);
    savePassages(all);
    
    // Update passage count in book
    const books = getAllBooks();
    const bookIndex = books.findIndex((b) => b.id === data.bookId);
    if (bookIndex !== -1) {
      books[bookIndex].passageCount = (books[bookIndex].passageCount || 0) + 1;
      saveBooks(books);
    }
    
    return passage;
  },

  updatePassage(id: string, updates: Partial<Omit<BookPassage, 'id'>>): BookPassage | null {
    const all = getAllPassages();
    const index = all.findIndex((p) => p.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates };
    savePassages(all);
    return all[index];
  },

  deletePassage(id: string): boolean {
    const passages = getAllPassages();
    const passage = passages.find((p) => p.id === id);
    if (!passage) return false;
    
    savePassages(passages.filter((p) => p.id !== id));
    
    // Update passage count in book
    const books = getAllBooks();
    const bookIndex = books.findIndex((b) => b.id === passage.bookId);
    if (bookIndex !== -1 && books[bookIndex].passageCount) {
      books[bookIndex].passageCount = Math.max(0, (books[bookIndex].passageCount || 1) - 1);
      saveBooks(books);
    }
    
    return true;
  },

  togglePassageFavorite(id: string): BookPassage | null {
    const passage = this.getPassageById(id);
    if (!passage) return null;
    return this.updatePassage(id, { isFavorite: !passage.isFavorite });
  },

  togglePassageImportant(id: string): BookPassage | null {
    const passage = this.getPassageById(id);
    if (!passage) return null;
    return this.updatePassage(id, { isImportant: !passage.isImportant });
  },
};

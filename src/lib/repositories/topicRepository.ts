import type { Topic, TopicBlock } from '@/types';

const STORAGE_KEY = 'ilmify-topics';

function generateId(): string {
  return `topic-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function generateBlockId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getAll(): Topic[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveAll(topics: Topic[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(topics));
}

export const topicRepository = {
  getByUser(userId: string): Topic[] {
    return getAll()
      .filter((t) => t.userId === userId && !t.isArchived)
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  },

  getById(id: string): Topic | null {
    return getAll().find((t) => t.id === id) || null;
  },

  create(userId: string, title: string, category?: string): Topic {
    const now = new Date().toISOString();
    const topic: Topic = {
      id: generateId(),
      userId,
      title,
      blocks: [
        {
          id: generateBlockId(),
          type: 'paragraph',
          content: '',
          order: 0,
        },
      ],
      tags: [],
      category,
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };

    const all = getAll();
    all.push(topic);
    saveAll(all);
    return topic;
  },

  update(id: string, updates: Partial<Omit<Topic, 'id' | 'userId' | 'createdAt'>>): Topic | null {
    const all = getAll();
    const index = all.findIndex((t) => t.id === id);
    if (index === -1) return null;

    all[index] = {
      ...all[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveAll(all);
    return all[index];
  },

  updateBlocks(id: string, blocks: TopicBlock[]): Topic | null {
    return this.update(id, { blocks });
  },

  togglePin(id: string): Topic | null {
    const topic = this.getById(id);
    if (!topic) return null;
    return this.update(id, { isPinned: !topic.isPinned });
  },

  toggleFavorite(id: string): Topic | null {
    const topic = this.getById(id);
    if (!topic) return null;
    return this.update(id, { isFavorite: !topic.isFavorite });
  },

  archive(id: string): Topic | null {
    return this.update(id, { isArchived: true });
  },

  delete(id: string): boolean {
    const all = getAll();
    const filtered = all.filter((t) => t.id !== id);
    if (filtered.length === all.length) return false;
    saveAll(filtered);
    return true;
  },

  duplicate(id: string, userId: string): Topic | null {
    const original = this.getById(id);
    if (!original) return null;

    const now = new Date().toISOString();
    const newTopic: Topic = {
      ...original,
      id: generateId(),
      userId,
      title: `${original.title} (copie)`,
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
      blocks: original.blocks.map((b) => ({ ...b, id: generateBlockId() })),
    };

    const all = getAll();
    all.push(newTopic);
    saveAll(all);
    return newTopic;
  },

  search(userId: string, query: string): Topic[] {
    if (!query.trim()) return this.getByUser(userId);
    const q = query.toLowerCase();
    return this.getByUser(userId).filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        t.category?.toLowerCase().includes(q) ||
        t.blocks.some((b) => b.content.toLowerCase().includes(q))
    );
  },
};

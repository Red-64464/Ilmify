import type { CourseFolder, CoursePage, TopicBlock } from '@/types';

const FOLDERS_KEY = 'ilmify-course-folders';
const PAGES_KEY = 'ilmify-course-pages';

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function generateBlockId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ---- Folders ----

function getAllFolders(): CourseFolder[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(FOLDERS_KEY);
  if (!stored) {
    // Seed default folders
    const defaults = getDefaultFolders();
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(stored);
}

function saveFolders(folders: CourseFolder[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

function getDefaultFolders(): CourseFolder[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'folder-foundations',
      title: 'Fondements de l\'Islam',
      description: 'Les bases essentielles de la religion islamique',
      icon: '🕌',
      order: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'folder-aqidah',
      title: 'Aqidah (Croyance)',
      description: 'Les fondements de la croyance islamique',
      icon: '⭐',
      order: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'folder-fiqh',
      title: 'Fiqh (Jurisprudence)',
      description: 'Les règles pratiques de l\'Islam',
      icon: '📖',
      order: 3,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

// ---- Pages ----

function getAllPages(): CoursePage[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(PAGES_KEY);
  if (!stored) {
    const defaults = getDefaultPages();
    localStorage.setItem(PAGES_KEY, JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(stored);
}

function savePages(pages: CoursePage[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PAGES_KEY, JSON.stringify(pages));
}

function getDefaultPages(): CoursePage[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'course-tawhid',
      folderId: 'folder-foundations',
      title: 'Introduction au Tawhid',
      description: 'Les bases du monothéisme islamique',
      icon: '☪',
      tags: ['tawhid', 'fondements'],
      order: 1,
      createdAt: now,
      updatedAt: now,
      blocks: [
        { id: 'cb-1', type: 'heading2' as const, content: 'Le Tawhid : L\'Unicité d\'Allah', order: 0 },
        { id: 'cb-2', type: 'paragraph' as const, content: '[Exemple] Le Tawhid est le fondement de l\'Islam. Il signifie l\'unicité absolue d\'Allah dans Sa seigneurie, Son adoration et Ses noms et attributs.', order: 1 },
        { id: 'cb-3', type: 'callout' as const, content: '[Exemple] Ce contenu est un exemple de démonstration pour illustrer la structure des cours.', order: 2 },
        { id: 'cb-4', type: 'heading3' as const, content: 'Les trois catégories du Tawhid', order: 3 },
        { id: 'cb-5', type: 'bullet-list' as const, content: 'Tawhid ar-Rububiyyah (Seigneurie)\nTawhid al-Uluhiyyah (Adoration)\nTawhid al-Asma wa as-Sifat (Noms et Attributs)', order: 4 },
      ],
    },
    {
      id: 'course-prayer',
      folderId: 'folder-foundations',
      title: 'La Prière en Islam',
      description: 'Les règles et conditions de la prière',
      icon: '🤲',
      tags: ['salat', 'fiqh'],
      order: 2,
      createdAt: now,
      updatedAt: now,
      blocks: [
        { id: 'cb-6', type: 'heading2' as const, content: 'La Prière (As-Salat)', order: 0 },
        { id: 'cb-7', type: 'paragraph' as const, content: '[Exemple] La prière est le deuxième pilier de l\'Islam et constitue le lien entre le serviteur et son Seigneur.', order: 1 },
        { id: 'cb-8', type: 'verse' as const, content: '[Exemple] « Accomplissez la prière, acquittez la zakat et inclinez-vous avec ceux qui s\'inclinent. »', metadata: { source: 'Sourate Al-Baqarah, v.43', arabic: 'وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ' }, order: 2 },
      ],
    },
    {
      id: 'course-3-principles',
      folderId: 'folder-aqidah',
      title: 'Les Trois Fondements',
      description: 'Étude des Trois Fondements de Muhammad ibn Abd al-Wahhab',
      icon: '📚',
      tags: ['aqidah', 'fondements'],
      order: 1,
      createdAt: now,
      updatedAt: now,
      blocks: [
        { id: 'cb-9', type: 'heading2' as const, content: 'Les Trois Fondements (Al-Usul ath-Thalathah)', order: 0 },
        { id: 'cb-10', type: 'paragraph' as const, content: '[Exemple] Cet ouvrage traite des trois questions posées dans la tombe : Qui est ton Seigneur ? Quelle est ta religion ? Qui est ton Prophète ?', order: 1 },
        { id: 'cb-11', type: 'source' as const, content: '[Exemple] Auteur : Muhammad ibn Abd al-Wahhab', metadata: { reference: 'Al-Usul ath-Thalathah' }, order: 2 },
      ],
    },
  ];
}

export const courseRepository = {
  // Folders
  getFolders(parentId?: string): CourseFolder[] {
    return getAllFolders()
      .filter((f) => (parentId ? f.parentId === parentId : !f.parentId))
      .sort((a, b) => a.order - b.order);
  },

  getAllFolders(): CourseFolder[] {
    return getAllFolders().sort((a, b) => a.order - b.order);
  },

  getFolderById(id: string): CourseFolder | null {
    return getAllFolders().find((f) => f.id === id) || null;
  },

  createFolder(data: Omit<CourseFolder, 'id' | 'createdAt' | 'updatedAt'>): CourseFolder {
    const now = new Date().toISOString();
    const folder: CourseFolder = {
      ...data,
      id: generateId('folder'),
      createdAt: now,
      updatedAt: now,
    };
    const all = getAllFolders();
    all.push(folder);
    saveFolders(all);
    return folder;
  },

  updateFolder(id: string, updates: Partial<Omit<CourseFolder, 'id' | 'createdAt'>>): CourseFolder | null {
    const all = getAllFolders();
    const index = all.findIndex((f) => f.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates, updatedAt: new Date().toISOString() };
    saveFolders(all);
    return all[index];
  },

  deleteFolder(id: string): boolean {
    const folders = getAllFolders().filter((f) => f.id !== id);
    saveFolders(folders);
    // Also delete pages in this folder
    const pages = getAllPages().filter((p) => p.folderId !== id);
    savePages(pages);
    return true;
  },

  // Pages
  getPagesByFolder(folderId: string): CoursePage[] {
    return getAllPages()
      .filter((p) => p.folderId === folderId)
      .sort((a, b) => a.order - b.order);
  },

  getAllPages(): CoursePage[] {
    return getAllPages().sort((a, b) => a.order - b.order);
  },

  getPageById(id: string): CoursePage | null {
    return getAllPages().find((p) => p.id === id) || null;
  },

  createPage(data: Omit<CoursePage, 'id' | 'createdAt' | 'updatedAt'>): CoursePage {
    const now = new Date().toISOString();
    const page: CoursePage = {
      ...data,
      id: generateId('course'),
      createdAt: now,
      updatedAt: now,
    };
    const all = getAllPages();
    all.push(page);
    savePages(all);
    return page;
  },

  updatePage(id: string, updates: Partial<Omit<CoursePage, 'id' | 'createdAt'>>): CoursePage | null {
    const all = getAllPages();
    const index = all.findIndex((p) => p.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates, updatedAt: new Date().toISOString() };
    savePages(all);
    return all[index];
  },

  updatePageBlocks(id: string, blocks: TopicBlock[]): CoursePage | null {
    return this.updatePage(id, { blocks });
  },

  deletePage(id: string): boolean {
    const all = getAllPages().filter((p) => p.id !== id);
    savePages(all);
    return true;
  },

  searchPages(query: string): CoursePage[] {
    if (!query.trim()) return this.getAllPages();
    const q = query.toLowerCase();
    return this.getAllPages().filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.blocks.some((b) => b.content.toLowerCase().includes(q))
    );
  },

  createDefaultBlock(): TopicBlock {
    return {
      id: generateBlockId(),
      type: 'paragraph',
      content: '',
      order: 0,
    };
  },
};

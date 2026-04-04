import { Theme, ContentBlock, Tag, QuizQuestion, FlashcardDeck, Flashcard, Book, BookPassage, Favorite, DailyReminder } from '@/types';

// ── Tags ──────────────────────────────────────────
export const tags: Tag[] = [
  { id: 't1', name: 'Croyance', color: '#D4A843' },
  { id: 't2', name: 'Pratique', color: '#2DA891' },
  { id: 't3', name: 'Comportement', color: '#8BA89A' },
  { id: 't4', name: 'Spiritualité', color: '#E8C068' },
  { id: 't5', name: 'Sciences', color: '#4FC3F7' },
  { id: 't6', name: 'Purification', color: '#1B5E4F' },
  { id: 't7', name: 'Invocations', color: '#D4A843' },
  { id: 't8', name: 'Éthique', color: '#2DA891' },
];

// ── Themes ────────────────────────────────────────
export const themes: Theme[] = [
  { id: 'th1', title: 'Bases de l\'islam', description: 'Les fondements et piliers essentiels de la religion islamique.', icon: 'BookOpen', color: '#2DA891', contentCount: 5, progress: 60, tags: ['Croyance', 'Pratique'] },
  { id: 'th2', title: 'Tawhid', description: 'L\'unicité d\'Allah — le fondement de la foi musulmane.', icon: 'Star', color: '#D4A843', contentCount: 4, progress: 40, tags: ['Croyance'] },
  { id: 'th3', title: 'La Prière', description: 'La salat, deuxième pilier de l\'islam et lien avec le Créateur.', icon: 'Moon', color: '#1B5E4F', contentCount: 3, progress: 80, tags: ['Pratique'] },
  { id: 'th4', title: 'Al-Iman', description: 'La foi, ses piliers et ce qui la renforce ou l\'affaiblit.', icon: 'Heart', color: '#E8C068', contentCount: 4, progress: 30, tags: ['Croyance', 'Spiritualité'] },
  { id: 'th5', title: 'Al-Ihsan', description: 'L\'excellence dans l\'adoration — adorer Allah comme si tu Le voyais.', icon: 'Sparkles', color: '#4FC3F7', contentCount: 2, progress: 10, tags: ['Spiritualité'] },
  { id: 'th6', title: 'As-Sabr', description: 'La patience face aux épreuves et la persévérance dans l\'obéissance.', icon: 'Shield', color: '#8BA89A', contentCount: 3, progress: 50, tags: ['Comportement', 'Spiritualité'] },
  { id: 'th7', title: 'At-Tawakkul', description: 'La confiance en Allah et la remise de ses affaires à Lui.', icon: 'Hand', color: '#2DA891', contentCount: 2, tags: ['Spiritualité'] },
  { id: 'th8', title: 'Le Comportement', description: 'L\'éthique islamique, les bonnes manières et le bon caractère.', icon: 'Users', color: '#D4A843', contentCount: 3, progress: 20, tags: ['Comportement', 'Éthique'] },
];

// ── Content Blocks ────────────────────────────────
export const contentBlocks: ContentBlock[] = [
  { id: 'c1', type: 'verse', title: 'Sourate Al-Fatiha — Ouverture', content: '[Exemple de démonstration] « Au nom d\'Allah, le Tout Miséricordieux, le Très Miséricordieux. Louange à Allah, Seigneur de l\'univers. »', source: 'Coran', reference: 'Sourate 1, versets 1-2', themeId: 'th1', tags: ['Croyance'], isFavorite: true, createdAt: '2025-01-10' },
  { id: 'c2', type: 'hadith', title: 'Les actes ne valent que par les intentions', content: '[Exemple de démonstration] « Les actes ne valent que par les intentions, et chacun sera rétribué selon son intention. »', source: 'Rapporté par Al-Bukhari et Muslim', reference: 'Hadith n°1 des 40 Nawawi', themeId: 'th1', tags: ['Pratique'], isFavorite: false, createdAt: '2025-01-11' },
  { id: 'c3', type: 'explanation', title: 'Les cinq piliers de l\'islam', content: '[Exemple de démonstration] L\'islam repose sur cinq piliers fondamentaux : la shahada (attestation de foi), la salat (prière), la zakat (aumône), le sawm (jeûne du Ramadan) et le hajj (pèlerinage).', themeId: 'th1', tags: ['Croyance', 'Pratique'], isFavorite: false, createdAt: '2025-01-12' },
  { id: 'c4', type: 'verse', title: 'L\'unicité divine', content: '[Exemple de démonstration] « Dis : Il est Allah, Unique. Allah, Le Seul à être imploré pour ce que nous désirons. Il n\'a jamais engendré, n\'a pas été engendré non plus. Et nul n\'est égal à Lui. »', source: 'Coran', reference: 'Sourate 112 — Al-Ikhlas', themeId: 'th2', tags: ['Croyance'], isFavorite: true, createdAt: '2025-01-15' },
  { id: 'c5', type: 'explanation', title: 'Les catégories du Tawhid', content: '[Exemple de démonstration] Le Tawhid se divise en trois catégories : Tawhid ar-Rububiyyah (unicité dans la seigneurie), Tawhid al-Uluhiyyah (unicité dans l\'adoration), et Tawhid al-Asma wa as-Sifat (unicité dans les noms et attributs).', themeId: 'th2', tags: ['Croyance'], isFavorite: false, createdAt: '2025-01-16' },
  { id: 'c6', type: 'reminder', title: 'La prière à l\'heure', content: '[Exemple de démonstration] La prière accomplie à son heure est l\'une des œuvres les plus aimées d\'Allah. Elle est le pilier de la religion.', themeId: 'th3', tags: ['Pratique'], isFavorite: false, createdAt: '2025-02-01' },
  { id: 'c7', type: 'hadith', title: 'Les six piliers de la foi', content: '[Exemple de démonstration] « La foi (al-iman) consiste à croire en Allah, en Ses anges, en Ses livres, en Ses messagers, au Jour dernier et au destin, bon ou mauvais. »', source: 'Rapporté par Muslim', reference: 'Hadith de Jibril', themeId: 'th4', tags: ['Croyance'], isFavorite: true, createdAt: '2025-02-05' },
  { id: 'c8', type: 'quote', title: 'Citation sur la patience', content: '[Exemple de démonstration] « La patience est la moitié de la foi. » — Sagesse attribuée aux savants musulmans.', themeId: 'th6', tags: ['Comportement', 'Spiritualité'], isFavorite: false, createdAt: '2025-02-10' },
  { id: 'c9', type: 'reminder', title: 'Le tawakkul au quotidien', content: '[Exemple de démonstration] Faire les causes (al-asbab) puis s\'en remettre à Allah : voilà le vrai tawakkul. Ce n\'est pas l\'inaction, mais la confiance après l\'effort.', themeId: 'th7', tags: ['Spiritualité'], isFavorite: false, createdAt: '2025-02-12' },
  { id: 'c10', type: 'explanation', title: 'L\'Ihsan — l\'excellence', content: '[Exemple de démonstration] Al-Ihsan est le plus haut degré de la religion. C\'est adorer Allah comme si tu Le voyais, car même si tu ne Le vois pas, Lui te voit.', themeId: 'th5', tags: ['Spiritualité'], isFavorite: true, createdAt: '2025-03-01' },
  { id: 'c11', type: 'verse', title: 'Verset sur la patience', content: '[Exemple de démonstration] « Ô les croyants ! Cherchez secours dans la patience et la prière. Car Allah est avec les patients. »', source: 'Coran', reference: 'Sourate 2, verset 153', themeId: 'th6', tags: ['Spiritualité'], isFavorite: false, createdAt: '2025-03-05' },
  { id: 'c12', type: 'hadith', title: 'Le bon comportement', content: '[Exemple de démonstration] « Les croyants qui ont la foi la plus complète sont ceux qui ont le meilleur caractère. »', source: 'Rapporté par At-Tirmidhi', themeId: 'th8', tags: ['Comportement', 'Éthique'], isFavorite: false, createdAt: '2025-03-10' },
];

// ── Quiz Questions ────────────────────────────────
export const quizQuestions: QuizQuestion[] = [
  { id: 'q1', question: 'Combien de piliers compte l\'islam ?', type: 'mcq', options: ['3', '4', '5', '6'], correctAnswer: '5', explanation: '[Démonstration] L\'islam repose sur cinq piliers.', themeId: 'th1', difficulty: 'easy', mastery: 90, errorCount: 0 },
  { id: 'q2', question: 'Le Tawhid signifie l\'unicité d\'Allah.', type: 'true_false', options: ['Vrai', 'Faux'], correctAnswer: 'Vrai', explanation: '[Démonstration] Le Tawhid est le fondement de la croyance islamique.', themeId: 'th2', difficulty: 'easy', mastery: 80, errorCount: 1 },
  { id: 'q3', question: 'Quel est le premier pilier de l\'islam ?', type: 'mcq', options: ['La prière', 'Le jeûne', 'La shahada', 'Le pèlerinage'], correctAnswer: 'La shahada', explanation: '[Démonstration] L\'attestation de foi est le premier pilier.', themeId: 'th1', difficulty: 'easy', mastery: 70, errorCount: 0 },
  { id: 'q4', question: 'Combien de prières obligatoires par jour ?', type: 'mcq', options: ['3', '4', '5', '7'], correctAnswer: '5', explanation: '[Démonstration] Il y a 5 prières quotidiennes obligatoires.', themeId: 'th3', difficulty: 'easy', mastery: 95, errorCount: 0 },
  { id: 'q5', question: 'Al-Ihsan est le plus haut degré de la religion.', type: 'true_false', options: ['Vrai', 'Faux'], correctAnswer: 'Vrai', explanation: '[Démonstration] Au-dessus de l\'islam et de l\'iman se trouve l\'ihsan.', themeId: 'th5', difficulty: 'medium', mastery: 40, errorCount: 2 },
  { id: 'q6', question: 'Combien de piliers de la foi (al-iman) y a-t-il ?', type: 'mcq', options: ['4', '5', '6', '7'], correctAnswer: '6', explanation: '[Démonstration] Les piliers de la foi sont au nombre de six.', themeId: 'th4', difficulty: 'medium', mastery: 55, errorCount: 1 },
  { id: 'q7', question: 'Que signifie « As-Sabr » ?', type: 'short_answer', correctAnswer: 'patience', explanation: '[Démonstration] As-Sabr signifie la patience.', themeId: 'th6', difficulty: 'easy', mastery: 30, errorCount: 3 },
  { id: 'q8', question: 'Le tawakkul signifie l\'inaction et l\'attente passive.', type: 'true_false', options: ['Vrai', 'Faux'], correctAnswer: 'Faux', explanation: '[Démonstration] Le tawakkul est la confiance en Allah après avoir fait les causes.', themeId: 'th7', difficulty: 'medium', mastery: 20, errorCount: 2 },
  { id: 'q9', question: 'Quelle sourate est appelée « Al-Ikhlas » ?', type: 'mcq', options: ['Sourate 110', 'Sourate 112', 'Sourate 114', 'Sourate 1'], correctAnswer: 'Sourate 112', explanation: '[Démonstration] Al-Ikhlas est la sourate 112.', themeId: 'th2', difficulty: 'medium', mastery: 60, errorCount: 1 },
  { id: 'q10', question: 'Le bon caractère fait partie de la foi complète.', type: 'true_false', options: ['Vrai', 'Faux'], correctAnswer: 'Vrai', explanation: '[Démonstration] Le Prophète ﷺ a lié le bon caractère à la foi.', themeId: 'th8', difficulty: 'easy', mastery: 85, errorCount: 0 },
];

// ── Flashcard Decks ───────────────────────────────
export const flashcardDecks: FlashcardDeck[] = [
  { id: 'd1', title: 'Piliers de l\'Islam', description: 'Mémorisez les cinq piliers fondamentaux.', themeId: 'th1', cardCount: 4, masteredCount: 2, color: '#2DA891', icon: 'BookOpen', tags: ['Croyance'] },
  { id: 'd2', title: 'Tawhid — Concepts clés', description: 'Les catégories et notions essentielles du Tawhid.', themeId: 'th2', cardCount: 3, masteredCount: 1, color: '#D4A843', icon: 'Star', tags: ['Croyance'] },
  { id: 'd3', title: 'Piliers de la foi', description: 'Les six piliers de l\'iman.', themeId: 'th4', cardCount: 3, masteredCount: 0, color: '#E8C068', icon: 'Heart', tags: ['Croyance'] },
  { id: 'd4', title: 'Vocabulaire spirituel', description: 'Termes clés de la spiritualité islamique.', themeId: 'th5', cardCount: 4, masteredCount: 1, color: '#4FC3F7', icon: 'Sparkles', tags: ['Spiritualité'] },
];

// ── Flashcards ────────────────────────────────────
export const flashcards: Flashcard[] = [
  { id: 'f1', deckId: 'd1', front: 'Quel est le premier pilier de l\'islam ?', back: 'La Shahada — l\'attestation de foi', tags: ['Croyance'], difficulty: 'easy', mastery: 'mastered' },
  { id: 'f2', deckId: 'd1', front: 'Quel est le deuxième pilier de l\'islam ?', back: 'As-Salat — la prière rituelle', tags: ['Pratique'], difficulty: 'easy', mastery: 'mastered' },
  { id: 'f3', deckId: 'd1', front: 'Quel est le troisième pilier ?', back: 'Az-Zakat — l\'aumône obligatoire', tags: ['Pratique'], difficulty: 'easy', mastery: 'learning' },
  { id: 'f4', deckId: 'd1', front: 'Quels sont les 4e et 5e piliers ?', back: 'As-Sawm (jeûne du Ramadan) et Al-Hajj (pèlerinage)', tags: ['Pratique'], difficulty: 'medium', mastery: 'new' },
  { id: 'f5', deckId: 'd2', front: 'Qu\'est-ce que Tawhid ar-Rububiyyah ?', back: 'L\'unicité d\'Allah dans Sa seigneurie (création, possession, gestion).', tags: ['Croyance'], difficulty: 'medium', mastery: 'mastered' },
  { id: 'f6', deckId: 'd2', front: 'Qu\'est-ce que Tawhid al-Uluhiyyah ?', back: 'L\'unicité d\'Allah dans l\'adoration.', tags: ['Croyance'], difficulty: 'medium', mastery: 'review' },
  { id: 'f7', deckId: 'd2', front: 'Qu\'est-ce que Tawhid al-Asma wa as-Sifat ?', back: 'L\'unicité d\'Allah dans Ses noms et attributs.', tags: ['Croyance'], difficulty: 'hard', mastery: 'learning' },
  { id: 'f8', deckId: 'd3', front: 'Citez le 1er pilier de la foi.', back: 'La croyance en Allah.', tags: ['Croyance'], difficulty: 'easy', mastery: 'new' },
  { id: 'f9', deckId: 'd3', front: 'Citez les anges mentionnés dans le Coran.', back: 'Jibril, Mikail, Israfil, l\'Ange de la mort…', tags: ['Croyance'], difficulty: 'medium', mastery: 'new' },
  { id: 'f10', deckId: 'd3', front: 'Que signifie croire au Destin ?', back: 'Croire que tout — bien et mal — vient d\'Allah par Sa sagesse.', tags: ['Croyance'], difficulty: 'hard', mastery: 'new' },
  { id: 'f11', deckId: 'd4', front: 'Que signifie Al-Ihsan ?', back: 'L\'excellence : adorer Allah comme si tu Le voyais.', tags: ['Spiritualité'], difficulty: 'easy', mastery: 'mastered' },
  { id: 'f12', deckId: 'd4', front: 'Que signifie At-Tawakkul ?', back: 'La confiance en Allah après avoir accompli les causes.', tags: ['Spiritualité'], difficulty: 'easy', mastery: 'learning' },
  { id: 'f13', deckId: 'd4', front: 'Que signifie As-Sabr ?', back: 'La patience dans l\'épreuve et l\'obéissance à Allah.', tags: ['Spiritualité'], difficulty: 'easy', mastery: 'review' },
  { id: 'f14', deckId: 'd4', front: 'Que signifie Al-Khushu ?', back: 'La concentration et l\'humilité dans l\'adoration.', tags: ['Spiritualité'], difficulty: 'medium', mastery: 'new' },
];

// ── Books ─────────────────────────────────────────
export const books: Book[] = [
  { id: 'b1', title: 'Les Jardins des Vertueux', author: 'Imam An-Nawawi', description: 'Un recueil majeur de hadiths couvrant tous les aspects de la vie du musulman.', category: 'Hadith', language: 'Français', status: 'reading', rating: 5, tags: ['Hadith', 'Référence'], addedAt: '2025-01-05' },
  { id: 'b2', title: 'La Citadelle du Musulman', author: 'Sa\'id al-Qahtani', description: 'Recueil d\'invocations et rappels tirés du Coran et de la Sunna.', category: 'Invocations', language: 'Français', status: 'read', rating: 5, tags: ['Invocations', 'Quotidien'], addedAt: '2024-12-20' },
  { id: 'b3', title: 'Le Livre du Tawhid', author: 'Muhammad ibn Abd al-Wahhab', description: 'Ouvrage fondamental sur l\'unicité d\'Allah.', category: 'Croyance', language: 'Français', status: 'to_read', tags: ['Croyance', 'Tawhid'], addedAt: '2025-02-10' },
  { id: 'b4', title: 'Les Quarante Hadiths', author: 'Imam An-Nawawi', description: 'Quarante-deux hadiths fondamentaux résumant la religion.', category: 'Hadith', language: 'Français', status: 'read', rating: 5, tags: ['Hadith'], addedAt: '2024-11-15' },
  { id: 'b5', title: 'Ainsi était Muhammad ﷺ', author: 'Dr. Adil ibn Ali ash-Shaddi', description: 'Un ouvrage décrivant le caractère et les qualités du Prophète ﷺ.', category: 'Sira', language: 'Français', status: 'reading', tags: ['Sira', 'Comportement'], addedAt: '2025-03-01' },
  { id: 'b6', title: 'Comprendre l\'Islam', author: 'Tariq Ramadan', description: 'Introduction accessible aux principes de l\'islam moderne.', category: 'Introduction', language: 'Français', status: 'to_read', tags: ['Introduction'], addedAt: '2025-03-15' },
];

// ── Book Passages ─────────────────────────────────
export const bookPassages: BookPassage[] = [
  { id: 'p1', bookId: 'b1', title: 'L\'intention dans les actes', content: '[Exemple de démonstration] Passage sur l\'importance de l\'intention sincère dans chaque acte d\'adoration.', reflection: 'Chaque acte du quotidien peut devenir une adoration si l\'intention est bonne.', page: 12, tags: ['Intention', 'Pratique'], isFavorite: true, createdAt: '2025-01-20' },
  { id: 'p2', bookId: 'b1', title: 'La douceur dans les relations', content: '[Exemple de démonstration] Passage sur la manière douce et bienveillante du Prophète ﷺ.', reflection: 'Être doux ne signifie pas être faible ; c\'est une force de caractère.', page: 45, tags: ['Comportement'], isFavorite: false, createdAt: '2025-01-25' },
  { id: 'p3', bookId: 'b2', title: 'Invocation du matin', content: '[Exemple de démonstration] Les invocations recommandées au réveil et en début de journée.', page: 8, tags: ['Invocations', 'Quotidien'], isFavorite: true, createdAt: '2025-01-02' },
  { id: 'p4', bookId: 'b4', title: 'Hadith sur l\'intention', content: '[Exemple de démonstration] Explication détaillée du premier hadith : les actes ne valent que par les intentions.', reflection: 'Ce hadith est la base de toute la jurisprudence islamique.', page: 3, tags: ['Hadith', 'Intention'], isFavorite: true, createdAt: '2024-12-01' },
  { id: 'p5', bookId: 'b4', title: 'Hadith sur les cinq piliers', content: '[Exemple de démonstration] Le hadith de Jibril qui explique l\'islam, la foi et l\'excellence.', page: 5, tags: ['Hadith', 'Fondements'], isFavorite: false, createdAt: '2024-12-05' },
  { id: 'p6', bookId: 'b5', title: 'Sa générosité', content: '[Exemple de démonstration] Passage décrivant la générosité sans limite du Prophète ﷺ.', reflection: 'La générosité commence par un sourire et une bonne parole.', page: 34, tags: ['Sira', 'Comportement'], isFavorite: true, createdAt: '2025-03-05' },
  { id: 'p7', bookId: 'b5', title: 'Sa patience face à l\'adversité', content: '[Exemple de démonstration] Comment le Prophète ﷺ faisait preuve de patience face aux épreuves.', page: 67, tags: ['Sira', 'Sabr'], isFavorite: false, createdAt: '2025-03-08' },
  { id: 'p8', bookId: 'b1', title: 'La sincérité dans l\'adoration', content: '[Exemple de démonstration] Passage expliquant l\'importance d\'adorer Allah avec sincérité et sans ostentation.', reflection: 'L\'ostentation annule la récompense des bonnes actions.', page: 78, tags: ['Spiritualité', 'Sincérité'], isFavorite: false, createdAt: '2025-02-15' },
];

// ── Favorites ─────────────────────────────────────
export const favorites: Favorite[] = [
  { id: 'fav1', type: 'content', itemId: 'c1', title: 'Sourate Al-Fatiha', description: 'Verset d\'ouverture', addedAt: '2025-01-10' },
  { id: 'fav2', type: 'content', itemId: 'c4', title: 'L\'unicité divine', description: 'Sourate Al-Ikhlas', addedAt: '2025-01-15' },
  { id: 'fav3', type: 'book', itemId: 'b1', title: 'Les Jardins des Vertueux', description: 'Imam An-Nawawi', addedAt: '2025-01-05' },
  { id: 'fav4', type: 'passage', itemId: 'p1', title: 'L\'intention dans les actes', description: 'Les Jardins des Vertueux', addedAt: '2025-01-20' },
  { id: 'fav5', type: 'theme', itemId: 'th2', title: 'Tawhid', description: 'L\'unicité d\'Allah', addedAt: '2025-02-01' },
];

// ── Daily Reminders ───────────────────────────────
export const dailyReminders: DailyReminder[] = [
  { id: 'dr1', content: '[Exemple de démonstration] « Certes, avec la difficulté vient la facilité. »', source: 'Coran — Sourate 94, verset 6', type: 'verse', date: '2025-04-04' },
  { id: 'dr2', content: '[Exemple de démonstration] « Le meilleur d\'entre vous est celui qui apprend le Coran et l\'enseigne. »', source: 'Rapporté par Al-Bukhari', type: 'hadith', date: '2025-04-03' },
  { id: 'dr3', content: '[Exemple de démonstration] La science est une lumière qu\'Allah place dans le cœur de qui Il veut.', type: 'wisdom', date: '2025-04-02' },
];

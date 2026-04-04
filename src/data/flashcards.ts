import { FlashcardDeck, Flashcard } from '@/types';

export const flashcardDecks: FlashcardDeck[] = [
  {
    id: 'deck-tawhid',
    title: 'Fondements du Tawhid',
    description: 'Les bases essentielles de l\'unicité d\'Allah',
    themeId: 'tawhid',
    cardCount: 5,
    masteredCount: 2,
    color: '#c9a84c',
    icon: 'Sun',
    lastStudied: '2024-01-15',
  },
  {
    id: 'deck-salat',
    title: 'La Prière - Essentiel',
    description: 'Conditions, piliers et obligations de la prière',
    themeId: 'salat',
    cardCount: 4,
    masteredCount: 1,
    color: '#1e6b5e',
    icon: 'Moon',
    lastStudied: '2024-01-14',
  },
  {
    id: 'deck-iman',
    title: 'Piliers de la Foi',
    description: 'Les six piliers de la foi en Islam',
    themeId: 'iman',
    cardCount: 3,
    masteredCount: 0,
    color: '#d4b65a',
    icon: 'Heart',
  },
  {
    id: 'deck-vocab',
    title: 'Vocabulaire islamique',
    description: 'Termes essentiels à connaître',
    cardCount: 4,
    masteredCount: 1,
    color: '#14b8a6',
    icon: 'BookOpen',
    lastStudied: '2024-01-13',
  },
  {
    id: 'deck-sira',
    title: 'Dates clés de la Sira',
    description: 'Les événements majeurs de la vie du Prophète ﷺ',
    themeId: 'sira',
    cardCount: 3,
    masteredCount: 0,
    color: '#0f766e',
    icon: 'Compass',
  },
];

export const flashcards: Flashcard[] = [
  // Tawhid deck
  { id: 'fc-1', deckId: 'deck-tawhid', front: 'Qu\'est-ce que le Tawhid Ar-Rububiyyah ?', back: '[Démo] C\'est l\'unicité d\'Allah dans la seigneurie : croire qu\'Allah est le seul Créateur, Pourvoyeur et Gestionnaire de l\'univers.', tags: ['tawhid'], difficulty: 'easy', mastery: 'mastered', reviewCount: 5 },
  { id: 'fc-2', deckId: 'deck-tawhid', front: 'Qu\'est-ce que le Tawhid Al-Uluhiyyah ?', back: '[Démo] C\'est l\'unicité dans l\'adoration : vouer toute forme d\'adoration à Allah seul, sans associé.', tags: ['tawhid'], difficulty: 'easy', mastery: 'mastered', reviewCount: 4 },
  { id: 'fc-3', deckId: 'deck-tawhid', front: 'Qu\'est-ce que le Shirk ?', back: '[Démo] C\'est le fait d\'associer à Allah un autre dans ce qui Lui est propre, que ce soit dans la seigneurie, l\'adoration ou les noms et attributs.', tags: ['tawhid'], difficulty: 'medium', mastery: 'reviewing', reviewCount: 2 },
  { id: 'fc-4', deckId: 'deck-tawhid', front: 'Quelle sourate résume le Tawhid ?', back: 'Sourate Al-Ikhlas (112). Elle affirme l\'unicité absolue d\'Allah en quatre versets.', tags: ['tawhid', 'coran'], difficulty: 'easy', mastery: 'learning', reviewCount: 1 },
  { id: 'fc-5', deckId: 'deck-tawhid', front: 'Quels sont les types de Shirk ?', back: '[Démo] Le Shirk majeur (qui fait sortir de l\'Islam) et le Shirk mineur (qui ne fait pas sortir mais diminue le Tawhid).', tags: ['tawhid'], difficulty: 'hard', mastery: 'new', reviewCount: 0 },
  // Salat deck
  { id: 'fc-6', deckId: 'deck-salat', front: 'Combien y a-t-il de prières obligatoires par jour ?', back: 'Cinq prières : Fajr, Dhuhr, Asr, Maghrib et Isha.', tags: ['salat'], difficulty: 'easy', mastery: 'mastered', reviewCount: 6 },
  { id: 'fc-7', deckId: 'deck-salat', front: 'Quelles sont les conditions de validité de la prière ?', back: '[Démo] L\'entrée du temps, la pureté rituelle, couvrir la awra, s\'orienter vers la Qibla, et l\'intention.', tags: ['salat'], difficulty: 'medium', mastery: 'learning', reviewCount: 2 },
  { id: 'fc-8', deckId: 'deck-salat', front: 'Qu\'est-ce que le Khushu ?', back: '[Démo] C\'est la concentration et l\'humilité du cœur et du corps dans la prière, en étant conscient de la présence d\'Allah.', tags: ['salat'], difficulty: 'medium', mastery: 'reviewing', reviewCount: 3 },
  { id: 'fc-9', deckId: 'deck-salat', front: 'Quelle est la sourate obligatoire dans chaque unité de prière ?', back: 'Sourate Al-Fatiha. La prière n\'est pas valide sans sa récitation.', tags: ['salat', 'coran'], difficulty: 'easy', mastery: 'new', reviewCount: 0 },
  // Iman deck
  { id: 'fc-10', deckId: 'deck-iman', front: 'Quels sont les six piliers de la foi ?', back: '[Démo] Croire en Allah, Ses anges, Ses livres, Ses messagers, au Jour Dernier et au destin (bon ou mauvais).', tags: ['iman'], difficulty: 'easy', mastery: 'new', reviewCount: 0 },
  { id: 'fc-11', deckId: 'deck-iman', front: 'Qu\'est-ce que Al-Qadr ?', back: '[Démo] C\'est la croyance au destin : Allah a tout décrété et rien n\'échappe à Sa science et Sa volonté.', tags: ['iman'], difficulty: 'medium', mastery: 'new', reviewCount: 0 },
  { id: 'fc-12', deckId: 'deck-iman', front: 'Combien de livres révélés sont mentionnés dans le Coran ?', back: '[Démo] Quatre livres principaux sont mentionnés : la Torah, les Psaumes (Zabur), l\'Évangile (Injil) et le Coran.', tags: ['iman'], difficulty: 'medium', mastery: 'new', reviewCount: 0 },
  // Vocab deck
  { id: 'fc-13', deckId: 'deck-vocab', front: 'Que signifie "Taqwa" ?', back: '[Démo] La piété, la crainte révérencielle d\'Allah. C\'est placer entre soi et la colère d\'Allah une protection par l\'obéissance.', tags: ['vocabulaire'], difficulty: 'easy', mastery: 'mastered', reviewCount: 5 },
  { id: 'fc-14', deckId: 'deck-vocab', front: 'Que signifie "Fiqh" ?', back: '[Démo] La compréhension approfondie de la religion. En terme technique, c\'est la science des règles pratiques de la législation islamique.', tags: ['vocabulaire'], difficulty: 'easy', mastery: 'learning', reviewCount: 2 },
  { id: 'fc-15', deckId: 'deck-vocab', front: 'Que signifie "Sunnah" ?', back: '[Démo] La voie, la pratique. En terme technique, c\'est l\'ensemble des paroles, actes et approbations du Prophète ﷺ.', tags: ['vocabulaire'], difficulty: 'easy', mastery: 'reviewing', reviewCount: 3 },
  { id: 'fc-16', deckId: 'deck-vocab', front: 'Que signifie "Bid\'ah" ?', back: '[Démo] L\'innovation dans la religion. C\'est inventer dans la religion ce qui n\'en fait pas partie.', tags: ['vocabulaire'], difficulty: 'medium', mastery: 'new', reviewCount: 0 },
  // Sira deck
  { id: 'fc-17', deckId: 'deck-sira', front: 'En quelle année le Prophète ﷺ est-il né ?', back: 'L\'année de l\'éléphant, environ 570 après J.-C. à La Mecque.', tags: ['sira'], difficulty: 'easy', mastery: 'new', reviewCount: 0 },
  { id: 'fc-18', deckId: 'deck-sira', front: 'Qu\'est-ce que l\'Hégire ?', back: '[Démo] L\'émigration du Prophète ﷺ de La Mecque vers Médine en 622 après J.-C. Elle marque le début du calendrier islamique.', tags: ['sira'], difficulty: 'easy', mastery: 'new', reviewCount: 0 },
  { id: 'fc-19', deckId: 'deck-sira', front: 'Quelle était la première révélation ?', back: '[Démo] Les premiers versets révélés furent les cinq premiers versets de la sourate Al-Alaq : "Lis au nom de ton Seigneur qui a créé."', tags: ['sira', 'coran'], difficulty: 'medium', mastery: 'new', reviewCount: 0 },
];

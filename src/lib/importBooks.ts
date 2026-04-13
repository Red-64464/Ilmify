/**
 * Import books from Goodreads CSV export or IslamicBooksDB format.
 */

export interface ImportedBook {
  title: string;
  author: string;
  isbn?: string;
  status: 'to-read' | 'reading' | 'read';
  rating?: number;
  category: string;
}

/**
 * Parse a Goodreads CSV export file.
 * Expected columns: Title, Author, ISBN, Exclusive Shelf, My Rating, etc.
 */
export function parseGoodreadsCsv(csvText: string): ImportedBook[] {
  const lines = csvText.split('\n').filter(Boolean);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const titleIdx = headers.findIndex((h) => h === 'title');
  const authorIdx = headers.findIndex((h) => h.includes('author'));
  const isbnIdx = headers.findIndex((h) => h === 'isbn' || h === 'isbn13');
  const shelfIdx = headers.findIndex((h) => h.includes('shelf') || h.includes('exclusive'));
  const ratingIdx = headers.findIndex((h) => h.includes('my rating') || h === 'rating');

  if (titleIdx === -1 || authorIdx === -1) {
    throw new Error('Format CSV invalide : colonnes Title et Author requises.');
  }

  const books: ImportedBook[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (!cols[titleIdx]?.trim()) continue;

    const shelf = (cols[shelfIdx] || '').trim().toLowerCase();
    let status: 'to-read' | 'reading' | 'read' = 'to-read';
    if (shelf === 'read') status = 'read';
    else if (shelf === 'currently-reading') status = 'reading';

    const rating = parseInt(cols[ratingIdx] || '0', 10);

    books.push({
      title: cols[titleIdx].trim(),
      author: cols[authorIdx].trim(),
      isbn: cols[isbnIdx]?.trim().replace(/[="]/g, '') || undefined,
      status,
      rating: rating > 0 ? rating : undefined,
      category: 'Autre',
    });
  }
  return books;
}

/**
 * Parse IslamicBooksDB JSON format.
 * Expects array of objects with: title, author, category, language
 */
export function parseIslamicBooksJson(jsonText: string): ImportedBook[] {
  let data: Record<string, string>[];
  try {
    const parsed = JSON.parse(jsonText);
    data = Array.isArray(parsed) ? parsed : parsed.books || [];
  } catch {
    throw new Error('Format JSON invalide.');
  }

  return data.map((item) => ({
    title: item.title || 'Sans titre',
    author: item.author || 'Inconnu',
    isbn: item.isbn || undefined,
    status: 'to-read' as const,
    rating: undefined,
    category: item.category || 'Autre',
  }));
}

/**
 * Auto-detect format and parse.
 */
export function parseBookImport(text: string, filename: string): ImportedBook[] {
  const ext = filename.toLowerCase();
  if (ext.endsWith('.csv') || text.trim().startsWith('Title') || text.includes(',Author')) {
    return parseGoodreadsCsv(text);
  }
  if (ext.endsWith('.json') || text.trim().startsWith('[') || text.trim().startsWith('{')) {
    return parseIslamicBooksJson(text);
  }
  throw new Error('Format non reconnu. Utilisez un fichier .csv (Goodreads) ou .json (IslamicBooksDB).');
}

/** Parse a single CSV line handling quoted fields */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/**
 * Export all user data as a ZIP file (RGPD compliance).
 * Collects topics, books, passages, courses, flashcards, etc.
 */
import { topicRepository } from '@/lib/repositories/topicRepository';
import { bookRepository } from '@/lib/repositories/bookRepository';
import { courseRepository } from '@/lib/repositories/courseRepository';
import { flashcardRepository } from '@/lib/repositories/flashcardRepository';
import { mediaRepository } from '@/lib/repositories/mediaRepository';

/** Minimal ZIP builder (stored entries, no compression) */
function buildZip(files: { path: string; data: Uint8Array }[]): Uint8Array {
  const entries: { path: Uint8Array; data: Uint8Array; offset: number }[] = [];
  const parts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const pathBytes = new TextEncoder().encode(file.path);
    const data = file.data;
    const header = new Uint8Array(30 + pathBytes.length);
    const hv = new DataView(header.buffer);
    hv.setUint32(0, 0x04034b50, true);
    hv.setUint16(4, 20, true);
    hv.setUint16(8, 0, true);
    hv.setUint32(14, crc32(data), true);
    hv.setUint32(18, data.length, true);
    hv.setUint32(22, data.length, true);
    hv.setUint16(26, pathBytes.length, true);
    header.set(pathBytes, 30);
    entries.push({ path: pathBytes, data, offset });
    parts.push(header, data);
    offset += header.length + data.length;
  }

  const cdStart = offset;
  for (const entry of entries) {
    const cd = new Uint8Array(46 + entry.path.length);
    const dv = new DataView(cd.buffer);
    dv.setUint32(0, 0x02014b50, true);
    dv.setUint16(4, 20, true);
    dv.setUint16(6, 20, true);
    dv.setUint32(16, crc32(entry.data), true);
    dv.setUint32(20, entry.data.length, true);
    dv.setUint32(24, entry.data.length, true);
    dv.setUint16(28, entry.path.length, true);
    dv.setUint32(42, entry.offset, true);
    cd.set(entry.path, 46);
    parts.push(cd);
    offset += cd.length;
  }

  const cdSize = offset - cdStart;
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, cdStart, true);
  parts.push(eocd);

  const total = parts.reduce((a, b) => a + b.length, 0);
  const result = new Uint8Array(total);
  let pos = 0;
  for (const part of parts) {
    result.set(part, pos);
    pos += part.length;
  }
  return result;
}

function crc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function toJsonBytes(data: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(data, null, 2));
}

export async function exportAllUserData(userId: string, displayName: string) {
  const files: { path: string; data: Uint8Array }[] = [];
  const encoder = new TextEncoder();

  // 1. Topics
  try {
    const topics = await topicRepository.getByUser(userId);
    files.push({ path: 'topics/topics.json', data: toJsonBytes(topics) });
  } catch { /* ignore */ }

  // 2. Books & Passages
  try {
    const books = await bookRepository.getAll(userId);
    files.push({ path: 'library/books.json', data: toJsonBytes(books) });
    for (const book of books) {
      try {
        const passages = await bookRepository.getPassagesByBook(book.id);
        if (passages.length > 0) {
          files.push({
            path: `library/passages_${book.id}.json`,
            data: toJsonBytes(passages),
          });
        }
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }

  // 3. Courses
  try {
    const folders = await courseRepository.getFolders();
    const pages = await courseRepository.getAllPages();
    files.push({ path: 'courses/folders.json', data: toJsonBytes(folders) });
    files.push({ path: 'courses/pages.json', data: toJsonBytes(pages) });
  } catch { /* ignore */ }

  // 4. Flashcards
  try {
    const decks = await flashcardRepository.getAllDecks(userId);
    files.push({ path: 'flashcards/decks.json', data: toJsonBytes(decks) });
    for (const deck of decks) {
      try {
        const cards = await flashcardRepository.getCardsByDeck(deck.id);
        if (cards.length > 0) {
          files.push({
            path: `flashcards/cards_${deck.id}.json`,
            data: toJsonBytes(cards),
          });
        }
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }

  // 5. Media
  try {
    const mediaFolders = await mediaRepository.getAllFolders();
    files.push({ path: 'media/folders.json', data: toJsonBytes(mediaFolders) });
    for (const folder of mediaFolders) {
      try {
        const videos = await mediaRepository.getVideosByFolder(folder.id);
        if (videos.length > 0) {
          files.push({
            path: `media/videos_${folder.id}.json`,
            data: toJsonBytes(videos),
          });
        }
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }

  // 6. Quran data (localStorage)
  try {
    const quranKeys = ['ilmify_quran_settings', 'ilmify_quran_bookmarks', 'ilmify_quran_memorization', 'ilmify_quran_position'];
    const quranData: Record<string, unknown> = {};
    for (const key of quranKeys) {
      const val = localStorage.getItem(key);
      if (val) {
        try {
          quranData[key] = JSON.parse(val);
        } catch {
          quranData[key] = val;
        }
      }
    }
    if (Object.keys(quranData).length > 0) {
      files.push({ path: 'quran/quran_data.json', data: toJsonBytes(quranData) });
    }
  } catch { /* ignore */ }

  // 7. Metadata
  files.push({
    path: 'export_info.json',
    data: toJsonBytes({
      exportedBy: displayName,
      userId,
      exportDate: new Date().toISOString(),
      version: '0.2.0',
      platform: 'Ilmify',
    }),
  });

  // 8. Readme
  files.push({
    path: 'README.txt',
    data: encoder.encode(`Export de données Ilmify
========================
Utilisateur : ${displayName}
Date : ${new Date().toLocaleDateString('fr-FR')}

Ce fichier ZIP contient toutes vos données Ilmify :
- topics/ : Vos topics et notes
- library/ : Vos livres et passages
- courses/ : Vos cours
- flashcards/ : Vos decks et cartes
- media/ : Vos vidéos sauvegardées
- quran/ : Vos données coraniques (favoris, mémorisation)

Format : JSON
Conformité : RGPD - Export complet des données personnelles
`),
  });

  // Build and download ZIP
  const zipData = buildZip(files);
  const blob = new Blob([zipData.buffer as ArrayBuffer], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Ilmify_Export_${displayName}_${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

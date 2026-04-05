import type { TopicBlock, BlockType } from '@/types';

const VALID_BLOCK_TYPES: BlockType[] = [
  'paragraph', 'heading1', 'heading2', 'heading3',
  'quote', 'bullet-list', 'numbered-list',
  'callout', 'reflection', 'reminder', 'source',
  'hadith', 'verse', 'dua', 'definition',
  'checklist', 'audio', 'poem', 'timeline', 'warning',
  'image', 'link', 'youtube',
  'pdf', 'qa', 'table', 'divider',
];

export interface ImportResult {
  blocks: TopicBlock[];
  warnings: string[];
}

function generateBlockId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `block-${crypto.randomUUID()}`;
  }
  return `block-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function isValidBlockType(type: string): type is BlockType {
  return VALID_BLOCK_TYPES.includes(type as BlockType);
}

/**
 * Parse a JSON string into validated TopicBlock[].
 * Accepts either an array of blocks or an object with a `blocks` array.
 */
export function parseAndValidateBlocks(jsonString: string): ImportResult {
  const warnings: string[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { blocks: [], warnings: ['JSON invalide. Vérifiez la syntaxe.'] };
  }

  // Accept { blocks: [...] } or [...] or { title: ..., blocks: [...] }
  let rawBlocks: unknown[];
  if (Array.isArray(parsed)) {
    rawBlocks = parsed;
  } else if (parsed && typeof parsed === 'object' && 'blocks' in parsed && Array.isArray((parsed as Record<string, unknown>).blocks)) {
    rawBlocks = (parsed as Record<string, unknown>).blocks as unknown[];
  } else {
    return { blocks: [], warnings: ['Le JSON doit être un tableau de blocs ou un objet avec une propriété "blocks".'] };
  }

  if (rawBlocks.length === 0) {
    return { blocks: [], warnings: ['Aucun bloc trouvé dans le JSON.'] };
  }

  const blocks: TopicBlock[] = [];

  for (let i = 0; i < rawBlocks.length; i++) {
    const raw = rawBlocks[i];
    if (!raw || typeof raw !== 'object') {
      warnings.push(`Bloc #${i + 1} ignoré : n'est pas un objet.`);
      continue;
    }

    const entry = raw as Record<string, unknown>;

    // Type validation
    const type = entry.type as string;
    if (!type || typeof type !== 'string') {
      warnings.push(`Bloc #${i + 1} ignoré : propriété "type" manquante.`);
      continue;
    }

    if (!isValidBlockType(type)) {
      warnings.push(`Bloc #${i + 1} ignoré : type "${type}" invalide.`);
      continue;
    }

    // Content — default to empty string
    const content = typeof entry.content === 'string' ? entry.content : '';

    // Metadata — must be Record<string, string> if present
    let metadata: Record<string, string> | undefined;
    if (entry.metadata && typeof entry.metadata === 'object' && !Array.isArray(entry.metadata)) {
      metadata = {};
      for (const [key, val] of Object.entries(entry.metadata as Record<string, unknown>)) {
        metadata[key] = String(val);
      }
    }

    blocks.push({
      id: generateBlockId(),
      type,
      content,
      metadata,
      order: blocks.length,
    });
  }

  if (blocks.length === 0 && warnings.length === 0) {
    warnings.push('Aucun bloc valide trouvé.');
  }

  return { blocks, warnings };
}

/**
 * Extract title from JSON if present (for page creation).
 */
export function extractTitleFromJson(jsonString: string): string | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>;
      if (typeof obj.title === 'string' && obj.title.trim()) {
        return obj.title.trim();
      }
    }
  } catch {
    // ignore
  }
  return null;
}

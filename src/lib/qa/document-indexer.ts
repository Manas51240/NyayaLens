import { LegalDocument } from '@/types/legal';
import { sanitizeDocumentContentForQA } from './safety-validator';

export interface IndexedParagraph {
  text: string;
  textLower: string;
  words: Set<string>;
  sectionTitle: string;
  lineIndex: number;
}

export interface IndexedClause {
  originalText: string;
  textLower: string;
  words: Set<string>;
  sectionTitle: string;
}

export interface DocumentIndex {
  documentId: string;
  sanitizedRawText: string;
  paragraphs: IndexedParagraph[];
  clauses: IndexedClause[];
  normalizedRawForGrounding?: string;
  cleanRawWordsForGrounding?: string;
  createdAt: number;
  lastAccessed: number;
}

// Bounded LRU Cache for Document Indexes (max 50 documents, 15 min TTL)
const INDEX_CACHE = new Map<string, DocumentIndex>();
const MAX_INDEX_CACHE_SIZE = 50;
const INDEX_TTL_MS = 15 * 60 * 1000;

function computeDocumentKey(doc: LegalDocument): string {
  const prefix = doc.id || 'anonymous';
  const len = doc.rawText ? doc.rawText.length : 0;
  // Fast 32-bit FNV-1a hash over first 1000 and last 1000 chars of rawText
  let hash = 0x811c9dc5;
  const sample = doc.rawText ? (doc.rawText.slice(0, 1000) + doc.rawText.slice(-1000)) : '';
  for (let i = 0; i < sample.length; i++) {
    hash ^= sample.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `${prefix}:${len}:${(hash >>> 0).toString(16)}`;
}

/**
 * Builds an index of a document's paragraphs, words, and sections for high-efficiency retrieval.
 */
export function buildDocumentIndex(document: LegalDocument): DocumentIndex {
  const sanitizedRawText = sanitizeDocumentContentForQA(document.rawText || '');
  
  const rawParas = sanitizedRawText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);

  const paragraphs: IndexedParagraph[] = [];

  for (let i = 0; i < rawParas.length; i++) {
    const para = rawParas[i];
    const textLower = para.toLowerCase().replace(/[-_]/g, ' ');
    
    // Extract unique words for O(1) set membership check
    const words = new Set<string>(
      textLower
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );

    // Extract section header if present
    let sectionTitle = 'Document Excerpt';
    const firstLine = para.split('\n')[0].trim();
    if (/^(SECTION|ARTICLE|§|[0-9]{1,2}\.)/i.test(firstLine) && firstLine.length < 70) {
      sectionTitle = firstLine;
    }

    paragraphs.push({
      text: para,
      textLower,
      words,
      sectionTitle,
      lineIndex: i + 1,
    });
  }

  // Index structured clauses if available
  const clauses: IndexedClause[] = [];
  if (Array.isArray(document.clauses)) {
    for (const clause of document.clauses) {
      const combined = `${clause.title} ${clause.originalText} ${clause.plainEnglishTranslation}`;
      const textLower = combined.toLowerCase().replace(/[-_]/g, ' ');
      const words = new Set<string>(
        textLower
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .filter((w) => w.length > 2)
      );

      clauses.push({
        originalText: clause.originalText,
        textLower,
        words,
        sectionTitle: clause.sourceSection || clause.title,
      });
    }
  }

  const now = Date.now();
  return {
    documentId: document.id,
    sanitizedRawText,
    paragraphs,
    clauses,
    createdAt: now,
    lastAccessed: now,
  };
}

/**
 * Retrieves an existing DocumentIndex from memory cache or builds and caches it.
 */
export function getOrBuildDocumentIndex(document: LegalDocument): DocumentIndex {
  const key = computeDocumentKey(document);
  const now = Date.now();
  const cached = INDEX_CACHE.get(key);

  if (cached && (now - cached.createdAt) < INDEX_TTL_MS) {
    cached.lastAccessed = now;
    return cached;
  }

  // Evict oldest if capacity exceeded
  if (INDEX_CACHE.size >= MAX_INDEX_CACHE_SIZE) {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    for (const [k, v] of INDEX_CACHE.entries()) {
      if (v.lastAccessed < oldestTime) {
        oldestTime = v.lastAccessed;
        oldestKey = k;
      }
    }
    if (oldestKey) {
      INDEX_CACHE.delete(oldestKey);
    }
  }

  const newIndex = buildDocumentIndex(document);
  INDEX_CACHE.set(key, newIndex);
  return newIndex;
}

/**
 * Clears the index cache (used during testing or session cleanup).
 */
export function clearDocumentIndexCache(): void {
  INDEX_CACHE.clear();
}

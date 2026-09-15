import { LegalDocument } from '@/types/legal';
import { GroundedQAResponse } from './types';

interface CachedQARecord {
  response: GroundedQAResponse;
  createdAt: number;
  lastAccessed: number;
}

const QA_CACHE = new Map<string, CachedQARecord>();
const MAX_QA_CACHE_SIZE = 100;
const QA_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Computes a secure, scoped cache key for a document question.
 */
export function computeQACacheKey(doc: LegalDocument, question: string): string {
  const docId = doc.id || 'anon';
  const rawLen = doc.rawText ? doc.rawText.length : 0;
  const sample = doc.rawText ? (doc.rawText.slice(0, 500) + doc.rawText.slice(-500)) : '';
  
  // Fast FNV-1a hash of sample
  let hash = 0x811c9dc5;
  for (let i = 0; i < sample.length; i++) {
    hash ^= sample.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  const normalizedQ = question.trim().toLowerCase().replace(/\s+/g, ' ');
  return `${docId}:${rawLen}:${(hash >>> 0).toString(16)}::${normalizedQ}`;
}

/**
 * Retrieves a cached Q&A response if available and not expired.
 */
export function getCachedQAResponse(
  doc: LegalDocument,
  question: string
): GroundedQAResponse | null {
  const key = computeQACacheKey(doc, question);
  const record = QA_CACHE.get(key);
  if (!record) return null;

  const now = Date.now();
  if (now - record.createdAt > QA_TTL_MS) {
    QA_CACHE.delete(key);
    return null;
  }

  record.lastAccessed = now;
  return record.response;
}

/**
 * Stores a verified Q&A response in the bounded cache.
 */
export function setCachedQAResponse(
  doc: LegalDocument,
  question: string,
  response: GroundedQAResponse
): void {
  const key = computeQACacheKey(doc, question);
  const now = Date.now();

  // LRU eviction if full
  if (QA_CACHE.size >= MAX_QA_CACHE_SIZE) {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    for (const [k, v] of QA_CACHE.entries()) {
      if (v.lastAccessed < oldestTime) {
        oldestTime = v.lastAccessed;
        oldestKey = k;
      }
    }
    if (oldestKey) {
      QA_CACHE.delete(oldestKey);
    }
  }

  QA_CACHE.set(key, {
    response,
    createdAt: now,
    lastAccessed: now,
  });
}

/**
 * Clears the Q&A cache.
 */
export function clearQACache(): void {
  QA_CACHE.clear();
}

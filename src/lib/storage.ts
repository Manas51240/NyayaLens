import { LegalDocument } from '@/types/legal';
import { SAMPLE_DOCUMENTS } from './sample-documents';
import { safeLogError } from './security/error-sanitizer';
import {
  saveDocumentToIDB,
  deleteDocumentFromIDB,
  getAllDocumentsFromIDB,
  migrateLocalStorageToIndexedDB,
} from './storage/indexed-db';

export { migrateLocalStorageToIndexedDB };

const STORAGE_KEY = 'nyayalens_documents_v1';
const PRIVACY_KEY = 'nyayalens_privacy_settings_v1';

export interface PrivacySettings {
  storageMode: 'local_only' | 'session_only';
  enablePiiPreRedaction: boolean;
  allowAnonymousTelemetry: boolean;
  autoPurgeDays: number;
}

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  storageMode: 'local_only',
  enablePiiPreRedaction: false,
  allowAnonymousTelemetry: false,
  autoPurgeDays: 30,
};

export function getStoredDocuments(): LegalDocument[] {
  if (typeof window === 'undefined') {
    return SAMPLE_DOCUMENTS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with initial sample documents
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_DOCUMENTS));
      return SAMPLE_DOCUMENTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_DOCUMENTS));
      return SAMPLE_DOCUMENTS;
    }
    // Validate that items conform to minimal LegalDocument structure to guard against storage poisoning
    const validDocs = parsed.filter(
      (item) => item && typeof item === 'object' && typeof item.id === 'string' && typeof item.title === 'string'
    );
    if (validDocs.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_DOCUMENTS));
      return SAMPLE_DOCUMENTS;
    }
    return validDocs;
  } catch {
    return SAMPLE_DOCUMENTS;
  }
}

export function getStoredDocumentById(id: string): LegalDocument | undefined {
  if (!id || typeof id !== 'string') return undefined;
  const docs = getStoredDocuments();
  return docs.find((d) => d.id === id);
}

export async function getStoredDocumentsAsync(): Promise<LegalDocument[]> {
  if (typeof window === 'undefined') return SAMPLE_DOCUMENTS;
  try {
    const idbDocs = await getAllDocumentsFromIDB();
    if (idbDocs && idbDocs.length > 0) {
      return idbDocs;
    }
  } catch {
    // Fall back to synchronous localStorage
  }
  return getStoredDocuments();
}

export function saveStoredDocument(document: LegalDocument): void {
  if (typeof window === 'undefined') return;
  if (!document || typeof document !== 'object' || !document.id || !document.title) return;

  // 1. Persist to IndexedDB (unlimited quota, durable across sessions)
  saveDocumentToIDB(document).catch(() => {});

  // 2. Persist to localStorage for immediate synchronous SSR hydration
  try {
    const docs = getStoredDocuments();
    const existingIndex = docs.findIndex((d) => d.id === document.id);
    let updated: LegalDocument[];
    if (existingIndex >= 0) {
      updated = [...docs];
      updated[existingIndex] = document;
    } else {
      updated = [document, ...docs];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    if (err instanceof DOMException && (err.name === 'QuotaExceededError' || err.code === 22)) {
      console.warn(
        '[STORAGE] LocalStorage quota exceeded (5MB limit). Document was safely persisted to IndexedDB.'
      );
    } else {
      safeLogError('Failed to persist document to localStorage', err);
    }
  }

  // 3. Asynchronously synchronize with session-isolated server storage
  fetch('/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document }),
  }).catch(() => {
    // Background sync failure gracefully handled; client-side storage remains intact
  });
}

export function deleteStoredDocument(id: string): boolean {
  if (typeof window === 'undefined') return false;
  // Delete from IndexedDB
  deleteDocumentFromIDB(id).catch(() => {});

  try {
    const docs = getStoredDocuments();
    const filtered = docs.filter((d) => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    // Asynchronously delete from server storage
    fetch(`/api/documents/${id}`, { method: 'DELETE' }).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

export function clearAllStoredDocuments(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function resetToDefaultSampleDocuments(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_DOCUMENTS));
}

export function getStoredPrivacySettings(): PrivacySettings {
  if (typeof window === 'undefined') return DEFAULT_PRIVACY_SETTINGS;
  try {
    const raw = localStorage.getItem(PRIVACY_KEY);
    if (!raw) return DEFAULT_PRIVACY_SETTINGS;
    return { ...DEFAULT_PRIVACY_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PRIVACY_SETTINGS;
  }
}

export function saveStoredPrivacySettings(settings: Partial<PrivacySettings>): PrivacySettings {
  if (typeof window === 'undefined') return DEFAULT_PRIVACY_SETTINGS;
  const current = getStoredPrivacySettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(PRIVACY_KEY, JSON.stringify(updated));
  return updated;
}

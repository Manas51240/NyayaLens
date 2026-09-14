import { LegalDocument } from '@/types/legal';
import { SAMPLE_DOCUMENTS } from './sample-documents';

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
    return parsed;
  } catch {
    return SAMPLE_DOCUMENTS;
  }
}

export function getStoredDocumentById(id: string): LegalDocument | undefined {
  const docs = getStoredDocuments();
  return docs.find((d) => d.id === id);
}

export function saveStoredDocument(document: LegalDocument): void {
  if (typeof window === 'undefined') return;
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
    console.error('Failed to persist document to storage:', err);
  }
}

export function deleteStoredDocument(id: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const docs = getStoredDocuments();
    const filtered = docs.filter((d) => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
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

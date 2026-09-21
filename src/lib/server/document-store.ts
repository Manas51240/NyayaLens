import { LegalDocument } from '@/types/legal';
import { SAMPLE_DOCUMENTS } from '@/lib/sample-documents';

export interface StoredDocumentRecord {
  document: LegalDocument;
  ownerSessionId: string; // 'public' for system samples, or 'ses_...' for users
  createdAt: number;
  lastAccessedAt: number;
}

class DocumentStore {
  private records: Map<string, StoredDocumentRecord> = new Map();

  constructor() {
    this.seedSampleDocuments();
  }

  private seedSampleDocuments() {
    for (const sample of SAMPLE_DOCUMENTS) {
      this.records.set(sample.id, {
        document: sample,
        ownerSessionId: 'public',
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
      });
    }
  }

  /**
   * Resets the store back to default sample documents (primarily for testing).
   */
  public reset() {
    this.records.clear();
    this.seedSampleDocuments();
  }

  /**
   * Saves a document under a specific user session.
   */
  public saveDocument(document: LegalDocument, ownerSessionId: string): StoredDocumentRecord {
    if (!document || !document.id) {
      throw new Error('Document must have a valid id');
    }
    const record: StoredDocumentRecord = {
      document,
      ownerSessionId: ownerSessionId || 'public',
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
    };
    this.records.set(document.id, record);
    return record;
  }

  /**
   * Retrieves a document by ID with strict ownership/IDOR enforcement.
   * - If document does not exist: returns { found: false }
   * - If document exists and is public: returns { found: true, document }
   * - If document exists and belongs to calling session: returns { found: true, document }
   * - If document exists but belongs to ANOTHER session: returns { found: true, forbidden: true }
   */
  public getDocument(
    id: string,
    callerSessionId: string
  ): { found: boolean; document?: LegalDocument; forbidden?: boolean } {
    const record = this.records.get(id);
    if (!record) {
      return { found: false };
    }

    record.lastAccessedAt = Date.now();

    // Public sample documents are accessible to everyone
    if (record.ownerSessionId === 'public') {
      return { found: true, document: record.document };
    }

    // Strict user isolation
    if (record.ownerSessionId !== callerSessionId) {
      return { found: true, forbidden: true };
    }

    return { found: true, document: record.document };
  }

  /**
   * Deletes a document with strict ownership enforcement.
   */
  public deleteDocument(
    id: string,
    callerSessionId: string
  ): { success: boolean; error?: string; status: number } {
    const record = this.records.get(id);
    if (!record) {
      return { success: false, error: 'Document not found.', status: 404 };
    }

    if (record.ownerSessionId === 'public') {
      return {
        success: false,
        error: 'System sample documents cannot be permanently deleted from server store.',
        status: 403,
      };
    }

    if (record.ownerSessionId !== callerSessionId) {
      return {
        success: false,
        error: 'Forbidden: You do not have permission to delete this document.',
        status: 403,
      };
    }

    this.records.delete(id);
    return { success: true, status: 200 };
  }

  /**
   * Lists documents visible to the calling session:
   * Returns public samples + user-owned documents.
   * Cross-user documents are never returned.
   */
  public listDocuments(callerSessionId: string): LegalDocument[] {
    const visible: LegalDocument[] = [];
    for (const record of this.records.values()) {
      if (record.ownerSessionId === 'public' || record.ownerSessionId === callerSessionId) {
        visible.push(record.document);
      }
    }
    // Return newest user documents first, followed by samples
    return visible.sort((a, b) => {
      const aIsPublic = this.records.get(a.id)?.ownerSessionId === 'public';
      const bIsPublic = this.records.get(b.id)?.ownerSessionId === 'public';
      if (aIsPublic && !bIsPublic) return 1;
      if (!aIsPublic && bIsPublic) return -1;
      return 0;
    });
  }
}

// Global singleton instance for serverless lifecycle
const globalForStore = globalThis as unknown as { __nyayalensDocumentStore?: DocumentStore };
export const documentStore = globalForStore.__nyayalensDocumentStore ?? new DocumentStore();
if (process.env.NODE_ENV !== 'production') {
  globalForStore.__nyayalensDocumentStore = documentStore;
}

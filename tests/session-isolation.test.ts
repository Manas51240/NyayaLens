import { describe, it, expect, beforeEach } from 'vitest';
import { createSignedSessionToken, verifySessionToken } from '@/lib/server/session';
import { documentStore } from '@/lib/server/document-store';
import { LegalDocument } from '@/types/legal';

describe('Security & Session Isolation / IDOR Defense', () => {
  beforeEach(() => {
    documentStore.reset();
  });

  describe('Session Token Cryptography', () => {
    it('creates and verifies valid signed session tokens', () => {
      const token = createSignedSessionToken();
      expect(typeof token).toBe('string');
      const verified = verifySessionToken(token);
      expect(verified.valid).toBe(true);
      expect(verified.sessionId).toMatch(/^ses_/);
      expect(verified.expired).toBeUndefined();
    });

    it('rejects tampered signatures (signature forgery prevention)', () => {
      const token = createSignedSessionToken();
      const parts = token.split('.');
      // Tamper with payload
      const tamperedToken = `${parts[0]}_tampered.${parts[1]}.${parts[2]}`;
      const verified = verifySessionToken(tamperedToken);
      expect(verified.valid).toBe(false);
    });

    it('rejects malformed session tokens', () => {
      expect(verifySessionToken('').valid).toBe(false);
      expect(verifySessionToken('invalid.token').valid).toBe(false);
      expect(verifySessionToken('ses_123.abc.sig').valid).toBe(false);
    });
  });

  describe('Document Store Ownership & Cross-User Data Isolation', () => {
    const mockDocUserA: LegalDocument = {
      id: 'doc-user-a-confidential',
      title: 'Confidential Executive Employment Agreement - User A',
      fileName: 'UserA_Employment.pdf',
      fileType: 'pdf',
      fileSize: 2048,
      uploadedAt: new Date().toISOString(),
      documentType: 'Employment Agreement',
      rawText: 'This is User A private confidential text.',
      plainLanguageSummary: 'User A executive contract.',
      parties: [{ name: 'User A', role: 'Employee' }],
      effectiveDate: '2026-01-01',
      jurisdiction: 'Delaware',
      clauses: [],
      obligations: [],
      risks: [],
      actionItems: [],
      keyDates: [],
      consultationBrief: {
        documentPurpose: 'Executive Employment Agreement Review',
        parties: [{ name: 'User A', role: 'Employee' }],
        governingLawAndJurisdiction: 'Delaware',
        keyBusinessTerms: [],
        highPriorityConcerns: [],
        questionsForCounsel: [],
        relevantSectionsToHighlight: [],
        disclaimerNotice: 'Notice',
      },
    };

    const mockDocUserB: LegalDocument = {
      id: 'doc-user-b-confidential',
      title: 'Proprietary M&A Term Sheet - User B',
      fileName: 'UserB_TermSheet.pdf',
      fileType: 'pdf',
      fileSize: 4096,
      uploadedAt: new Date().toISOString(),
      documentType: 'Term Sheet',
      rawText: 'This is User B proprietary text.',
      plainLanguageSummary: 'User B term sheet.',
      parties: [{ name: 'User B', role: 'Buyer' }],
      effectiveDate: '2026-02-01',
      jurisdiction: 'New York',
      clauses: [],
      obligations: [],
      risks: [],
      actionItems: [],
      keyDates: [],
      consultationBrief: {
        documentPurpose: 'M&A Term Sheet Review',
        parties: [{ name: 'User B', role: 'Buyer' }],
        governingLawAndJurisdiction: 'New York',
        keyBusinessTerms: [],
        highPriorityConcerns: [],
        questionsForCounsel: [],
        relevantSectionsToHighlight: [],
        disclaimerNotice: 'Notice',
      },
    };

    it('allows User A to store and retrieve their own document', () => {
      const sessionUserA = 'ses_user_a_12345';
      documentStore.saveDocument(mockDocUserA, sessionUserA);

      const result = documentStore.getDocument(mockDocUserA.id, sessionUserA);
      expect(result.found).toBe(true);
      expect(result.forbidden).toBeUndefined();
      expect(result.document?.title).toBe(mockDocUserA.title);
    });

    it('blocks User B from accessing User A document (IDOR defense -> 403)', () => {
      const sessionUserA = 'ses_user_a_12345';
      const sessionUserB = 'ses_user_b_67890';
      documentStore.saveDocument(mockDocUserA, sessionUserA);

      // User B tries to view User A's document by guessing/changing ID
      const result = documentStore.getDocument(mockDocUserA.id, sessionUserB);
      expect(result.found).toBe(true);
      expect(result.forbidden).toBe(true);
      expect(result.document).toBeUndefined();
    });

    it('blocks User B from deleting User A document', () => {
      const sessionUserA = 'ses_user_a_12345';
      const sessionUserB = 'ses_user_b_67890';
      documentStore.saveDocument(mockDocUserA, sessionUserA);

      const deleteAttempt = documentStore.deleteDocument(mockDocUserA.id, sessionUserB);
      expect(deleteAttempt.success).toBe(false);
      expect(deleteAttempt.status).toBe(403);
      expect(deleteAttempt.error).toContain('Forbidden');

      // Verify Document A is still present for User A
      const verifyStillPresent = documentStore.getDocument(mockDocUserA.id, sessionUserA);
      expect(verifyStillPresent.found).toBe(true);
      expect(verifyStillPresent.forbidden).toBeUndefined();
    });

    it('allows User A to delete their own document', () => {
      const sessionUserA = 'ses_user_a_12345';
      documentStore.saveDocument(mockDocUserA, sessionUserA);

      const deleteRes = documentStore.deleteDocument(mockDocUserA.id, sessionUserA);
      expect(deleteRes.success).toBe(true);
      expect(deleteRes.status).toBe(200);

      const checkGone = documentStore.getDocument(mockDocUserA.id, sessionUserA);
      expect(checkGone.found).toBe(false);
    });

    it('never leaks User A documents in User B document list', () => {
      const sessionUserA = 'ses_user_a_12345';
      const sessionUserB = 'ses_user_b_67890';

      documentStore.saveDocument(mockDocUserA, sessionUserA);
      documentStore.saveDocument(mockDocUserB, sessionUserB);

      const listUserA = documentStore.listDocuments(sessionUserA);
      const listUserB = documentStore.listDocuments(sessionUserB);

      // User A list contains doc A and public samples, but NOT doc B
      expect(listUserA.some((d) => d.id === mockDocUserA.id)).toBe(true);
      expect(listUserA.some((d) => d.id === mockDocUserB.id)).toBe(false);

      // User B list contains doc B and public samples, but NOT doc A
      expect(listUserB.some((d) => d.id === mockDocUserB.id)).toBe(true);
      expect(listUserB.some((d) => d.id === mockDocUserA.id)).toBe(false);
    });

    it('allows all sessions to access public sample documents', () => {
      const sessionUserB = 'ses_user_b_67890';
      const sampleResult = documentStore.getDocument('sample-nda-mutual', sessionUserB);
      expect(sampleResult.found).toBe(true);
      expect(sampleResult.forbidden).toBeUndefined();
      expect(sampleResult.document?.title).toContain('Mutual Non-Disclosure Agreement');
    });

    it('prevents deletion of public sample contracts', () => {
      const sessionUserA = 'ses_user_a_12345';
      const deleteSample = documentStore.deleteDocument('sample-nda-mutual', sessionUserA);
      expect(deleteSample.success).toBe(false);
      expect(deleteSample.status).toBe(403);
    });
  });
});

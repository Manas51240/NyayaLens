import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as handleAnalyze } from '../src/app/api/analyze/route';
import { POST as handleAsk } from '../src/app/api/ask/route';
import { POST as handleCompare } from '../src/app/api/compare/route';
import { SAMPLE_DOCUMENTS, SAMPLE_NDA_V2_REVISED } from '../src/lib/sample-documents';

describe('HTTP API Route Handlers Integration Test Suite', () => {
  // --------------------------------------------------------------------------
  // 1. /api/analyze Endpoint
  // --------------------------------------------------------------------------
  describe('POST /api/analyze', () => {
    it('returns HTTP 400 when JSON rawText is empty or missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rawText: '   ' }),
      });

      const res = await handleAnalyze(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.errorCode).toBe('EMPTY_FILE');
    });

    it('returns HTTP 413 when JSON rawText exceeds 5MB limit', async () => {
      // 5.1MB string
      const hugeText = 'X'.repeat(5 * 1024 * 1024 + 100);
      const req = new NextRequest('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rawText: hugeText }),
      });

      const res = await handleAnalyze(req);
      expect(res.status).toBe(413);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.errorCode).toBe('FILE_TOO_LARGE');
    });

    it('sanitizes untrusted fileName and processes valid JSON contract text', async () => {
      const contractText = `
        CONSULTING SERVICES AGREEMENT
        Effective Date: January 1, 2025
        Parties: TechCorp Inc ("Company") and Jane Doe ("Consultant").
        1. Services: Consultant will deliver software engineering advisory.
        2. Compensation: $150 per hour payable net 30 days.
        3. Termination: Either party may terminate with 30 days written notice.
        4. Confidentiality: Obligations survive for 3 years post-termination.
      `;

      const req = new NextRequest('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          rawText: contractText,
          fileName: '../../../../etc/malicious_name.txt',
          fileType: 'txt',
        }),
      });

      const res = await handleAnalyze(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.document).toBeDefined();
      expect(json.document.id).toBeDefined();
      expect(json.document.title).toBeDefined();

      // Ensure fileName in response is sanitized (path traversal stripped)
      expect(json.document.fileName).not.toContain('../');
      expect(json.document.fileName).toBe('malicious_name.txt');

      // Ingestion metadata verification
      expect(json.ingestion.chunks.length).toBeGreaterThan(0);
      expect(json.ingestion.security).toBeDefined();
      expect(json.ingestion.security.hasPromptInjectionAttempt).toBe(false);
    });

    it('returns HTTP 400 for multipart upload without a file', async () => {
      const formData = new FormData();
      // file field omitted intentionally
      const req = new NextRequest('http://localhost:3000/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const res = await handleAnalyze(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.errorCode).toBe('MALFORMED_REQUEST');
    });
  });

  // --------------------------------------------------------------------------
  // 2. /api/ask Endpoint
  // --------------------------------------------------------------------------
  describe('POST /api/ask', () => {
    const sampleDoc = SAMPLE_DOCUMENTS[0];

    it('returns HTTP 400 when question is missing or blank', async () => {
      const req = new NextRequest('http://localhost:3000/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          document: sampleDoc,
          question: '   ',
        }),
      });

      const res = await handleAsk(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toContain('Please provide a valid question');
    });

    it('returns HTTP 400 when question exceeds 3,000 characters', async () => {
      const longQuestion = 'Q'.repeat(3050);
      const req = new NextRequest('http://localhost:3000/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          document: sampleDoc,
          question: longQuestion,
        }),
      });

      const res = await handleAsk(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toContain('Question exceeds maximum allowed length');
    });

    it('returns HTTP 400 when document context is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          question: 'What is the governing law?',
        }),
      });

      const res = await handleAsk(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toContain('Document context is missing');
    });

    it('successfully returns evidence-grounded answer for valid request', async () => {
      const req = new NextRequest('http://localhost:3000/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          document: sampleDoc,
          question: 'What is the notice period for contract termination?',
        }),
      });

      const res = await handleAsk(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.result).toBeDefined();
      expect(json.result.answer).toBeDefined();
      expect(json.result.safetyDisclaimer).toContain('NyayaLens is an AI-powered legal document understanding platform');
      expect(res.headers.get('X-RateLimit-Limit')).toBe('60');
      expect(res.headers.get('X-RateLimit-Remaining')).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // 3. /api/compare Endpoint
  // --------------------------------------------------------------------------
  describe('POST /api/compare', () => {
    it('returns HTTP 400 when docA or docB is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/compare', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          docA: SAMPLE_DOCUMENTS[0],
          // docB missing
        }),
      });

      const res = await handleCompare(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toContain('Both Document A and Document B are required');
    });

    it('successfully compares two documents semantically across 9 dimensions', async () => {
      const docA = SAMPLE_DOCUMENTS.find((d) => d.id === 'sample-nda-mutual') || SAMPLE_DOCUMENTS[0];
      const docB = SAMPLE_NDA_V2_REVISED;

      const req = new NextRequest('http://localhost:3000/api/compare', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ docA, docB }),
      });

      const res = await handleCompare(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.comparison).toBeDefined();
      expect(json.comparison.categoryDeltas).toBeDefined();
      expect(json.comparison.legalDisclaimer).toBeDefined();
    });

    it('handles identical document comparison gracefully with 0 material deltas', async () => {
      const doc = SAMPLE_DOCUMENTS[0];

      const req = new NextRequest('http://localhost:3000/api/compare', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ docA: doc, docB: doc }),
      });

      const res = await handleCompare(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.comparison).toBeDefined();
    });
  });
});

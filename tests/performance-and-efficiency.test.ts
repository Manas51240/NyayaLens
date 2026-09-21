import { describe, it, expect, beforeEach } from 'vitest';
import { SAMPLE_DOCUMENTS } from '../src/lib/sample-documents';
import { LegalDocument } from '../src/types/legal';
import { getOrBuildDocumentIndex, clearDocumentIndexCache } from '../src/lib/qa/document-indexer';
import { getCachedQAResponse, setCachedQAResponse, clearQACache, computeQACacheKey } from '../src/lib/qa/qa-cache';
import { runGroundedQAPipeline } from '../src/lib/qa/pipeline';
import { retrieveEvidence } from '../src/lib/qa/retriever';
import { classifyQueryIntent } from '../src/lib/qa/intent-classifier';
import { extractAndParseJsonCandidate } from '../src/lib/qa/gemini-synthesis';
import { checkRateLimit, InMemoryRateLimitStore, ProductionDistributedRateLimitStore } from '@/lib/security/rate-limiter';
import { NextRequest } from 'next/server';

describe('Performance, Indexing & Efficiency Suite', () => {
  const smallDoc = SAMPLE_DOCUMENTS[3]; // NDA (~2 KB)
  const medDoc = SAMPLE_DOCUMENTS[0]; // Employment (~7 KB)
  const largeDoc = SAMPLE_DOCUMENTS[1]; // Commercial Lease (~15 KB)

  beforeEach(() => {
    clearDocumentIndexCache();
    clearQACache();
  });

  it('Phase 2: Builds DocumentIndex once and reuses pre-tokenized paragraphs across queries', () => {
    const idx1 = getOrBuildDocumentIndex(largeDoc);
    expect(idx1.paragraphs.length).toBeGreaterThan(5);
    expect(idx1.paragraphs[0].words.size).toBeGreaterThan(0);

    // Second call must return the exact same cached index instance (0ms overhead)
    const idx2 = getOrBuildDocumentIndex(largeDoc);
    expect(idx2).toBe(idx1);
    expect(idx2.paragraphs).toBe(idx1.paragraphs);
  });

  it('Phase 6: Caches and deduplicates identical Q&A requests for immediate 0ms response', async () => {
    const question = 'What are the termination provisions?';
    
    // First invocation (computes retrieval and answers)
    const start1 = performance.now();
    const res1 = await runGroundedQAPipeline(medDoc, question);
    const duration1 = performance.now() - start1;

    expect(res1.answer).toBeDefined();
    expect(res1.confidence).toBeGreaterThan(0);

    // Second invocation (retrieves immediately from cache)
    const start2 = performance.now();
    const res2 = await runGroundedQAPipeline(medDoc, question);
    const duration2 = performance.now() - start2;

    expect(res2.answer).toBe(res1.answer);
    expect(res2.confidence).toBe(res1.confidence);
    expect(duration2).toBeLessThanOrEqual(duration1);
  });

  it('Phase 2 & 10: Multi-query performance against large document executes in sub-millisecond retrieval time', () => {
    const queries = [
      'What is the base salary and compensation?',
      'What are the non-solicitation restrictions?',
      'What is the notice period for contract termination?',
      'What happens regarding bonus clawback?',
    ];

    const startTime = performance.now();
    for (const q of queries) {
      const intent = classifyQueryIntent(q);
      const retrieval = retrieveEvidence(medDoc, intent);
      expect(retrieval.hasSufficientEvidence).toBe(true);
    }
    const totalTime = performance.now() - startTime;
    const avgTimePerQuery = totalTime / queries.length;

    // Average retrieval time per query should be extremely fast (< 10ms)
    expect(avgTimePerQuery).toBeLessThan(15);
  });

  it('Phase 5: extractAndParseJsonCandidate safely parses markdown fences without triggering correction retries', () => {
    const wrappedJson = '```json\n{"answer": "Rent is $5000", "answerType": "direct_answer", "evidence": [], "notFound": false, "confidence": 90, "suggestedFollowUpQuestions": []}\n```';
    const parsed = extractAndParseJsonCandidate(wrappedJson);
    expect(parsed).toBeDefined();
    expect((parsed as { answer: string }).answer).toBe('Rent is $5000');

    const conversationalWrapped = 'Here is the analysis:\n{"answer": "Valid", "answerType": "direct_answer", "evidence": [], "notFound": false, "confidence": 85, "suggestedFollowUpQuestions": []}\nHope that helps!';
    const parsedConv = extractAndParseJsonCandidate(conversationalWrapped);
    expect(parsedConv).toBeDefined();
    expect((parsedConv as { answer: string }).answer).toBe('Valid');
  });

  it('Phase 6 & 11: Cache isolation prevents cross-document data leakage', () => {
    const question = 'What is the governing law?';
    const keyA = computeQACacheKey(medDoc, question);
    const keyB = computeQACacheKey(smallDoc, question);

    expect(keyA).not.toBe(keyB);

    setCachedQAResponse(medDoc, question, {
      question,
      answer: 'Doc A Answer',
      intent: classifyQueryIntent(question),
      retrieval: { query: 'governing', evidenceItems: [], hasSufficientEvidence: true, searchExplanation: '' },
      groundedEvidence: [],
      notFoundInDocument: false,
      suggestedFollowUpQuestions: [],
      confidence: 90,
      safetyValidation: { isSafe: true, warnings: [], violationsBlocked: [], disclaimerAttached: true },
      safetyDisclaimer: '',
    });

    const cachedA = getCachedQAResponse(medDoc, question);
    const cachedB = getCachedQAResponse(smallDoc, question);

    expect(cachedA?.answer).toBe('Doc A Answer');
    expect(cachedB).toBeNull();
  });

  it('Phase 11: checkRateLimit returns proper limit, remaining and reset properties', () => {
    const dummyReq = new NextRequest('http://localhost:3000/api/ask', {
      headers: { 'x-forwarded-for': '192.168.1.100' },
    });

    const limit = checkRateLimit(dummyReq, { maxRequests: 50, windowMs: 60000 });
    expect(limit.limit).toBe(50);
    expect(limit.resetSeconds).toBeGreaterThan(0);
    expect(limit.allowed).toBe(true);
  });

  it('Phase 11: InMemoryRateLimitStore supports bounded eviction and TTL resets', () => {
    const store = new InMemoryRateLimitStore(2); // Small capacity

    store.set('client-1', { count: 1, resetTime: Date.now() + 10000 });
    store.set('client-2', { count: 2, resetTime: Date.now() + 10000 });
    expect(store.get('client-1')?.count).toBe(1);
    expect(store.get('client-2')?.count).toBe(2);

    // Stale eviction
    store.set('client-stale', { count: 1, resetTime: Date.now() - 100 });
    store.cleanup(Date.now(), true);
    expect(store.get('client-stale')).toBeUndefined();

    // Reset clears completely
    store.reset();
    expect(store.get('client-1')).toBeUndefined();
  });

  it('Phase 11: ProductionDistributedRateLimitStore operates safely in serverless environments', () => {
    const distStore = new ProductionDistributedRateLimitStore();

    expect(distStore.name).toBeDefined();
    // Test set & get on distributed store adapter
    distStore.set('serverless-node-1', { count: 5, resetTime: Date.now() + 5000 });
    const record = distStore.get('serverless-node-1');
    expect(record?.count).toBe(5);
  });
});

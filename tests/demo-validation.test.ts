import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { ingestDocument } from '@/lib/ingestion';
import { analyzeLegalDocument, askDocumentQuestion } from '@/lib/grounded-ai-engine';
import { analyzeLegalLanguage } from '@/lib/legal-language';
import { compareDocumentsSemantically } from '@/lib/comparison/semantic-comparator';

describe('Demo Legal Agreement Complete Validation', () => {
  it('processes NyayaLens_Demo_Legal_Agreement.pdf and answers questions', async () => {
    const pdfPath = path.resolve(process.cwd(), 'NyayaLens_Demo_Legal_Agreement.pdf');
    const buffer = fs.readFileSync(pdfPath);
    const ingestion = await ingestDocument({
      buffer,
      fileName: 'NyayaLens_Demo_Legal_Agreement.pdf',
      fileSize: buffer.length,
    });

    const doc = await analyzeLegalDocument(
      ingestion.normalizedText,
      'NyayaLens_Demo_Legal_Agreement.pdf',
      'pdf',
      buffer.length
    );

    expect(doc.title).toBeDefined();
    expect(doc.documentType).toBe('Software Services Agreement');
    expect(doc.parties.length).toBeGreaterThanOrEqual(1);

    // Question 1: Termination
    const q1 = 'What are the termination conditions in this agreement?';
    const a1 = await askDocumentQuestion(doc, q1);
    expect(a1.notFoundInDocument).toBe(false);
    expect(a1.answer.toLowerCase()).toMatch(/30 days|material breach|convenience|60 days/);
    expect(a1.groundedEvidence.length).toBeGreaterThan(0);

    // Question 2: Payment
    const q2 = 'What is the payment due period mentioned in the agreement?';
    const a2 = await askDocumentQuestion(doc, q2);
    expect(a2.notFoundInDocument).toBe(false);
    expect(a2.answer).toContain('30 days');
    expect(a2.groundedEvidence.length).toBeGreaterThan(0);

    // Question 3: CEO's favorite food (Anti-hallucination)
    const q3 = "What is the CEO's favorite food?";
    const a3 = await askDocumentQuestion(doc, q3);
    expect(a3.notFoundInDocument).toBe(true);
    expect(a3.answer.toLowerCase()).toMatch(/couldn't find|not found|not mentioned|not available/);

    // Legal Language Analysis Validation
    const langAnalysis = analyzeLegalLanguage(ingestion.normalizedText);
    expect(langAnalysis.totalTermsFound).toBeGreaterThan(10);
    expect(langAnalysis.termCounts['SHALL']).toBeGreaterThanOrEqual(10);
    expect(langAnalysis.termCounts['MAY']).toBeGreaterThanOrEqual(5);
    expect(langAnalysis.termCounts['MUST']).toBeGreaterThanOrEqual(1);
    expect(langAnalysis.mandatoryCount).toBeGreaterThan(0);
    expect(langAnalysis.permissiveCount).toBeGreaterThan(0);

    // Document Comparison Validation (v1 vs v2)
    const v2Path = path.resolve(process.cwd(), 'NyayaLens_Demo_Legal_Agreement_v2.pdf');
    const v2Buffer = fs.readFileSync(v2Path);
    const v2Ingestion = await ingestDocument({
      buffer: v2Buffer,
      fileName: 'NyayaLens_Demo_Legal_Agreement_v2.pdf',
      fileSize: v2Buffer.length,
    });
    const doc2 = await analyzeLegalDocument(
      v2Ingestion.normalizedText,
      'NyayaLens_Demo_Legal_Agreement_v2.pdf',
      'pdf',
      v2Buffer.length
    );

    const comparison = compareDocumentsSemantically(doc, doc2);

    // Check payment delta (30 days vs 15 days)
    const paymentDelta = comparison.categoryDeltas.payment.items.find(
      (item) => item.title.includes('Invoice') || item.category === 'payment'
    );
    expect(paymentDelta).toBeDefined();
    expect(paymentDelta?.docAContent).toContain('30');
    expect(paymentDelta?.docBContent).toContain('15');

    // Check termination delta (60 days vs 30 days)
    const termDelta = comparison.categoryDeltas.termination.items.find(
      (item) => item.category === 'termination'
    );
    expect(termDelta).toBeDefined();
    expect(termDelta?.docAContent).toContain('60');
    expect(termDelta?.docBContent).toContain('30');
  });
});


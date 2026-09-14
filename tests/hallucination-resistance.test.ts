import { describe, it, expect } from 'vitest';
import {
  verifyQuoteGrounding,
  calibrateConfidenceScore,
  filterUngroundedFindings,
  createAbsenceNotice,
} from '../src/lib/genai/grounding-verifier';
import {
  GroundedClauseSchema,
  GroundedRiskSchema,
  CompleteDocumentAnalysisSchema,
  AskDocumentResponseSchema,
} from '../src/lib/genai/schemas';
import { askDocumentQuestion, analyzeLegalDocument } from '../src/lib/grounded-ai-engine';
import { SAMPLE_DOCUMENTS } from '../src/lib/sample-documents';

describe('GenAI Grounding & Hallucination Resistance', () => {
  const sampleNda = SAMPLE_DOCUMENTS[3]; // Standard Mutual Non-Disclosure Agreement

  it('strictly returns "not found" with empty evidence when querying an absent clause', async () => {
    // The Mutual NDA contains no terms regarding liquidated damages or inventory delivery
    const response = await askDocumentQuestion(sampleNda, 'What are the liquidated damages penalties for late inventory delivery?');

    expect(response.notFoundInDocument).toBe(true);
    expect(response.groundedEvidence).toHaveLength(0);
    expect(response.answer).toContain('could not find');
    expect(response.missingInformationNotice).toBeDefined();
    expect(response.missingInformationNotice).toContain('could not find');
  });

  it('strictly returns "not found" when querying non-existent severance pay in an NDA', async () => {
    const response = await askDocumentQuestion(sampleNda, 'What severance package is the employee entitled to receive?');

    expect(response.notFoundInDocument).toBe(true);
    expect(response.groundedEvidence).toHaveLength(0);
    expect(response.answer.toLowerCase()).toContain('could not find');
  });

  it('verifies exact verbatim quotes as grounded with 1.0 match ratio', () => {
    const rawText = sampleNda.rawText;
    const exactSnippet = 'The Receiving Party shall: (a) hold Confidential Information in strict confidence';

    const verification = verifyQuoteGrounding(rawText, exactSnippet);
    expect(verification.isGrounded).toBe(true);
    expect(verification.matchRatio).toBe(1.0);
  });

  it('detects and rejects fabricated quotes not present in the document text', () => {
    const rawText = sampleNda.rawText;
    const hallucinatedQuote = 'Either party may disclose proprietary trade secrets on social media without penalty.';

    const verification = verifyQuoteGrounding(rawText, hallucinatedQuote);
    expect(verification.isGrounded).toBe(false);
    expect(verification.matchRatio).toBeLessThan(0.75);
    expect(verification.reason).toContain('insufficient grounding');
  });

  it('filters out ungrounded findings and preserves grounded ones', () => {
    const rawText = sampleNda.rawText;
    const candidateClauses = [
      {
        id: 'c-valid',
        title: 'Confidentiality Term',
        originalText: 'The Receiving Party shall: (a) hold Confidential Information in strict confidence',
        confidence: 90,
      },
      {
        id: 'c-hallucinated',
        title: 'Patent Royalty Clause',
        originalText: 'Receiving Party must pay a 15% recurring royalty on all global patented inventions.',
        confidence: 85,
      },
    ];

    const { verifiedFindings, rejectedCount } = filterUngroundedFindings(candidateClauses, rawText);

    expect(rejectedCount).toBe(1);
    expect(verifiedFindings).toHaveLength(1);
    expect(verifiedFindings[0].id).toBe('c-valid');
    expect(verifiedFindings[0].confidence).toBeGreaterThanOrEqual(80);
  });

  it('penalizes confidence scores for ungrounded claims', () => {
    const ungrounded = { isGrounded: false, matchRatio: 0.1 };
    const grounded = { isGrounded: true, matchRatio: 1.0 };

    const ungroundedScore = calibrateConfidenceScore(90, ungrounded);
    const groundedScore = calibrateConfidenceScore(90, grounded);

    expect(ungroundedScore).toBeLessThanOrEqual(20);
    expect(groundedScore).toBe(90);
  });

  it('creates structured absence notices explaining omission', () => {
    const notice = createAbsenceNotice('Non-Compete Covenant', 'Commercial Lease');

    expect(notice.notFound).toBe(true);
    expect(notice.missingInformationNotice).toContain('could not find');
    expect(notice.reviewAdvice).toContain('statutory defaults');
    expect(notice.searchTermsChecked).toContain('non-compete');
  });
});

describe('GenAI Structured Schemas Validation', () => {
  it('validates a well-formed grounded clause', () => {
    const validClause = {
      id: 'clause-1',
      title: 'Confidentiality Obligations',
      category: 'confidentiality',
      originalText: 'Recipient shall protect proprietary data with reasonable care.',
      plainEnglishTranslation: 'You must protect private company information.',
      sourceSection: 'Section 3.1',
      severity: 'high' as const,
      confidence: 95,
      suggestedAction: 'Ensure confidential information protocols are adhered to.',
    };

    const result = GroundedClauseSchema.safeParse(validClause);
    expect(result.success).toBe(true);
  });

  it('rejects a clause missing required verbatim originalText evidence', () => {
    const invalidClause = {
      id: 'clause-1',
      title: 'Confidentiality Obligations',
      category: 'confidentiality',
      originalText: '', // Empty original text is unacceptable
      plainEnglishTranslation: 'You must protect private company information.',
      sourceSection: 'Section 3.1',
      severity: 'high',
      confidence: 95,
      suggestedAction: 'Ensure confidential information protocols are adhered to.',
    };

    const result = GroundedClauseSchema.safeParse(invalidClause);
    expect(result.success).toBe(false);
  });

  it('rejects an invalid risk category not in the 10 defined categories', () => {
    const invalidRisk = {
      id: 'risk-1',
      category: 'extraterrestrial liability', // Invalid category
      severity: 'high',
      title: 'Alien encounter clause',
      explanation: 'Unusual clause detected.',
      sourceSection: 'Section 99',
      quote: 'Verbatim text here.',
      confidence: 80,
      reviewRecommendation: 'Consult lawyer.',
      suggestedQuestionForLawyer: 'Is this real?',
    };

    const result = GroundedRiskSchema.safeParse(invalidRisk);
    expect(result.success).toBe(false);
  });

  it('validates complete analysis result schema', async () => {
    const sampleDoc = SAMPLE_DOCUMENTS[0]; // Employment Agreement
    const analysis = await analyzeLegalDocument(
      sampleDoc.rawText,
      sampleDoc.fileName,
      sampleDoc.fileType,
      sampleDoc.fileSize
    );

    // Verify all clauses have original text
    for (const clause of analysis.clauses) {
      expect(clause.originalText.length).toBeGreaterThan(0);
      expect(clause.confidence).toBeGreaterThan(0);
      expect(clause.plainEnglishTranslation.length).toBeGreaterThan(0);
    }

    // Verify all risks have evidence quotes
    for (const risk of analysis.risks) {
      expect(risk.quote.length).toBeGreaterThan(0);
      expect(risk.category).toBeDefined();
      expect(risk.severity).toBeDefined();
    }
  });
});

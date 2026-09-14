import { describe, it, expect } from 'vitest';
import { compareLegalDocuments } from '../src/lib/grounded-ai-engine';
import { SAMPLE_DOCUMENTS, SAMPLE_NDA_V2_REVISED } from '../src/lib/sample-documents';

describe('Semantic Document Comparison Engine', () => {
  const standardNda = SAMPLE_DOCUMENTS[3]; // Mutual NDA v1 Base
  const revisedNda = SAMPLE_NDA_V2_REVISED; // Vendor Redline v2

  it('correctly detects additions and removals between contract versions', () => {
    const comparison = compareLegalDocuments(standardNda, revisedNda);

    expect(comparison.additions.length).toBeGreaterThan(0);
    expect(comparison.removals.length).toBeGreaterThan(0);
    expect(comparison.overallRiskShift).toBe('higher_for_user');
  });

  it('identifies shifts in financial obligations and penalty terms', () => {
    const comparison = compareLegalDocuments(standardNda, revisedNda);

    const damagesChange = comparison.changedFinancialObligations.find((f) =>
      f.docB.includes('$100,000') || f.description.toLowerCase().includes('liquidated damages')
    );
    expect(damagesChange).toBeDefined();
  });

  it('identifies jurisdiction and governing law alterations', () => {
    const comparison = compareLegalDocuments(standardNda, revisedNda);

    const jurisChange = comparison.changedClauses.find((c) =>
      c.title.toLowerCase().includes('jurisdiction') || c.category.toLowerCase().includes('dispute')
    );
    expect(jurisChange).toBeDefined();
  });

  it('detects semantic deltas across all 9 required legal dimensions', () => {
    const comparison = compareLegalDocuments(standardNda, revisedNda);
    const { categoryDeltas } = comparison;

    expect(categoryDeltas).toBeDefined();

    // 1. Changed Terms
    expect(categoryDeltas.changedTerms.hasDeltas).toBe(true);
    expect(categoryDeltas.changedTerms.items.some((i) => i.title.includes('Reciprocity'))).toBe(true);

    // 2. Dates
    expect(categoryDeltas.dates.hasDeltas).toBe(true);
    expect(categoryDeltas.dates.items.some((i) => i.title.includes('Survival') || i.title.includes('Date'))).toBe(true);

    // 3. Obligations
    expect(categoryDeltas.obligations.hasDeltas).toBe(true);
    expect(categoryDeltas.obligations.items.some((i) => i.title.includes('Covenant') || i.title.includes('Asymmetric'))).toBe(true);

    // 4. Payment
    expect(categoryDeltas.payment.hasDeltas).toBe(true);
    expect(categoryDeltas.payment.items.some((i) => i.title.includes('Liquidated Damages'))).toBe(true);

    // 5. Termination
    expect(categoryDeltas.termination).toBeDefined();

    // 6. Liability
    expect(categoryDeltas.liability).toBeDefined();

    // 7. Renewal
    expect(categoryDeltas.renewal).toBeDefined();

    // 8. Confidentiality
    expect(categoryDeltas.confidentiality.hasDeltas).toBe(true);
    expect(categoryDeltas.confidentiality.items.some((i) => i.title.includes('Confidential Information'))).toBe(true);

    // 9. Dispute Provisions
    expect(categoryDeltas.disputeProvisions.hasDeltas).toBe(true);
    expect(categoryDeltas.disputeProvisions.items.some((i) => i.title.includes('Governing Law') || i.title.includes('Fee'))).toBe(true);
  });

  it('provides precise source references for Document A and Document B', () => {
    const comparison = compareLegalDocuments(standardNda, revisedNda);
    const paymentDelta = comparison.categoryDeltas.payment.items[0];

    expect(paymentDelta).toBeDefined();
    expect(paymentDelta.sourceRefB).toBeDefined();
    expect(paymentDelta.sourceRefB).toContain('SECTION 4');
    expect(paymentDelta.quoteB).toContain('$100,000');

    const disputeDelta = comparison.categoryDeltas.disputeProvisions.items.find((i) =>
      i.title.includes('Governing Law')
    );
    expect(disputeDelta).toBeDefined();
    expect(disputeDelta?.sourceRefA).toBeDefined();
    expect(disputeDelta?.sourceRefB).toBeDefined();
  });

  it('strictly adheres to neutral review priority framing without characterizations of legally good or bad', () => {
    const comparison = compareLegalDocuments(standardNda, revisedNda);

    // Verify Review Priority is used instead of normative values
    expect(['high_review_priority', 'medium_review_priority', 'routine_variations']).toContain(
      comparison.reviewPrioritySummary
    );

    // Inspect all items across all 9 dimensions
    const allItems = Object.values(comparison.categoryDeltas).flatMap((c) => c.items);
    for (const item of allItems) {
      // Must use structured review priority
      expect(['high', 'medium', 'low', 'neutral']).toContain(item.reviewPriority);

      // Objective explanations and counsel prompts must be present
      expect(item.objectiveExplanation).toBeDefined();
      expect(item.objectiveExplanation.length).toBeGreaterThan(15);
      expect(item.counselDiscussionPrompt).toBeDefined();

      // No normative legal value judgments ("bad for you", "worse contract", "good change")
      const lowerExplanation = item.objectiveExplanation.toLowerCase();
      expect(lowerExplanation).not.toContain('bad contract');
      expect(lowerExplanation).not.toContain('worse for you');
      expect(lowerExplanation).not.toContain('good change');
    }

    // Must attach institutional legal disclaimer
    expect(comparison.legalDisclaimer).toContain('Notice:');
    expect(comparison.legalDisclaimer).toContain('attorney review priorities');
    expect(comparison.legalDisclaimer).toContain('does not characterize changes as legally definitive');
  });
});

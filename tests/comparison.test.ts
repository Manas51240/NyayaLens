import { describe, it, expect } from 'vitest';
import { compareLegalDocuments } from '../src/lib/grounded-ai-engine';
import { matchAndCompareClauses } from '../src/lib/comparison/semantic-comparator';
import { SAMPLE_DOCUMENTS, SAMPLE_NDA_V2_REVISED } from '../src/lib/sample-documents';
import { ImportantClause } from '../src/types/legal';

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

  describe('Comparison Scaling Benchmark & Regression Suite', () => {
    function generateSyntheticClauses(count: number): ImportantClause[] {
      const categories = ['Payment', 'Termination', 'Liability', 'Confidentiality', 'Intellectual Property', 'Dispute Resolution', 'Warranties', 'Governance'];
      const clauses: ImportantClause[] = [];
      for (let i = 0; i < count; i++) {
        const cat = categories[i % categories.length];
        clauses.push({
          id: `clause-${i + 1}`,
          title: `Section ${i + 1} - Standard ${cat} Protocol ${i + 1}`,
          category: cat,
          originalText: `The parties shall adhere to ${cat.toLowerCase()} terms under standard operating requirements for clause iteration ${i + 1}.`,
          plainEnglishTranslation: `Plain translation for clause ${i + 1}`,
          sourceSection: `Section ${i + 1}`,
          severity: (i % 4 === 0 ? 'high' : 'medium') as 'high' | 'medium',
          confidence: 90,
          suggestedAction: 'Review with counsel',
        });
      }
      return clauses;
    }

    it('benchmarks comparison scaling across 10, 50, 100, and 200+ clauses', () => {
      const benchmarks: Record<string, { count: number; elapsedMs: number; matchedCount: number }> = {};

      const sizes = [10, 50, 100, 250];

      for (const size of sizes) {
        const clausesA = generateSyntheticClauses(size);
        // Version B has 80% matching clauses, 10% modified text, 10% added new clauses
        const clausesB = clausesA.slice(0, Math.floor(size * 0.9)).map((c, idx) => {
          if (idx % 5 === 0) {
            return { ...c, id: `${c.id}-revised`, originalText: `${c.originalText} Revised terms apply.` };
          }
          return { ...c };
        });
        // Add additional clauses
        for (let j = 0; j < Math.floor(size * 0.1); j++) {
          clausesB.push({
            id: `new-clause-${j}`,
            title: `Section New.${j} - Additional Protocol`,
            category: 'Governance',
            originalText: `Newly inserted clause ${j} in version B.`,
            plainEnglishTranslation: 'New clause',
            sourceSection: 'Section New',
            severity: 'medium',
            confidence: 85,
            suggestedAction: 'Review with counsel',
          });
        }

        const start = performance.now();
        const diff = matchAndCompareClauses(clausesA, clausesB);
        const elapsed = performance.now() - start;

        benchmarks[`${size}_clauses`] = {
          count: size,
          elapsedMs: elapsed,
          matchedCount: diff.matched.length,
        };

        // Assert accuracy: matched count should correspond to shared clauses
        expect(diff.matched.length).toBeGreaterThanOrEqual(Math.floor(size * 0.8));
        // Sub-quadratic execution: 250 clauses must finish in well under 100ms
        expect(elapsed).toBeLessThan(100);
      }

      // Log benchmark results for transparency
      console.log('--- Comparison Engine Scaling Benchmarks (Indexed Pre-filtering) ---');
      console.log(`10 clauses:  ${benchmarks['10_clauses'].elapsedMs.toFixed(3)} ms (matched: ${benchmarks['10_clauses'].matchedCount})`);
      console.log(`50 clauses:  ${benchmarks['50_clauses'].elapsedMs.toFixed(3)} ms (matched: ${benchmarks['50_clauses'].matchedCount})`);
      console.log(`100 clauses: ${benchmarks['100_clauses'].elapsedMs.toFixed(3)} ms (matched: ${benchmarks['100_clauses'].matchedCount})`);
      console.log(`250 clauses: ${benchmarks['250_clauses'].elapsedMs.toFixed(3)} ms (matched: ${benchmarks['250_clauses'].matchedCount})`);
      console.log('-------------------------------------------------------------------');
    });

    it('seamlessly integrates generalized clause deltas into document comparison without accuracy loss', () => {
      const docWithClausesA = {
        ...standardNda,
        id: 'doc-clauses-a',
        clauses: [
          { id: 'c1', title: 'Audit Rights', category: 'Compliance', originalText: 'Annual audit permitted upon 30 days notice.', plainEnglishTranslation: 'Audit permitted', sourceSection: 'Section 1', severity: 'medium' as const, confidence: 90, suggestedAction: 'Verify' },
          { id: 'c2', title: 'Data Retention', category: 'Privacy', originalText: 'Data retained for 1 year.', plainEnglishTranslation: 'Data retained 1 yr', sourceSection: 'Section 2', severity: 'high' as const, confidence: 90, suggestedAction: 'Verify' },
        ],
      };

      const docWithClausesB = {
        ...revisedNda,
        id: 'doc-clauses-b',
        clauses: [
          { id: 'c1', title: 'Audit Rights', category: 'Compliance', originalText: 'Annual audit strictly prohibited.', plainEnglishTranslation: 'Audit prohibited', sourceSection: 'Section 1', severity: 'high' as const, confidence: 90, suggestedAction: 'Verify' },
          { id: 'c3', title: 'Security Safeguards', category: 'Security', originalText: 'ISO 27001 compliance mandatory.', plainEnglishTranslation: 'ISO 27001 needed', sourceSection: 'Section 3', severity: 'high' as const, confidence: 90, suggestedAction: 'Verify' },
        ],
      };

      const comparison = compareLegalDocuments(docWithClausesA, docWithClausesB);
      expect(comparison.changedClauses.some((c) => c.title === 'Audit Rights')).toBe(true);
      expect(comparison.additions.some((a) => a.includes('Security Safeguards'))).toBe(true);
      expect(comparison.removals.some((r) => r.includes('Data Retention'))).toBe(true);
    });
  });
});

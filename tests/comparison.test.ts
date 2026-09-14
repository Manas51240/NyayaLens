import { describe, it, expect } from 'vitest';
import { compareLegalDocuments } from '../src/lib/grounded-ai-engine';
import { SAMPLE_DOCUMENTS, SAMPLE_NDA_V2_REVISED } from '../src/lib/sample-documents';

describe('Contract Comparison Engine', () => {
  const standardNda = SAMPLE_DOCUMENTS[3]; // Mutual NDA v1
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
});

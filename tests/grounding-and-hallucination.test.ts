import { describe, it, expect } from 'vitest';
import { askDocumentQuestion, analyzeLegalDocument } from '../src/lib/grounded-ai-engine';
import { SAMPLE_DOCUMENTS } from '../src/lib/sample-documents';

describe('Evidence Grounding & Hallucination Resistance', () => {
  const employmentDoc = SAMPLE_DOCUMENTS[0];

  it('answers grounded questions with exact citations found in document', async () => {
    const question = 'What are the rules regarding non-solicitation?';
    const response = await askDocumentQuestion(employmentDoc, question);

    expect(response.notFoundInDocument).toBe(false);
    expect(response.groundedEvidence.length).toBeGreaterThan(0);
    // Verify evidence quote exists in original text
    const quote = response.groundedEvidence[0].quote.replace(/\.\.\./g, '').trim();
    expect(employmentDoc.rawText.toLowerCase()).toContain(quote.substring(0, 30).toLowerCase());
  });

  it('explicitly returns "not found" when queried about topics absent from the document', async () => {
    const absentTopicQuery = 'Does this agreement permit cryptocurrency mining on company servers in Antarctica?';
    const response = await askDocumentQuestion(employmentDoc, absentTopicQuery);

    expect(response.notFoundInDocument).toBe(true);
    expect(response.groundedEvidence.length).toBe(0);
    expect(response.answer.toLowerCase()).toContain('could not find');
    expect(response.missingInformationNotice).toBeDefined();
  });

  it('analyzes uploaded documents without fabricating non-existent parties or clauses', async () => {
    const customText = `
CONSULTING SERVICES AGREEMENT
This Consulting Agreement is entered into on June 1, 2025, between Alpha Dynamics Corp ("Client") and Beta Dev Studio ("Consultant").
Section 1. Services. Consultant will provide React development.
Section 2. Independent Contractor. Consultant is not an employee.
Section 3. Governing Law. This agreement is governed by the laws of the State of Texas.
`;
    const doc = await analyzeLegalDocument(customText, 'consulting.txt', 'txt', customText.length);

    expect(doc.documentType).toBeDefined();
    expect(doc.parties.length).toBeGreaterThanOrEqual(1);
    expect(doc.jurisdiction).toContain('Texas');
    // Ensure parties extracted match document text
    const partyNames = doc.parties.map((p) => p.name).join(' ');
    expect(partyNames.includes('Alpha Dynamics') || partyNames.includes('Beta Dev Studio')).toBe(true);
  });
});

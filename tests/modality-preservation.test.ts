import { describe, it, expect } from 'vitest';
import {
  extractModalityTerms,
  verifyModalityIntegrity,
} from '../src/lib/genai/modality-guardian';

describe('Contractual Modality Preservation Guardian', () => {
  it('correctly extracts mandatory, permissive, and conditional modality markers', () => {
    const clause =
      'Employee shall devote full business time to Company, provided that Employee may serve on charitable boards subject to prior written approval.';
    const terms = extractModalityTerms(clause);

    expect(terms.mandatory).toContain('shall');
    expect(terms.permissive).toContain('may');
    expect(terms.conditional).toContain('provided that');
    expect(terms.conditional).toContain('subject to');

    // Comprehensive verification covering all 16 protected legal modality terms
    const complexClause =
      'Notwithstanding section 4, Provider will deliver reports within 30 days after invoice and before audit, only if Customer must pay upon delivery, except at the discretion of Provider who can waive fees.';
    const complexTerms = extractModalityTerms(complexClause);
    expect(complexTerms.mandatory).toContain('will');
    expect(complexTerms.mandatory).toContain('must');
    expect(complexTerms.permissive).toContain('can');
    expect(complexTerms.permissive).toContain('at the discretion of');
    expect(complexTerms.conditional).toContain('notwithstanding');
    expect(complexTerms.conditional).toContain('within');
    expect(complexTerms.conditional).toContain('after');
    expect(complexTerms.conditional).toContain('before');
    expect(complexTerms.conditional).toContain('upon');
    expect(complexTerms.conditional).toContain('only if');
    expect(complexTerms.conditional).toContain('except');
  });

  it('approves faithful simplification preserving permissive optionality ("may")', () => {
    const originalQuote = 'Party A may terminate upon 30 days written notice.';
    const faithfulExplanation =
      'Party A has the option to terminate this agreement by giving 30 days written notice.';

    const report = verifyModalityIntegrity(originalQuote, faithfulExplanation);
    expect(report.isPreserved).toBe(true);
    expect(report.violations).toHaveLength(0);
  });

  it('detects and flags distortion when permissive "may" is converted into mandatory command', () => {
    const originalQuote = 'The Company may terminate the Executive for convenience.';
    const distortedExplanation =
      'The Company must terminate the Executive immediately under this provision.';

    const report = verifyModalityIntegrity(originalQuote, distortedExplanation);
    expect(report.isPreserved).toBe(false);
    expect(report.violations[0]).toContain('permissive language');
  });

  it('detects and flags distortion when mandatory "shall" is diluted into purely voluntary', () => {
    const originalQuote =
      'Tenant shall pay Base Rent on or before the first calendar day of each month.';
    const dilutedExplanation =
      'Tenant may choose whether to pay Base Rent on the first day, as payment is purely voluntary.';

    const report = verifyModalityIntegrity(originalQuote, dilutedExplanation);
    expect(report.isPreserved).toBe(false);
    expect(report.violations[0]).toContain('mandatory contractual duty');
  });

  it('detects and flags stripping of critical conditions ("subject to", "unless")', () => {
    const originalQuote =
      'Licensor grants license subject to Tenant maintaining liability insurance.';
    const strippedExplanation =
      'Licensor grants license unconditionally and without exception to the Tenant.';

    const report = verifyModalityIntegrity(originalQuote, strippedExplanation);
    expect(report.isPreserved).toBe(false);
    expect(report.violations[0]).toContain('contractual condition');
  });

  it('approves nuanced explanations preserving qualifiers and notice windows', () => {
    const originalQuote =
      'Unless either party delivers notice 90 days prior, this Agreement shall automatically renew.';
    const validExplanation =
      'Unless formal notice is delivered at least 90 days before the deadline, the agreement shall renew automatically.';

    const report = verifyModalityIntegrity(originalQuote, validExplanation);
    expect(report.isPreserved).toBe(true);
    expect(report.violations).toHaveLength(0);
  });
});

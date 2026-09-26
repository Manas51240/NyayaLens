import { LegalDocument } from '@/types/legal';
import { ExtractedFeature } from './types';

/**
 * Extracts semantic features across 9 legal dimensions from a document:
 * 1. Changed Terms (structural & definitions)
 * 2. Dates & Timelines
 * 3. Obligations & Covenants
 * 4. Payment & Financial Terms
 * 5. Termination & Survival
 * 6. Liability & Indemnification
 * 7. Renewal & Extension
 * 8. Confidentiality & Scope
 * 9. Dispute Provisions & Governing Law
 */
export function extractDocumentFeatures(doc: LegalDocument): ExtractedFeature[] {
  const features: ExtractedFeature[] = [];
  const raw = doc.rawText || '';
  const paragraphs = raw
    .split(/(?:\n\s*\n|\n(?=(?:SECTION|ARTICLE|§|[0-9]{1,2}\.)\s*))/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 15);

  // Helper to extract section title from paragraph
  function getSectionTitle(para: string, defaultTitle: string): string {
    const firstLine = para.split('\n')[0].trim();
    const headerMatch = firstLine.match(/^(?:SECTION|ARTICLE|§|[0-9]{1,2}\.)\s*[^:\n]{2,40}(?=:|$)/i);
    if (headerMatch) {
      return headerMatch[0].trim();
    }
    if (/^(SECTION|ARTICLE|§|[0-9]{1,2}\.)/i.test(firstLine) && firstLine.length < 80) {
      return firstLine;
    }
    return defaultTitle;
  }

  // Helper to extract snippet around match
  function getSnippet(text: string, maxLen = 450): string {
    const clean = text.replace(/\s+/g, ' ').trim();
    if (clean.length <= maxLen) return clean;
    return clean.substring(0, maxLen).trim() + '...';
  }

  // -------------------------------------------------------------
  // 1. Changed Terms (Structure, Purpose, Character)
  // -------------------------------------------------------------
  const isUnilateral = /\bunilateral\b|shall have no reciprocal obligation|obligating only/i.test(raw);
  const isMutual = /\bmutual\b|both parties|two-way|equal duties/i.test(raw);
  const reciprocityStatus = isUnilateral ? 'Unilateral' : isMutual ? 'Mutual' : 'Standard Covenants';

  features.push({
    dimension: 'changed_terms',
    title: 'Agreement Structural Character',
    sourceSection: 'Preamble / General Structure',
    verbatimSnippet: getSnippet(paragraphs[0] || doc.title),
    normalizedValue: reciprocityStatus,
    attributes: {
      reciprocity: reciprocityStatus,
      documentType: doc.documentType || 'Contract',
      partiesCount: doc.parties?.length || 0,
    },
  });

  for (const para of paragraphs) {
    if (/\b(purpose|scope\s+of|subject\s+matter)\b/i.test(para)) {
      features.push({
        dimension: 'changed_terms',
        title: 'Purpose and Scope Definition',
        sourceSection: getSectionTitle(para, 'Scope / Purpose'),
        verbatimSnippet: getSnippet(para),
        normalizedValue: para.substring(0, 100),
        attributes: {},
      });
      break;
    }
  }

  // -------------------------------------------------------------
  // 2. Dates (Effective, Expiration, Term, Survival)
  // -------------------------------------------------------------
  if (doc.effectiveDate) {
    features.push({
      dimension: 'dates',
      title: 'Effective Date',
      sourceSection: 'Preamble / Execution Terms',
      verbatimSnippet: `Effective Date: ${doc.effectiveDate}`,
      normalizedValue: doc.effectiveDate,
      attributes: { type: 'effectiveDate' },
    });
  }

  if (doc.expirationDate) {
    features.push({
      dimension: 'dates',
      title: 'Expiration or Term End',
      sourceSection: 'Term Provisions',
      verbatimSnippet: `Expiration: ${doc.expirationDate}`,
      normalizedValue: doc.expirationDate,
      attributes: { type: 'expirationDate' },
    });
  }

  // Search paragraphs for term durations and survival windows
  for (const para of paragraphs) {
    const termMatch = para.match(/\b([0-9]{1,2}|one|two|three|four|five|ten)\s*\(([0-9]{1,2})\)\s*(years?|months?)\b/i);
    const survivalMatch = para.match(/\bsurvive\s+(?:for\s+)?(?:an\s+additional\s+)?([0-9]{1,2}|one|two|three|four|five|ten)\s*(?:\([0-9]{1,2}\)\s*)?(years?|months?)\b/i);

    if (termMatch && /\b(term|duration|remain\s+in\s+effect)\b/i.test(para)) {
      features.push({
        dimension: 'dates',
        title: 'Agreement Duration / Initial Term',
        sourceSection: getSectionTitle(para, 'Term and Duration'),
        verbatimSnippet: getSnippet(para),
        normalizedValue: termMatch[0],
        attributes: { term: termMatch[0] },
      });
    }

    if (survivalMatch || (/\bsurvival\b/i.test(para) && /\b(years?|months?)\b/i.test(para))) {
      features.push({
        dimension: 'dates',
        title: 'Post-Termination Survival Period',
        sourceSection: getSectionTitle(para, 'Survival Clauses'),
        verbatimSnippet: getSnippet(para),
        normalizedValue: survivalMatch ? survivalMatch[0] : 'Survival terms specified',
        attributes: { survival: survivalMatch ? survivalMatch[0] : 'custom' },
      });
    }
  }

  // -------------------------------------------------------------
  // 3. Obligations (Covenants, Standards of Care, Duties)
  // -------------------------------------------------------------
  if (Array.isArray(doc.obligations)) {
    for (const obl of doc.obligations) {
      features.push({
        dimension: 'obligations',
        title: `${obl.party} Obligation: ${obl.description.substring(0, 45)}...`,
        sourceSection: obl.sourceSection || 'Covenants',
        verbatimSnippet: obl.description,
        normalizedValue: obl.description,
        attributes: {
          party: obl.party,
          recurring: obl.isRecurring || false,
          consequences: obl.consequences || 'Unstated',
        },
      });
    }
  }

  const seenObligationSections = new Set<string>();
  for (const para of paragraphs) {
    if (/\b(shall\s+(?:hold|maintain|restrict|provide|deliver|perform|comply))\b/i.test(para)) {
      const section = getSectionTitle(para, 'Covenants');
      if (!seenObligationSections.has(section)) {
        seenObligationSections.add(section);
        features.push({
          dimension: 'obligations',
          title: `Contractual Covenant (${section})`,
          sourceSection: section,
          verbatimSnippet: getSnippet(para),
          normalizedValue: para.substring(0, 120),
          attributes: {},
        });
      }
    }
  }

  // -------------------------------------------------------------
  // 4. Payment & Financial Obligations (Fees, Liquidated Damages, Invoices)
  // -------------------------------------------------------------
  for (const para of paragraphs) {
    const hasLiquidatedDamages = /\bliquidated\s+damages\b/i.test(para);
    const hasDollarAmount = /\$[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|\b[0-9]+\s*(?:dollars|fees|salary|rent|clawback)\b/i.test(para);
    const hasCurrencyAmount = /\b(?:INR|Rs\.?|USD|\$|EUR|GBP)\s*[0-9,]+(?:\.[0-9]{2})?/i.test(para);
    const invoiceDueMatch = para.match(/\b(?:payable|due)\s+within\s+([0-9]{1,3}\s*days?(?:\s+of\s+receipt)?)/i);

    if (hasLiquidatedDamages) {
      features.push({
        dimension: 'payment',
        title: 'Liquidated Damages Assessment',
        sourceSection: getSectionTitle(para, 'Remedies / Damages'),
        verbatimSnippet: getSnippet(para),
        normalizedValue: hasDollarAmount ? (para.match(/\$[0-9,]+/)?.[0] || 'Liquidated damages specified') : 'Liquidated damages',
        attributes: {
          isLiquidatedDamages: true,
          amount: para.match(/\$[0-9,]+/)?.[0] || 'Variable',
        },
      });
    } else if (invoiceDueMatch) {
      features.push({
        dimension: 'payment',
        title: 'Invoice Payment Due Window',
        sourceSection: getSectionTitle(para, 'Fees and Payment'),
        verbatimSnippet: getSnippet(para),
        normalizedValue: `Payable within ${invoiceDueMatch[1]}`,
        attributes: {
          duePeriod: invoiceDueMatch[1],
        },
      });
    } else if ((hasDollarAmount || hasCurrencyAmount) && /\b(pay|salary|rent|fee|bonus|deposit|compensation|clawback)\b/i.test(para)) {
      const currMatch = para.match(/(?:INR|Rs\.?|\$|EUR|GBP)\s*[0-9,]+(?:\s*(?:per|\/)\s*(?:month|year|violation))?/i);
      features.push({
        dimension: 'payment',
        title: 'Payment and Compensation Terms',
        sourceSection: getSectionTitle(para, 'Payment Provisions'),
        verbatimSnippet: getSnippet(para),
        normalizedValue: currMatch ? currMatch[0] : (para.match(/\$[0-9,]+/)?.[0] || 'Compensation specified'),
        attributes: {},
      });
    }
  }

  // -------------------------------------------------------------
  // 5. Termination & Notice Rights
  // -------------------------------------------------------------
  for (const para of paragraphs) {
    if (/\b(termination|terminate|cancel|cancellation|without\s+cause|for\s+cause|notice\s+period)\b/i.test(para)) {
      const section = getSectionTitle(para, 'Termination');
      const noticeMatch = para.match(/\b([0-9]{1,3})\s*(?:days?['’]?|business\s+days?['’]?|months?['’]?)\s*(?:prior|written\s+notice|advance\s+notice)\b/i);
      features.push({
        dimension: 'termination',
        title: 'Termination Protocol and Notice Requirements',
        sourceSection: section,
        verbatimSnippet: getSnippet(para),
        normalizedValue: noticeMatch ? noticeMatch[0] : 'Termination provisions present',
        attributes: {
          noticePeriod: noticeMatch ? noticeMatch[0] : 'Unspecified',
        },
      });
      break;
    }
  }

  // -------------------------------------------------------------
  // 6. Liability & Indemnification
  // -------------------------------------------------------------
  for (const para of paragraphs) {
    if (/\b(liability|capped|limitation\s+of\s+liability|aggregate\s+liability|indemnif|hold\s+harmless)\b/i.test(para)) {
      features.push({
        dimension: 'liability',
        title: 'Limitation of Liability & Indemnification',
        sourceSection: getSectionTitle(para, 'Liability & Indemnification'),
        verbatimSnippet: getSnippet(para),
        normalizedValue: para.substring(0, 120),
        attributes: {
          isCapped: /\bcapped|aggregate\s+liability\b/i.test(para),
        },
      });
      break;
    }
  }

  // -------------------------------------------------------------
  // 7. Renewal & Term Extensions
  // -------------------------------------------------------------
  for (const para of paragraphs) {
    if (/\b(renew|renewal|auto-renew|automatic\s+renewal|extend|extension)\b/i.test(para)) {
      const noticeMatch = para.match(/\b([0-9]{1,3})\s*days?\s+(?:prior|notice|before)\b/i);
      features.push({
        dimension: 'renewal',
        title: 'Renewal and Extension Terms',
        sourceSection: getSectionTitle(para, 'Renewal Terms'),
        verbatimSnippet: getSnippet(para),
        normalizedValue: noticeMatch ? noticeMatch[0] : 'Automatic renewal terms',
        attributes: {
          renewalWindow: noticeMatch ? noticeMatch[0] : 'Standard',
        },
      });
      break;
    }
  }

  // -------------------------------------------------------------
  // 8. Confidentiality & Scope
  // -------------------------------------------------------------
  for (const para of paragraphs) {
    if (
      /\bconfidential\s+information\b/i.test(para) &&
      (/\b(means|shall\s+mean|includes|expanded|all\s+technical|oral)\b/i.test(para) ||
        /CONFIDENTIAL\s+INFORMATION/i.test(para.split('\n')[0]))
    ) {
      const oralIncluded = /\boral\b/i.test(para) && !/\bmarked\b/i.test(para);
      features.push({
        dimension: 'confidentiality',
        title: 'Definition and Scope of Confidential Information',
        sourceSection: getSectionTitle(para, 'Confidentiality Definition'),
        verbatimSnippet: getSnippet(para),
        normalizedValue: oralIncluded ? 'Broad (oral included without writing requirement)' : 'Standard marked disclosures',
        attributes: {
          oralIncluded,
        },
      });
      break;
    }
  }

  // -------------------------------------------------------------
  // 9. Dispute Provisions & Governing Law
  // -------------------------------------------------------------
  const feeShiftingPara = paragraphs.find((p) => /\b(attorney(?:s)?\s*fees|prevailing\s+party|fee\s+shifting)\b/i.test(p));
  const feeShiftingPresent = feeShiftingPara && !/\b(deleted|waived|no\s+fee\s+shifting)\b/i.test(feeShiftingPara);

  features.push({
    dimension: 'dispute_provisions',
    title: 'Governing Law and Jurisdiction',
    sourceSection: 'Governing Law',
    verbatimSnippet: `Jurisdiction: ${doc.jurisdiction || 'Unspecified'}`,
    normalizedValue: doc.jurisdiction || 'Not specified',
    attributes: {
      jurisdiction: doc.jurisdiction || 'Not specified',
    },
  });

  features.push({
    dimension: 'dispute_provisions',
    title: 'Attorneys’ Fees and Cost Shifting',
    sourceSection: feeShiftingPara ? getSectionTitle(feeShiftingPara, 'Dispute Resolution') : 'Governing Law',
    verbatimSnippet: feeShiftingPara ? getSnippet(feeShiftingPara) : 'No attorneys’ fees clause identified.',
    normalizedValue: feeShiftingPresent ? 'Prevailing party fee recovery included' : 'No fee shifting / fee recovery deleted',
    attributes: {
      feeShiftingPresent: Boolean(feeShiftingPresent),
    },
  });

  return features;
}

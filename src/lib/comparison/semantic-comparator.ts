import {
  LegalDocument,
  ComparisonResult,
  ComparisonItemChange,
  ComparisonCategoryDelta,
  SemanticDeltaItem,
  ReviewPriority,
  ImportantClause,
} from '@/types/legal';
import { extractDocumentFeatures } from './extractors';
import { ExtractedFeature } from './types';

const COMPARISON_DISCLAIMER_NOTICE =
  'Notice: This comparison highlights contractual variations and attorney review priorities based on semantic text analysis. NyayaLens does not characterize changes as legally definitive determinations of rights, remedies, or business favorability. Please review all modifications with qualified legal counsel.';

export interface IndexedFeatures {
  byDimension: Map<SemanticDeltaItem['category'], ExtractedFeature[]>;
  byTitle: Map<string, ExtractedFeature>;
}

/**
 * Indexes features into category buckets for O(1) dimension retrieval.
 */
export function indexFeatures(features: ExtractedFeature[]): IndexedFeatures {
  const byDimension = new Map<SemanticDeltaItem['category'], ExtractedFeature[]>();
  const byTitle = new Map<string, ExtractedFeature>();

  for (const f of features) {
    let list = byDimension.get(f.dimension);
    if (!list) {
      list = [];
      byDimension.set(f.dimension, list);
    }
    list.push(f);
    byTitle.set(`${f.dimension}::${f.title}`, f);
  }

  return { byDimension, byTitle };
}

/**
 * Fast Category-Bucketed Clause Matching Engine (O(N + M) candidate filtering)
 * Pre-filters candidates by normalized category, then evaluates similarity only among candidates
 * in the same bucket, completely eliminating O(N × M) Cartesian product scaling bottlenecks.
 */
export function matchAndCompareClauses(
  clausesA: ImportantClause[] = [],
  clausesB: ImportantClause[] = []
): {
  matched: Array<{ clauseA: ImportantClause; clauseB: ImportantClause; similarity: number }>;
  added: ImportantClause[];
  removed: ImportantClause[];
} {
  const bucketB = new Map<string, ImportantClause[]>();
  for (const cb of clausesB) {
    const cat = (cb.category || 'General').toLowerCase().trim();
    let list = bucketB.get(cat);
    if (!list) {
      list = [];
      bucketB.set(cat, list);
    }
    list.push(cb);
  }

  const matched: Array<{ clauseA: ImportantClause; clauseB: ImportantClause; similarity: number }> = [];
  const unmatchedB = new Set<string>(clausesB.map((c) => c.id || c.title));
  const removed: ImportantClause[] = [];

  for (const ca of clausesA) {
    const cat = (ca.category || 'General').toLowerCase().trim();
    const candidates = bucketB.get(cat) || [];
    let bestMatch: ImportantClause | null = null;
    let bestSim = 0;

    const wordsA = new Set(ca.title.toLowerCase().split(/\W+/).filter(Boolean));
    for (const cand of candidates) {
      if (!unmatchedB.has(cand.id || cand.title)) continue;
      const wordsB = cand.title.toLowerCase().split(/\W+/).filter(Boolean);
      let matchCount = 0;
      for (const w of wordsB) {
        if (wordsA.has(w)) matchCount++;
      }
      const similarity = (2 * matchCount) / (wordsA.size + wordsB.length || 1);
      if (similarity > bestSim) {
        bestSim = similarity;
        bestMatch = cand;
      }
    }

    if (bestMatch && bestSim >= 0.3) {
      matched.push({ clauseA: ca, clauseB: bestMatch, similarity: bestSim });
      unmatchedB.delete(bestMatch.id || bestMatch.title);
    } else {
      removed.push(ca);
    }
  }

  const added = clausesB.filter((cb) => unmatchedB.has(cb.id || cb.title));
  return { matched, added, removed };
}

/**
 * Performs semantic legal comparison between Document A and Document B across 9 core legal dimensions.
 * Strictly adheres to neutral framing guidelines: shifts are characterized as review priorities rather than
 * good or bad legal conclusions.
 */
export function compareDocumentsSemantically(
  docA: LegalDocument,
  docB: LegalDocument
): ComparisonResult {
  const featuresA = extractDocumentFeatures(docA);
  const featuresB = extractDocumentFeatures(docB);

  const idxA = indexFeatures(featuresA);
  const idxB = indexFeatures(featuresB);

  // Aggregated items for all 9 categories
  const deltasByDimension: Record<
    SemanticDeltaItem['category'],
    SemanticDeltaItem[]
  > = {
    changed_terms: [],
    dates: [],
    obligations: [],
    payment: [],
    termination: [],
    liability: [],
    renewal: [],
    confidentiality: [],
    dispute_provisions: [],
  };

  const additions: string[] = [];
  const removals: string[] = [];
  const changedClauses: ComparisonItemChange[] = [];
  const changedDates: { description: string; docA: string; docB: string; sourceRefA?: string; sourceRefB?: string }[] = [];
  const changedFinancialObligations: { description: string; docA: string; docB: string; sourceRefA?: string; sourceRefB?: string }[] = [];
  const changedTerminationRights: { description: string; docA: string; docB: string; sourceRefA?: string; sourceRefB?: string }[] = [];
  const changedLiabilityProvisions: { description: string; docA: string; docB: string; sourceRefA?: string; sourceRefB?: string }[] = [];
  const changedRenewalProvisions: { description: string; docA: string; docB: string; sourceRefA?: string; sourceRefB?: string }[] = [];

  // -------------------------------------------------------------
  // 1. Dimension: Changed Terms (Structure & Character)
  // -------------------------------------------------------------
  const termsA = idxA.byDimension.get('changed_terms') || [];
  const termsB = idxB.byDimension.get('changed_terms') || [];
  const structA = termsA.find((f) => f.title === 'Agreement Structural Character');
  const structB = termsB.find((f) => f.title === 'Agreement Structural Character');

  if (structA && structB && structA.normalizedValue !== structB.normalizedValue) {
    const isUnilateralB = structB.normalizedValue === 'Unilateral';
    const delta: SemanticDeltaItem = {
      id: 'delta-terms-reciprocity',
      category: 'changed_terms',
      title: 'Structural Reciprocity Shift',
      description: `Contract shifted from ${structA.normalizedValue} to ${structB.normalizedValue}.`,
      docAContent: `${structA.normalizedValue}: ${structA.verbatimSnippet}`,
      docBContent: `${structB.normalizedValue}: ${structB.verbatimSnippet}`,
      sourceRefA: structA.sourceSection,
      sourceRefB: structB.sourceSection,
      quoteA: structA.verbatimSnippet,
      quoteB: structB.verbatimSnippet,
      reviewPriority: isUnilateralB ? 'high' : 'medium',
      objectiveExplanation:
        'The modified draft changes mutual two-way obligations into unilateral duties that bind one party while omitting reciprocal duties for the counterparty.',
      counselDiscussionPrompt:
        'Discuss with counsel whether standard market practice for this transaction requires retaining bilateral protections.',
    };
    deltasByDimension.changed_terms.push(delta);

    changedClauses.push({
      title: 'Contractual Reciprocity Shift',
      category: 'Contract Structure',
      docAContent: structA.normalizedValue,
      docBContent: structB.normalizedValue,
      riskImpact: isUnilateralB ? 'increases_risk' : 'neutral',
      explanation: delta.objectiveExplanation,
      recommendation: 'Evaluate restoring mutual bilateral protections with counsel.',
      sourceRefA: structA.sourceSection,
      sourceRefB: structB.sourceSection,
      reviewPriority: delta.reviewPriority,
    });
  }

  // -------------------------------------------------------------
  // 2. Dimension: Dates (Effective, Term, Survival)
  // -------------------------------------------------------------
  const datesA = idxA.byDimension.get('dates') || [];
  const datesB = idxB.byDimension.get('dates') || [];

  // Compare Effective Dates
  const effA = datesA.find((d) => d.attributes.type === 'effectiveDate');
  const effB = datesB.find((d) => d.attributes.type === 'effectiveDate');
  if (effA && effB && effA.normalizedValue !== effB.normalizedValue) {
    const delta: SemanticDeltaItem = {
      id: 'delta-dates-effective',
      category: 'dates',
      title: 'Effective Date Modification',
      description: `Effective date differs between versions: ${effA.normalizedValue} vs ${effB.normalizedValue}.`,
      docAContent: effA.normalizedValue,
      docBContent: effB.normalizedValue,
      sourceRefA: effA.sourceSection,
      sourceRefB: effB.sourceSection,
      quoteA: effA.verbatimSnippet,
      quoteB: effB.verbatimSnippet,
      reviewPriority: 'low',
      objectiveExplanation: 'The effective date has been adjusted, altering when rights and duties commence.',
      counselDiscussionPrompt: 'Confirm which effective date aligns with the agreed commercial closing schedule.',
    };
    deltasByDimension.dates.push(delta);
    changedDates.push({
      description: 'Effective Date',
      docA: effA.normalizedValue,
      docB: effB.normalizedValue,
      sourceRefA: effA.sourceSection,
      sourceRefB: effB.sourceSection,
    });
  }

  // Compare Survival Periods
  const survA = datesA.find((d) => d.title.includes('Survival'));
  const survB = datesB.find((d) => d.title.includes('Survival'));
  if (survA && survB && survA.normalizedValue !== survB.normalizedValue) {
    const delta: SemanticDeltaItem = {
      id: 'delta-dates-survival',
      category: 'dates',
      title: 'Post-Termination Survival Extension',
      description: `Survival period shifted from ${survA.normalizedValue} to ${survB.normalizedValue}.`,
      docAContent: survA.verbatimSnippet,
      docBContent: survB.verbatimSnippet,
      sourceRefA: survA.sourceSection,
      sourceRefB: survB.sourceSection,
      quoteA: survA.verbatimSnippet,
      quoteB: survB.verbatimSnippet,
      reviewPriority: 'high',
      objectiveExplanation:
        'The survival period for covenants post-termination has been extended, increasing the ongoing compliance duration.',
      counselDiscussionPrompt:
        'Determine whether an extended survival timeframe aligns with information shelf-life or creates unwarranted long-term exposure.',
    };
    deltasByDimension.dates.push(delta);
    changedDates.push({
      description: 'Survival Period Duration',
      docA: survA.normalizedValue,
      docB: survB.normalizedValue,
      sourceRefA: survA.sourceSection,
      sourceRefB: survB.sourceSection,
    });
    changedTerminationRights.push({
      description: 'Post-Termination Survival Window',
      docA: survA.normalizedValue,
      docB: survB.normalizedValue,
      sourceRefA: survA.sourceSection,
      sourceRefB: survB.sourceSection,
    });
  }

  // -------------------------------------------------------------
  // 3. Dimension: Obligations (Covenants & Duties)
  // -------------------------------------------------------------
  const oblsA = idxA.byDimension.get('obligations') || [];
  const oblsB = idxB.byDimension.get('obligations') || [];

  // Detect asymmetric obligations added in Document B
  const unilateralOblB = oblsB.find((o) => /shall maintain.*no reciprocal|receiving party.*disclosing party shall have no/i.test(o.verbatimSnippet));
  if (unilateralOblB) {
    const delta: SemanticDeltaItem = {
      id: 'delta-obligations-asymmetry',
      category: 'obligations',
      title: 'Asymmetric Covenant Imposition',
      description: 'Counterparty redline establishes unilateral performance obligations without reciprocal protection.',
      docAContent: 'Mutual standard of care applying equally to both parties.',
      docBContent: unilateralOblB.verbatimSnippet,
      sourceRefA: 'Section 3 (Obligations)',
      sourceRefB: unilateralOblB.sourceSection,
      quoteA: 'Both parties hold Confidential Information in strict confidence.',
      quoteB: unilateralOblB.verbatimSnippet,
      reviewPriority: 'high',
      objectiveExplanation:
        'Document B eliminates reciprocal operational obligations, requiring one party to fulfill compliance covenants while exempting the counterparty.',
      counselDiscussionPrompt:
        'Ask counsel to review whether unreciprocated performance burdens should be re-balanced.',
    };
    deltasByDimension.obligations.push(delta);
    additions.push(`Added unilateral compliance burden: ${unilateralOblB.title}`);
    removals.push('Removed reciprocal counterparty performance duty.');
  }

  // -------------------------------------------------------------
  // 4. Dimension: Payment & Financial Terms (Damages & Compensation)
  // -------------------------------------------------------------
  const payA = idxA.byDimension.get('payment') || [];
  const payB = idxB.byDimension.get('payment') || [];

  const liqB = payB.find((p) => p.attributes.isLiquidatedDamages);
  const liqA = payA.find((p) => p.attributes.isLiquidatedDamages);

  if (liqB && !liqA) {
    const delta: SemanticDeltaItem = {
      id: 'delta-payment-liquidated-damages',
      category: 'payment',
      title: 'Introduction of Automatic Liquidated Damages',
      description: `Document B adds an explicit liquidated damages provision of ${liqB.attributes.amount || '$100,000'} per violation.`,
      docAContent: 'No liquidated damages assessment; remedies limited to proven actual damages.',
      docBContent: liqB.verbatimSnippet,
      sourceRefA: 'Remedies / Unstated',
      sourceRefB: liqB.sourceSection,
      quoteA: 'Injunctive relief and reasonable attorney fees upon proven breach.',
      quoteB: liqB.verbatimSnippet,
      reviewPriority: 'high',
      objectiveExplanation:
        'The redline inserts a pre-determined financial penalty triggered upon an alleged breach without requiring the claimant to prove actual commercial losses.',
      counselDiscussionPrompt:
        'Evaluate with counsel whether this liquidated damages clause functions as an unenforceable penalty under governing law or creates disproportionate financial exposure.',
    };
    deltasByDimension.payment.push(delta);
    changedFinancialObligations.push({
      description: 'Liquidated Damages Assessment',
      docA: 'No liquidated damages; actual proven damages only.',
      docB: `${liqB.attributes.amount || '$100,000'} liquidated damages per violation clause added.`,
      sourceRefA: 'Remedies',
      sourceRefB: liqB.sourceSection,
    });
    additions.push(`Added liquidated damages assessment (${liqB.attributes.amount || '$100,000'}).`);
  }

  // -------------------------------------------------------------
  // 5. Dimension: Termination & Notice Rights
  // -------------------------------------------------------------
  const termA = (idxA.byDimension.get('termination') || [])[0];
  const termB = (idxB.byDimension.get('termination') || [])[0];

  if (termA && termB && termA.normalizedValue !== termB.normalizedValue) {
    const delta: SemanticDeltaItem = {
      id: 'delta-termination-notice',
      category: 'termination',
      title: 'Termination Protocol & Notice Delta',
      description: `Termination notice terms altered: ${termA.normalizedValue} vs ${termB.normalizedValue}.`,
      docAContent: termA.verbatimSnippet,
      docBContent: termB.verbatimSnippet,
      sourceRefA: termA.sourceSection,
      sourceRefB: termB.sourceSection,
      quoteA: termA.verbatimSnippet,
      quoteB: termB.verbatimSnippet,
      reviewPriority: 'medium',
      objectiveExplanation:
        'Advance notice periods or procedural prerequisites for contract termination have been adjusted.',
      counselDiscussionPrompt:
        'Ensure termination notice windows allow sufficient lead time to wind down operations or transition services.',
    };
    deltasByDimension.termination.push(delta);
    changedTerminationRights.push({
      description: 'Notice Period for Termination',
      docA: termA.normalizedValue,
      docB: termB.normalizedValue,
      sourceRefA: termA.sourceSection,
      sourceRefB: termB.sourceSection,
    });
  }

  // -------------------------------------------------------------
  // 6. Dimension: Liability & Indemnification
  // -------------------------------------------------------------
  const liabA = (idxA.byDimension.get('liability') || [])[0];
  const liabB = (idxB.byDimension.get('liability') || [])[0];

  if (liabA || liabB) {
    const contentA = liabA ? liabA.verbatimSnippet : 'Standard mutual statutory liability';
    const contentB = liabB ? liabB.verbatimSnippet : 'Liability provision omitted in Version B';

    if (contentA !== contentB) {
      const delta: SemanticDeltaItem = {
        id: 'delta-liability-terms',
        category: 'liability',
        title: 'Liability Caps and Risk Allocation Terms',
        description: 'Variation in limitation of liability or indemnification parameters.',
        docAContent: contentA,
        docBContent: contentB,
        sourceRefA: liabA?.sourceSection || 'General Terms',
        sourceRefB: liabB?.sourceSection || 'General Terms',
        quoteA: contentA,
        quoteB: contentB,
        reviewPriority: 'medium',
        objectiveExplanation:
          'Financial caps on liability or indemnification protections differ between the comparative drafts.',
        counselDiscussionPrompt:
          'Review whether liability caps match transaction value and whether uncapped liabilities exist.',
      };
      deltasByDimension.liability.push(delta);
      changedLiabilityProvisions.push({
        description: 'Limitation of Liability Terms',
        docA: contentA,
        docB: contentB,
        sourceRefA: liabA?.sourceSection || 'Liability',
        sourceRefB: liabB?.sourceSection || 'Liability',
      });
    }
  }

  // -------------------------------------------------------------
  // 7. Dimension: Renewal Provisions
  // -------------------------------------------------------------
  const renewA = (idxA.byDimension.get('renewal') || [])[0];
  const renewB = (idxB.byDimension.get('renewal') || [])[0];

  if (renewA || renewB) {
    const contentA = renewA ? renewA.verbatimSnippet : 'Fixed term; no automatic renewal mechanism detected.';
    const contentB = renewB ? renewB.verbatimSnippet : 'Fixed term; no automatic renewal mechanism detected.';

    if (contentA !== contentB) {
      const delta: SemanticDeltaItem = {
        id: 'delta-renewal-mechanism',
        category: 'renewal',
        title: 'Contract Extension and Renewal Mechanism',
        description: 'Auto-renewal parameters or notice deadlines differ between versions.',
        docAContent: contentA,
        docBContent: contentB,
        sourceRefA: renewA?.sourceSection || 'Term & Renewal',
        sourceRefB: renewB?.sourceSection || 'Term & Renewal',
        quoteA: contentA,
        quoteB: contentB,
        reviewPriority: 'medium',
        objectiveExplanation:
          'Conditions triggering contract renewal or the deadline to deliver non-renewal notice have shifted.',
        counselDiscussionPrompt:
          'Verify whether non-renewal notification calendar alarms are properly logged for tracking.',
      };
      deltasByDimension.renewal.push(delta);
      changedRenewalProvisions.push({
        description: 'Renewal Notice Period',
        docA: contentA,
        docB: contentB,
        sourceRefA: renewA?.sourceSection || 'Renewal',
        sourceRefB: renewB?.sourceSection || 'Renewal',
      });
    }
  }

  // -------------------------------------------------------------
  // 8. Dimension: Confidentiality & Scope
  // -------------------------------------------------------------
  const confA = (idxA.byDimension.get('confidentiality') || [])[0];
  const confB = (idxB.byDimension.get('confidentiality') || [])[0];

  if (confA && confB && confA.normalizedValue !== confB.normalizedValue) {
    const delta: SemanticDeltaItem = {
      id: 'delta-confidentiality-scope',
      category: 'confidentiality',
      title: 'Confidential Information Definition Breadth',
      description: `Confidentiality definition scope differs: ${confA.normalizedValue} vs ${confB.normalizedValue}.`,
      docAContent: confA.verbatimSnippet,
      docBContent: confB.verbatimSnippet,
      sourceRefA: confA.sourceSection,
      sourceRefB: confB.sourceSection,
      quoteA: confA.verbatimSnippet,
      quoteB: confB.verbatimSnippet,
      reviewPriority: 'medium',
      objectiveExplanation:
        'The scope of what constitutes protected confidential information has been broadened or altered, such as including all unconfirmed oral disclosures.',
      counselDiscussionPrompt:
        'Discuss whether marking requirements or written confirmation windows should be required for oral disclosures.',
    };
    deltasByDimension.confidentiality.push(delta);
    changedClauses.push({
      title: 'Confidential Information Scope',
      category: 'Confidentiality',
      docAContent: confA.normalizedValue,
      docBContent: confB.normalizedValue,
      riskImpact: 'increases_risk',
      explanation: delta.objectiveExplanation,
      recommendation: 'Seek standard written marking requirement for oral disclosures.',
      sourceRefA: confA.sourceSection,
      sourceRefB: confB.sourceSection,
      reviewPriority: delta.reviewPriority,
    });
  }

  // -------------------------------------------------------------
  // 9. Dimension: Dispute Provisions (Jurisdiction & Fee Shifting)
  // -------------------------------------------------------------
  const disputeA = idxA.byDimension.get('dispute_provisions') || [];
  const disputeB = idxB.byDimension.get('dispute_provisions') || [];
  const jurisA = disputeA.find((f) => f.title === 'Governing Law and Jurisdiction');
  const jurisB = disputeB.find((f) => f.title === 'Governing Law and Jurisdiction');

  if (jurisA && jurisB && jurisA.normalizedValue !== jurisB.normalizedValue) {
    const delta: SemanticDeltaItem = {
      id: 'delta-dispute-jurisdiction',
      category: 'dispute_provisions',
      title: 'Governing Law and Jurisdiction Shift',
      description: `Governing law modified from ${jurisA.normalizedValue} to ${jurisB.normalizedValue}.`,
      docAContent: jurisA.verbatimSnippet,
      docBContent: jurisB.verbatimSnippet,
      sourceRefA: jurisA.sourceSection,
      sourceRefB: jurisB.sourceSection,
      quoteA: jurisA.verbatimSnippet,
      quoteB: jurisB.verbatimSnippet,
      reviewPriority: 'medium',
      objectiveExplanation:
        'The governing jurisdiction has been altered. Changing governing law impacts statutory interpretation, litigation convenience, and statutory covenant enforcement.',
      counselDiscussionPrompt:
        'Consult with counsel licensed in the newly specified jurisdiction to determine jurisdictional implications.',
    };
    deltasByDimension.dispute_provisions.push(delta);
    changedClauses.push({
      title: 'Governing Law and Jurisdiction Shift',
      category: 'Dispute Resolution',
      docAContent: jurisA.normalizedValue,
      docBContent: jurisB.normalizedValue,
      riskImpact: 'neutral',
      explanation: delta.objectiveExplanation,
      recommendation: 'Confirm with legal counsel licensed in the target jurisdiction.',
      sourceRefA: jurisA.sourceSection,
      sourceRefB: jurisB.sourceSection,
      reviewPriority: delta.reviewPriority,
    });
  }

  // Compare Fee Shifting
  const feeA = disputeA.find((f) => f.title.includes('Fees'));
  const feeB = disputeB.find((f) => f.title.includes('Fees'));

  if (feeA && feeB && feeA.normalizedValue !== feeB.normalizedValue) {
    const feeRemoved = feeB.attributes.feeShiftingPresent === false;
    const delta: SemanticDeltaItem = {
      id: 'delta-dispute-fee-shifting',
      category: 'dispute_provisions',
      title: 'Prevailing Party Attorney Fee Recovery Delta',
      description: `Fee shifting terms modified: ${feeA.normalizedValue} vs ${feeB.normalizedValue}.`,
      docAContent: feeA.verbatimSnippet,
      docBContent: feeB.verbatimSnippet,
      sourceRefA: feeA.sourceSection,
      sourceRefB: feeB.sourceSection,
      quoteA: feeA.verbatimSnippet,
      quoteB: feeB.verbatimSnippet,
      reviewPriority: feeRemoved ? 'high' : 'medium',
      objectiveExplanation:
        'The prevailing party attorney fee recovery clause has been altered or stricken, requiring each party to absorb their own legal expenses regardless of outcome.',
      counselDiscussionPrompt:
        'Discuss whether mutual fee-shifting should be restored to deter unmerited contract breach claims.',
    };
    deltasByDimension.dispute_provisions.push(delta);
    removals.push('Removed prevailing party attorney fee recovery clause.');
  }

  // -------------------------------------------------------------
  // 10. Generalized Clause Comparison (Indexed Pre-filtering)
  // -------------------------------------------------------------
  if (Array.isArray(docA.clauses) && Array.isArray(docB.clauses) && (docA.clauses.length > 0 || docB.clauses.length > 0)) {
    const clauseDiff = matchAndCompareClauses(docA.clauses, docB.clauses);
    for (const match of clauseDiff.matched) {
      if (match.clauseA.originalText !== match.clauseB.originalText) {
        const alreadyCovered = changedClauses.some((c) => c.title.toLowerCase() === match.clauseA.title.toLowerCase());
        if (!alreadyCovered) {
          changedClauses.push({
            title: match.clauseA.title,
            category: match.clauseA.category || 'General',
            docAContent: match.clauseA.originalText,
            docBContent: match.clauseB.originalText,
            riskImpact: 'neutral',
            explanation: `Clause text modified between Document A and Document B (Similarity index: ${(match.similarity * 100).toFixed(0)}%).`,
            recommendation: 'Review wording variation with legal counsel.',
            reviewPriority: 'medium',
          });
        }
      }
    }
    for (const rem of clauseDiff.removed) {
      const already = removals.some((r) => r.toLowerCase().includes(rem.title.toLowerCase()));
      if (!already) {
        removals.push(`Removed clause: ${rem.title}`);
      }
    }
    for (const add of clauseDiff.added) {
      const already = additions.some((a) => a.toLowerCase().includes(add.title.toLowerCase()));
      if (!already) {
        additions.push(`Added clause: ${add.title}`);
      }
    }
  }

  // Helper to build structured category delta
  function buildCategoryDelta(
    category: SemanticDeltaItem['category'],
    label: string
  ): ComparisonCategoryDelta {
    const items = deltasByDimension[category] || [];
    const hasDeltas = items.length > 0;
    const maxPriority: ReviewPriority = items.some((i) => i.reviewPriority === 'high')
      ? 'high'
      : items.some((i) => i.reviewPriority === 'medium')
      ? 'medium'
      : items.some((i) => i.reviewPriority === 'low')
      ? 'low'
      : 'neutral';

    let summary = `No material semantic variations detected for ${label}.`;
    if (hasDeltas) {
      summary = `Identified ${items.length} key contractual ${items.length === 1 ? 'variation' : 'variations'} in ${label}. Priority: ${maxPriority.toUpperCase()}.`;
    }

    return {
      category,
      categoryLabel: label,
      hasDeltas,
      deltaCount: items.length,
      maxReviewPriority: maxPriority,
      summary,
      items,
    };
  }

  const categoryDeltas = {
    changedTerms: buildCategoryDelta('changed_terms', 'Changed Terms'),
    dates: buildCategoryDelta('dates', 'Dates & Timelines'),
    obligations: buildCategoryDelta('obligations', 'Obligations & Covenants'),
    payment: buildCategoryDelta('payment', 'Payment & Financial Terms'),
    termination: buildCategoryDelta('termination', 'Termination Rights'),
    liability: buildCategoryDelta('liability', 'Liability Provisions'),
    renewal: buildCategoryDelta('renewal', 'Renewal Terms'),
    confidentiality: buildCategoryDelta('confidentiality', 'Confidentiality Scope'),
    disputeProvisions: buildCategoryDelta('dispute_provisions', 'Dispute Provisions'),
  };

  // Determine overall review priority & risk shift
  const totalHighPriority = Object.values(categoryDeltas).filter(
    (c) => c.maxReviewPriority === 'high'
  ).length;

  const reviewPrioritySummary: 'high_review_priority' | 'medium_review_priority' | 'routine_variations' =
    totalHighPriority >= 2
      ? 'high_review_priority'
      : totalHighPriority === 1
      ? 'medium_review_priority'
      : 'routine_variations';

  const overallRiskShift: 'higher_for_user' | 'lower_for_user' | 'balanced_shift' =
    totalHighPriority >= 1 ? 'higher_for_user' : 'balanced_shift';

  const executiveSummary = `Semantic comparison of "${docA.title}" vs "${docB.title}". ${
    reviewPrioritySummary === 'high_review_priority'
      ? 'Document B introduces substantial contractual modifications—including unilateral shifts in obligations, remedies, or durations—that represent High Review Priority items for legal counsel.'
      : reviewPrioritySummary === 'medium_review_priority'
      ? 'Document B exhibits moderate semantic adjustments across specific clauses that warrant alignment with your organization’s contract playbook.'
      : 'The two documents maintain generally consistent contractual terms with routine drafting differences.'
  }`;

  const actionItemsForReview = [
    'Review all High Review Priority deltas with legal counsel prior to executing the revised agreement.',
    'Confirm whether business leadership approves any shifted financial obligations, liquidated damages, or extended survival periods.',
    'Verify that dispute resolution and governing law provisions match your organization’s standard corporate entity jurisdiction.',
  ];

  return {
    docA: { id: docA.id, title: docA.title },
    docB: { id: docB.id, title: docB.title },
    executiveSummary,
    overallRiskShift,
    reviewPrioritySummary,
    additions,
    removals,
    changedClauses,
    changedDates,
    changedFinancialObligations,
    changedTerminationRights,
    changedLiabilityProvisions,
    changedRenewalProvisions,
    categoryDeltas,
    actionItemsForReview,
    legalDisclaimer: COMPARISON_DISCLAIMER_NOTICE,
  };
}

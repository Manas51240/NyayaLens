import { LegalDocument } from '@/types/legal';
import { IntentClassificationResult, RetrievalResult, RetrievedEvidenceItem } from './types';

// Legal query expansion synonym dictionary
const LEGAL_SYNONYM_MAP: Record<string, string[]> = {
  termination: ['cancel', 'terminate', 'default', 'expiration', 'breach', 'notice', 'without cause', 'convenience', 'insolvent', 'cure'],
  terminate: ['termination', 'cancel', 'default', 'expiration', 'notice', 'convenience', 'cure'],
  'non-compete': ['non-solicitation', 'restrictive covenant', 'competing', 'not engage in'],
  noncompete: ['non-solicitation', 'restrictive covenant', 'competing', 'not engage in'],
  liability: ['damages', 'limitation of liability', 'aggregate liability', 'indemnification', 'cap'],
  rent: ['base rent', 'additional rent', 'triple net', 'operating expenses', 'monthly rent'],
  payment: ['invoices', 'fees', 'compensation', 'base salary', 'payable', 'due period', 'due date', 'overdue', 'interest'],
  due: ['payable', 'due date', 'due period', 'within', 'receipt', 'invoices'],
  period: ['within', 'days', 'months', 'timeline', 'deadline', 'notice'],
  arbitration: ['dispute resolution', 'jams', 'binding arbitration', 'jury trial', 'class action'],
  severance: ['salary continuation', 'release of claims', 'termination without cause'],
  confidentiality: ['confidential information', 'proprietary', 'non-disclosure', 'trade secret'],
  ip: ['intellectual property', 'deliverables', 'inventions', 'ownership', 'copyright'],
};

import { getOrBuildDocumentIndex } from './document-indexer';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Multi-stage legal evidence retriever searching document text, sections, and clauses.
 * Optimized with DocumentIndex and pre-compiled regex patterns for sub-millisecond execution.
 */
export function retrieveEvidence(
  document: LegalDocument,
  intentResult: IntentClassificationResult
): RetrievalResult {
  const { primaryTopics } = intentResult;

  if (primaryTopics.length === 0) {
    return {
      query: intentResult.primaryTopics.join(' '),
      evidenceItems: [],
      hasSufficientEvidence: false,
      searchExplanation: 'No specific search keywords were identified in the inquiry.',
    };
  }

  // Expand query with legal synonyms
  const expandedTerms = new Set<string>(primaryTopics);
  for (const topic of primaryTopics) {
    const synonyms = LEGAL_SYNONYM_MAP[topic.toLowerCase()];
    if (synonyms) {
      synonyms.forEach((s) => expandedTerms.add(s.toLowerCase()));
    }
  }

  // Precompile query regexes ONCE before scanning paragraphs
  const primaryMatchers = primaryTopics.map((term) => ({
    term,
    isSingleWord: !term.includes(' ') && !term.includes('-'),
    regex: new RegExp(`\\b${escapeRegex(term)}\\b`, 'i'),
  }));

  const synonymMatchers = Array.from(expandedTerms)
    .filter((t) => !primaryTopics.includes(t))
    .map((term) => ({
      term,
      isSingleWord: !term.includes(' ') && !term.includes('-'),
      regex: new RegExp(`\\b${escapeRegex(term)}\\b`, 'i'),
    }));

  // Retrieve pre-built or cached document index (avoids repeated parsing/splitting)
  const docIndex = getOrBuildDocumentIndex(document);

  interface ScoredParagraph {
    text: string;
    score: number;
    matchedTerms: string[];
    sectionTitle: string;
    lineIndex: number;
  }

  const scoredParagraphs: ScoredParagraph[] = [];

  for (let i = 0; i < docIndex.paragraphs.length; i++) {
    const para = docIndex.paragraphs[i];
    let score = 0;
    const matchedTerms: string[] = [];

    // Check primary topics (higher weight)
    for (const matcher of primaryMatchers) {
      // Fast O(1) set pre-filter for single words
      if (matcher.isSingleWord && !para.words.has(matcher.term)) {
        continue;
      }
      if (matcher.regex.test(para.textLower)) {
        score += 5;
        matchedTerms.push(matcher.term);
      }
    }

    // Check expanded synonyms (medium weight)
    for (const matcher of synonymMatchers) {
      if (matcher.isSingleWord && !para.words.has(matcher.term)) {
        continue;
      }
      if (matcher.regex.test(para.textLower)) {
        score += 2;
        matchedTerms.push(matcher.term);
      }
    }

    // If no query terms or synonyms matched this paragraph, skip it
    if (matchedTerms.length === 0) {
      continue;
    }

    // Bonus for multi-term co-occurrence in a single paragraph
    if (matchedTerms.length >= 2) {
      score += 4;
    }

    // Header score bonus
    if (/^(SECTION|ARTICLE|§|[0-9]{1,2}\.)/i.test(para.sectionTitle)) {
      score += 2;
    }

    // Multi-topic questions require either co-occurrence or strong match score
    const minMatchedRequired = Math.min(2, primaryTopics.length);
    if (matchedTerms.length >= minMatchedRequired || score >= 9) {
      scoredParagraphs.push({
        text: para.text,
        score,
        matchedTerms,
        sectionTitle: para.sectionTitle,
        lineIndex: para.lineIndex,
      });
    }
  }

  // Also search parsed document clauses for structured matches
  for (const clause of docIndex.clauses) {
    let clauseScore = 0;
    const clauseMatchedTerms: string[] = [];

    for (const matcher of primaryMatchers) {
      if (matcher.isSingleWord && !clause.words.has(matcher.term)) {
        continue;
      }
      if (matcher.regex.test(clause.textLower)) {
        clauseScore += 4;
        clauseMatchedTerms.push(matcher.term);
      }
    }

    const minClauseMatches = Math.min(2, primaryTopics.length);
    if (clauseMatchedTerms.length >= minClauseMatches && clauseScore >= 4) {
      scoredParagraphs.push({
        text: clause.originalText,
        score: clauseScore + 2,
        matchedTerms: clauseMatchedTerms,
        sectionTitle: clause.sectionTitle,
        lineIndex: 1,
      });
    }
  }

  // Sort by relevance score descending
  scoredParagraphs.sort((a, b) => b.score - a.score);

  // Require sufficient evidence threshold
  const filtered = scoredParagraphs.filter((sp) => sp.score >= 5);

  if (filtered.length === 0) {
    return {
      query: primaryTopics.join(' '),
      evidenceItems: [],
      hasSufficientEvidence: false,
      searchExplanation: `No paragraphs or clauses matched the search terms [${primaryTopics.join(', ')}] in ${document.title}.`,
    };
  }

  // Deduplicate and take top 3 evidence items
  const seenTexts = new Set<string>();
  const topEvidence: RetrievedEvidenceItem[] = [];

  for (const item of filtered) {
    const cleanSnippet = item.text.trim();
    if (seenTexts.has(cleanSnippet)) continue;
    seenTexts.add(cleanSnippet);

    const maxQuoteLength = 450;
    let quoteSnippet = cleanSnippet;
    if (cleanSnippet.length > maxQuoteLength) {
      let bestIndex = -1;
      for (const t of item.matchedTerms) {
        const idx = cleanSnippet.toLowerCase().indexOf(t.toLowerCase());
        if (idx !== -1 && (bestIndex === -1 || idx < bestIndex)) {
          bestIndex = idx;
        }
      }
      if (bestIndex > 100) {
        const start = Math.max(0, bestIndex - 60);
        const end = Math.min(cleanSnippet.length, start + maxQuoteLength);
        quoteSnippet = (start > 0 ? '...' : '') + cleanSnippet.substring(start, end).trim() + (end < cleanSnippet.length ? '...' : '');
      } else {
        quoteSnippet = cleanSnippet.substring(0, maxQuoteLength).trim() + '...';
      }
    }

    const normalizedScore = Number(Math.min(1.0, item.score / 20).toFixed(2));

    topEvidence.push({
      id: `ev-${topEvidence.length + 1}`,
      quote: quoteSnippet,
      sectionTitle: item.sectionTitle,
      relevanceScore: normalizedScore,
      matchType: item.score >= 10 ? 'exact' : 'semantic',
      tokenCount: Math.ceil(quoteSnippet.length / 4),
    });

    if (topEvidence.length >= 3) break;
  }

  return {
    query: primaryTopics.join(' '),
    evidenceItems: topEvidence,
    hasSufficientEvidence: topEvidence.length > 0,
    searchExplanation: `Found ${topEvidence.length} grounded evidence excerpts in ${document.title}.`,
  };
}

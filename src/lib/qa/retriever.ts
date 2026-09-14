import { LegalDocument } from '@/types/legal';
import { IntentClassificationResult, RetrievalResult, RetrievedEvidenceItem } from './types';

// Legal query expansion synonym dictionary
const LEGAL_SYNONYM_MAP: Record<string, string[]> = {
  termination: ['cancel', 'terminate', 'default', 'expiration', 'breach', 'notice', 'without cause'],
  terminate: ['termination', 'cancel', 'default', 'expiration', 'notice'],
  'non-compete': ['non-solicitation', 'restrictive covenant', 'competing', 'not engage in'],
  noncompete: ['non-solicitation', 'restrictive covenant', 'competing', 'not engage in'],
  liability: ['damages', 'limitation of liability', 'aggregate liability', 'indemnification', 'cap'],
  rent: ['base rent', 'additional rent', 'triple net', 'operating expenses', 'monthly rent'],
  payment: ['invoices', 'fees', 'compensation', 'base salary', 'payable'],
  arbitration: ['dispute resolution', 'jams', 'binding arbitration', 'jury trial', 'class action'],
  severance: ['salary continuation', 'release of claims', 'termination without cause'],
  confidentiality: ['confidential information', 'proprietary', 'non-disclosure', 'trade secret'],
};

/**
 * Multi-stage legal evidence retriever searching document text, sections, and clauses.
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

  const raw = document.rawText;
  const paragraphs = raw
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);

  interface ScoredParagraph {
    text: string;
    score: number;
    matchedTerms: string[];
    sectionTitle: string;
    lineIndex: number;
  }

  const scoredParagraphs: ScoredParagraph[] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    const paraLower = para.toLowerCase().replace(/[-_]/g, ' ');

    let score = 0;
    const matchedTerms: string[] = [];

    // Check primary topics (higher weight)
    for (const term of primaryTopics) {
      const termRegex = new RegExp(`\\b${term}\\b`, 'i');
      if (termRegex.test(paraLower)) {
        score += 5;
        matchedTerms.push(term);
      }
    }

    // Check expanded synonyms (medium weight)
    for (const term of expandedTerms) {
      if (!primaryTopics.includes(term)) {
        const termRegex = new RegExp(`\\b${term}\\b`, 'i');
        if (termRegex.test(paraLower)) {
          score += 2;
          matchedTerms.push(term);
        }
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

    // Extract section header if present in paragraph
    let sectionTitle = 'Document Excerpt';
    const firstLine = para.split('\n')[0].trim();
    if (/^(SECTION|ARTICLE|§|[0-9]{1,2}\.)/i.test(firstLine) && firstLine.length < 70) {
      sectionTitle = firstLine;
      score += 2;
    }

    // Multi-topic questions require either co-occurrence or strong match score
    const minMatchedRequired = Math.min(2, primaryTopics.length);
    if (matchedTerms.length >= minMatchedRequired || score >= 9) {
      scoredParagraphs.push({
        text: para,
        score,
        matchedTerms,
        sectionTitle,
        lineIndex: i + 1,
      });
    }
  }

  // Also search parsed document clauses for structured matches
  if (Array.isArray(document.clauses)) {
    for (const clause of document.clauses) {
      const clauseTextLower = (clause.title + ' ' + clause.originalText + ' ' + clause.plainEnglishTranslation).toLowerCase();
      let clauseScore = 0;
      const clauseMatchedTerms: string[] = [];

      for (const term of primaryTopics) {
        const termRegex = new RegExp(`\\b${term}\\b`, 'i');
        if (termRegex.test(clauseTextLower)) {
          clauseScore += 4;
          clauseMatchedTerms.push(term);
        }
      }

      const minClauseMatches = Math.min(2, primaryTopics.length);
      if (clauseMatchedTerms.length >= minClauseMatches && clauseScore >= 4) {
        scoredParagraphs.push({
          text: clause.originalText,
          score: clauseScore + 2,
          matchedTerms: clauseMatchedTerms,
          sectionTitle: clause.sourceSection || clause.title,
          lineIndex: 1,
        });
      }
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

    const maxQuoteLength = 320;
    const truncatedQuote = cleanSnippet.length > maxQuoteLength
      ? cleanSnippet.substring(0, maxQuoteLength).trim() + '...'
      : cleanSnippet;

    const normalizedScore = Number(Math.min(1.0, item.score / 20).toFixed(2));

    topEvidence.push({
      id: `ev-${topEvidence.length + 1}`,
      quote: truncatedQuote,
      sectionTitle: item.sectionTitle,
      relevanceScore: normalizedScore,
      matchType: item.score >= 10 ? 'exact' : 'semantic',
      tokenCount: Math.ceil(truncatedQuote.length / 4),
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

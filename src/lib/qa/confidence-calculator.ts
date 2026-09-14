import { GroundedEvidence } from '@/types/legal';
import { RetrievalResult } from './types';

/**
 * Calculates empirical confidence based on evidence quality and retrieval density.
 */
export function calculateGroundedConfidence(
  retrievalResult: RetrievalResult,
  notFoundInDocument: boolean
): { confidence: number; evidenceReferences: GroundedEvidence[] } {
  if (notFoundInDocument || !retrievalResult.hasSufficientEvidence || retrievalResult.evidenceItems.length === 0) {
    return {
      confidence: 0,
      evidenceReferences: [],
    };
  }

  const primary = retrievalResult.evidenceItems[0];

  // Base score from relevance (0 to 80)
  let score = Math.round(primary.relevanceScore * 80);

  // Corroboration bonus: +10 if multiple distinct sections corroborate
  if (retrievalResult.evidenceItems.length >= 2) {
    score += 10;
  }

  // Exact match bonus: +5
  if (primary.matchType === 'exact') {
    score += 5;
  }

  const confidence = Math.max(10, Math.min(98, score));

  // Build structured GroundedEvidence references
  const evidenceReferences: GroundedEvidence[] = retrievalResult.evidenceItems.map((item) => ({
    quote: item.quote,
    section: item.sectionTitle,
    confidence: Math.round(item.relevanceScore * 100),
  }));

  return {
    confidence,
    evidenceReferences,
  };
}

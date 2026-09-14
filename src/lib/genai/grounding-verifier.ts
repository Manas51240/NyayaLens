import { AbsenceRecord } from './schemas';

export interface GroundingVerificationResult {
  isGrounded: boolean;
  matchRatio: number;
  reason?: string;
  matchedExcerpt?: string;
}

/**
 * Normalizes text for evidence matching by collapsing whitespace and stripping edge punctuation.
 */
function cleanForMatching(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

/**
 * Verifies whether a candidate quote is genuinely grounded in the raw document text.
 * Prevents hallucinated or fabricated evidence.
 */
export function verifyQuoteGrounding(rawText: string, quote: string): GroundingVerificationResult {
  if (!quote || quote.trim().length === 0) {
    return {
      isGrounded: false,
      matchRatio: 0,
      reason: 'Quote is empty or missing.',
    };
  }

  if (!rawText || rawText.trim().length === 0) {
    return {
      isGrounded: false,
      matchRatio: 0,
      reason: 'Document text is empty.',
    };
  }

  const cleanQuote = quote.trim();

  // 1. Direct exact substring match (highest fidelity)
  if (rawText.includes(cleanQuote)) {
    return {
      isGrounded: true,
      matchRatio: 1.0,
      matchedExcerpt: cleanQuote,
    };
  }

  // 2. Whitespace-normalized substring match
  const normalizedRaw = rawText.replace(/\s+/g, ' ');
  const normalizedQuote = cleanQuote.replace(/\s+/g, ' ');

  if (normalizedRaw.includes(normalizedQuote)) {
    return {
      isGrounded: true,
      matchRatio: 0.98,
      matchedExcerpt: cleanQuote,
    };
  }

  // 3. Punctuation-agnostic search
  const cleanRawWords = cleanForMatching(rawText);
  const cleanQuoteWords = cleanForMatching(cleanQuote);

  if (cleanRawWords.includes(cleanQuoteWords)) {
    return {
      isGrounded: true,
      matchRatio: 0.92,
      matchedExcerpt: cleanQuote,
    };
  }

  // 4. Token N-Gram overlap check (for quotes with slight OCR or formatting differences)
  const quoteTokens = cleanQuoteWords.split(' ').filter((w) => w.length > 2);
  if (quoteTokens.length === 0) {
    return {
      isGrounded: false,
      matchRatio: 0,
      reason: 'Quote contains no meaningful words for verification.',
    };
  }

  let matchedTokens = 0;
  for (const token of quoteTokens) {
    if (cleanRawWords.includes(token)) {
      matchedTokens++;
    }
  }

  const matchRatio = matchedTokens / quoteTokens.length;

  if (matchRatio >= 0.75) {
    return {
      isGrounded: true,
      matchRatio: Number(matchRatio.toFixed(2)),
      matchedExcerpt: cleanQuote,
    };
  }

  return {
    isGrounded: false,
    matchRatio: Number(matchRatio.toFixed(2)),
    reason: `Quote has insufficient grounding in document text (match ratio: ${(matchRatio * 100).toFixed(0)}% < 75% required).`,
  };
}

/**
 * Calibrates confidence score based on empirical evidence grounding.
 * Lowers or penalizes confidence when evidence is weak or unverified.
 */
export function calibrateConfidenceScore(
  baseConfidence: number,
  verification: GroundingVerificationResult
): number {
  if (!verification.isGrounded) {
    // Ungrounded claims cannot exceed 20% confidence
    return Math.min(20, Math.round(baseConfidence * 0.2));
  }

  // Scale base confidence by match fidelity
  const calibrated = Math.round(baseConfidence * verification.matchRatio);
  return Math.max(10, Math.min(100, calibrated));
}

/**
 * Filters out ungrounded findings from a list to ensure zero unsupported claims.
 */
export function filterUngroundedFindings<
  T extends { quote?: string; originalText?: string; evidenceQuote?: string; confidence?: number }
>(findings: T[], rawText: string): { verifiedFindings: T[]; rejectedCount: number } {
  const verified: T[] = [];
  let rejectedCount = 0;

  for (const item of findings) {
    const quoteToCheck = item.quote || item.originalText || item.evidenceQuote;
    if (!quoteToCheck) {
      rejectedCount++;
      continue;
    }

    const verification = verifyQuoteGrounding(rawText, quoteToCheck);
    if (verification.isGrounded) {
      // Adjust confidence if present
      if (item.confidence !== undefined) {
        item.confidence = calibrateConfidenceScore(item.confidence, verification);
      }
      verified.push(item);
    } else {
      rejectedCount++;
    }
  }

  return {
    verifiedFindings: verified,
    rejectedCount,
  };
}

/**
 * Creates a standardized Absence Record for topics not present in document.
 */
export function createAbsenceNotice(topic: string, documentTitle: string): AbsenceRecord {
  return {
    topic,
    notFound: true,
    missingInformationNotice: `I searched ${documentTitle} for terms regarding "${topic}", but I could not find any clauses, sections, or provisions addressing this subject in the document text.`,
    searchTermsChecked: topic.toLowerCase().split(/\s+/).filter((w) => w.length > 2),
    reviewAdvice: `Silence in a legal agreement on a topic like "${topic}" means statutory defaults or general common law principles may apply instead of tailored terms. Consult with a qualified legal professional to determine whether drafting an explicit clause is advisable.`,
  };
}

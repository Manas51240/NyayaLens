import { AbsenceRecord } from './schemas';

export interface GroundingVerificationResult {
  isGrounded: boolean;
  isVerbatim?: boolean;
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
 * Strictly separates exact verbatim quotes from ungrounded loose token overlap.
 */
export function verifyQuoteGrounding(rawText: string, quote: string): GroundingVerificationResult {
  if (!quote || quote.trim().length === 0) {
    return {
      isGrounded: false,
      isVerbatim: false,
      matchRatio: 0,
      reason: 'Quote is empty or missing.',
    };
  }

  if (!rawText || rawText.trim().length === 0) {
    return {
      isGrounded: false,
      isVerbatim: false,
      matchRatio: 0,
      reason: 'Document text is empty.',
    };
  }

  const cleanQuote = quote.trim();

  // 1. Direct exact substring match (highest fidelity verbatim)
  if (rawText.includes(cleanQuote)) {
    return {
      isGrounded: true,
      isVerbatim: true,
      matchRatio: 1.0,
      matchedExcerpt: cleanQuote,
    };
  }

  // 2. Whitespace-normalized substring match (verbatim with whitespace tolerance)
  const normalizedRaw = rawText.replace(/\s+/g, ' ');
  const normalizedQuote = cleanQuote.replace(/\s+/g, ' ');

  if (normalizedRaw.includes(normalizedQuote)) {
    return {
      isGrounded: true,
      isVerbatim: true,
      matchRatio: 0.98,
      matchedExcerpt: cleanQuote,
    };
  }

  // 3. Punctuation-agnostic search (verbatim with harmless punctuation difference)
  const cleanRawWords = cleanForMatching(rawText);
  const cleanQuoteWords = cleanForMatching(cleanQuote);

  if (cleanRawWords.includes(cleanQuoteWords)) {
    return {
      isGrounded: true,
      isVerbatim: true,
      matchRatio: 0.95,
      matchedExcerpt: cleanQuote,
    };
  }

  // 4. Contiguous multi-word sequence match (for quotes with ellipsis or minor OCR artifacts)
  const quoteTokens = cleanQuoteWords.split(' ').filter((w) => w.length > 1);
  if (quoteTokens.length < 3) {
    return {
      isGrounded: false,
      isVerbatim: false,
      matchRatio: 0,
      reason: 'Quote is too short for reliable grounded extraction without exact match.',
    };
  }

  // Check for contiguous sequence chunks (at least 4 consecutive words must appear together)
  const chunkSize = Math.min(4, quoteTokens.length);
  let contiguousHits = 0;
  const totalChunks = quoteTokens.length - chunkSize + 1;

  for (let i = 0; i < totalChunks; i++) {
    const chunk = quoteTokens.slice(i, i + chunkSize).join(' ');
    if (cleanRawWords.includes(chunk)) {
      contiguousHits++;
    }
  }

  const sequenceRatio = totalChunks > 0 ? contiguousHits / totalChunks : 0;

  // Strict: loose unordered overlap is NOT accepted. Must have high contiguous sequence consistency.
  if (sequenceRatio >= 0.70) {
    return {
      isGrounded: true,
      isVerbatim: false, // Near-verbatim or OCR-varied, but not exact verbatim
      matchRatio: Number(sequenceRatio.toFixed(2)),
      matchedExcerpt: cleanQuote,
    };
  }

  return {
    isGrounded: false,
    isVerbatim: false,
    matchRatio: Number(sequenceRatio.toFixed(2)),
    reason: `Quote has insufficient grounding in document text (contiguous sequence match: ${(sequenceRatio * 100).toFixed(0)}% < 70% required). Loose token overlap is rejected.`,
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

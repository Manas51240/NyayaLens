import {
  detectPromptInjectionAttempts,
  wrapUntrustedDocumentText,
  redactPersonalIdentifiableInformation,
} from '../sanitizer';
import { SecurityAnalysis } from './types';

/**
 * Normalizes text extracted from documents:
 * - Unicode normalization (NFKC)
 * - Stripping non-printable control characters & null bytes
 * - Normalizing line endings to Unix \n
 * - Trimming line-level whitespace
 * - Collapsing excessive blank lines while preserving legal paragraph structures
 */
export function normalizeText(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') {
    return '';
  }

  // 1. Unicode NFKC Normalization (resolves ligatures like 'fi' -> 'fi', fullwidth chars, homoglyphs)
  let text = rawText.normalize('NFKC');

  // 2. Remove null bytes and non-printable control characters (preserve \t \n)
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 3. Normalize line endings (\r\n and \r to \n)
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 4. Clean line-level whitespace
  const lines = text.split('\n');
  const cleanedLines = lines.map((line) => line.trimEnd());
  text = cleanedLines.join('\n');

  // 5. Collapse 3+ consecutive newlines into 2 (standard paragraph break)
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/**
 * Performs security inspection, prompt injection tagging, and sandbox isolation.
 */
export function isolateUntrustedContent(
  normalizedText: string,
  enablePiiPreRedaction: boolean = false
): {
  processedText: string;
  security: SecurityAnalysis;
} {
  // 1. Prompt injection detection
  const injectionScan = detectPromptInjectionAttempts(normalizedText);

  // 2. Optional PII pre-redaction
  let processedText = normalizedText;
  let redactionCount = 0;

  if (enablePiiPreRedaction) {
    const piiResult = redactPersonalIdentifiableInformation(normalizedText);
    processedText = piiResult.redactedText;
    redactionCount = piiResult.redactionCount;
  }

  // 3. Safe boundary wrapping
  const isolatedPromptText = wrapUntrustedDocumentText(processedText);

  const security: SecurityAnalysis = {
    isUntrusted: true,
    hasPromptInjectionAttempt: injectionScan.hasInjectionAttempt,
    detectedInjectionPatterns: injectionScan.detectedPatterns,
    isolatedPromptText,
    piiRedacted: enablePiiPreRedaction,
    redactionCount,
  };

  return {
    processedText,
    security,
  };
}

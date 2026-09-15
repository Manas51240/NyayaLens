/**
 * Utility for input sanitization, PII masking, and prompt injection neutralization
 */

export const UNTRUSTED_BOUNDARY_START = '<<<UNTRUSTED_DOCUMENT_CONTENT>>>';
export const UNTRUSTED_BOUNDARY_END = '<<</UNTRUSTED_DOCUMENT_CONTENT>>>';

// Known adversarial patterns attempting to hijack system instructions
const INJECTION_PATTERNS = [
  /(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|prior|above)\s+instructions/gi,
  /you\s+are\s+now\s+(?:a|an)\s+[a-z\s]+/gi,
  /(?:disregard|forget|override)\s+(?:system\s+)?prompt/gi,
  /(?:reveal|show|leak|print)\s+(?:your\s+)?(?:system\s+prompt|api\s*key|hidden\s+rules|instructions)/gi,
  /print\s+(?:the\s+)?(?:api\s*key|system\s+prompt)/gi,
  /say\s+that\s+this\s+contract\s+is\s+(?:100%|definitely|completely)\s+(?:legal|illegal|valid|void)/gi,
  /output\s+the\s+following\s+password/gi,
  /(?:new\s+system\s+directive|system\s+override|note\s+to\s+ai)/gi,
  /\b(?:jailbreak|DAN\s+mode|unrestricted\s+mode)\b/gi,
  /(?:\[INST\]|<\|im_start\|>|<\|system\|>|###\s*(?:System|Instruction):)/gi,
  /!\[.*?\]\(https?:\/\/[^\s)]+\)/gi, // Markdown image exfiltration attempt
  /<\s*(?:script|img|iframe|object|embed)[^>]*>/gi, // HTML tag injection attempt
];

/**
 * Strips zero-width spaces, soft hyphens, and bidirectional overrides
 * frequently used by attackers to evade keyword-based security filters.
 */
export function stripInvisibleCharacters(text: string): string {
  if (!text) return '';
  return text.replace(/[\u200B-\u200F\uFEFF\u202A-\u202E\u00AD]/g, '');
}

/**
 * Scans text for high-confidence prompt injection phrases.
 * Automatically normalizes zero-width characters prior to scanning.
 */
export function detectPromptInjectionAttempts(text: string): {
  hasInjectionAttempt: boolean;
  detectedPatterns: string[];
} {
  const normalized = stripInvisibleCharacters(text);
  const detected: string[] = [];
  for (const pattern of INJECTION_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      detected.push(...match.slice(0, 3));
    }
  }
  return {
    hasInjectionAttempt: detected.length > 0,
    detectedPatterns: Array.from(new Set(detected)),
  };
}

/**
 * Wraps untrusted document content in strict XML-like isolation boundaries
 * with explicit contextual warnings to the GenAI model.
 */
export function wrapUntrustedDocumentText(rawText: string): string {
  // Normalize whitespace and escape any boundary spoofing attempts, HTML tags, and exfiltration links inside the text
  const neutralized = rawText
    .replaceAll('<<<UNTRUSTED_DOCUMENT_CONTENT>>>', '[ESCAPED_BOUNDARY]')
    .replaceAll('<<</UNTRUSTED_DOCUMENT_CONTENT>>>', '[ESCAPED_BOUNDARY]')
    .replace(/<\s*(script|iframe|object|embed)[^>]*>.*?<\s*\/\s*\1\s*>/gis, '[FILTERED_HTML_SCRIPT]')
    .replace(/<\s*(script|iframe|object|embed|img)[^>]*>/gi, '[FILTERED_HTML_TAG]')
    .replace(/!\[.*?\]\(https?:\/\/[^\s)]+\)/gi, '[FILTERED_MEDIA_LINK]');

  return `${UNTRUSTED_BOUNDARY_START}\n${neutralized}\n${UNTRUSTED_BOUNDARY_END}`;
}

/**
 * Masks identifiable personal information (SSN, phone, email, card numbers)
 * for users selecting client-side privacy redaction.
 */
export function redactPersonalIdentifiableInformation(text: string): {
  redactedText: string;
  redactionCount: number;
} {
  let count = 0;

  // Mask US SSN format: XXX-XX-XXXX
  let redacted = text.replace(/\b\d{3}-\d{2}-\d{4}\b/g, () => {
    count++;
    return '[REDACTED_SSN]';
  });

  // Mask Emails
  redacted = redacted.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, () => {
    count++;
    return '[REDACTED_EMAIL]';
  });

  // Mask Phone numbers: (123) 456-7890 or 123-456-7890
  redacted = redacted.replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, () => {
    count++;
    return '[REDACTED_PHONE]';
  });

  // Mask Credit card patterns (16 digits)
  redacted = redacted.replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, () => {
    count++;
    return '[REDACTED_FINANCIAL_CARD]';
  });

  return { redactedText: redacted, redactionCount: count };
}

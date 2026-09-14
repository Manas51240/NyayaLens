/**
 * Utility for input sanitization, PII masking, and prompt injection neutralization
 */

export const UNTRUSTED_BOUNDARY_START = '<<<UNTRUSTED_DOCUMENT_CONTENT>>>';
export const UNTRUSTED_BOUNDARY_END = '<<</UNTRUSTED_DOCUMENT_CONTENT>>>';

// Known adversarial patterns attempting to hijack system instructions
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/gi,
  /you\s+are\s+now\s+(a|an)\s+[a-z\s]+/gi,
  /disregard\s+(system\s+)?prompt/gi,
  /reveal\s+(your\s+)?(system\s+prompt|api\s*key|hidden\s+rules)/gi,
  /print\s+(the\s+)?(api\s*key|system\s+prompt)/gi,
  /say\s+that\s+this\s+contract\s+is\s+(100%|definitely|completely)\s+(legal|illegal|valid|void)/gi,
  /output\s+the\s+following\s+password/gi,
  /new\s+system\s+directive/gi,
];

/**
 * Scans text for high-confidence prompt injection phrases.
 * Does not silently delete content (as it might be legal text),
 * but tags it so the LLM prompt can explicitly neutralize it.
 */
export function detectPromptInjectionAttempts(text: string): {
  hasInjectionAttempt: boolean;
  detectedPatterns: string[];
} {
  const detected: string[] = [];
  for (const pattern of INJECTION_PATTERNS) {
    const match = text.match(pattern);
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
  // Normalize whitespace and escape any boundary spoofing attempts inside the text
  const neutralized = rawText
    .replaceAll('<<<UNTRUSTED_DOCUMENT_CONTENT>>>', '[ESCAPED_BOUNDARY]')
    .replaceAll('<<</UNTRUSTED_DOCUMENT_CONTENT>>>', '[ESCAPED_BOUNDARY]');

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

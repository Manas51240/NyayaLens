import { SafetyValidationResult } from './types';

export const LEGAL_DISCLAIMER_NOTICE =
  'Notice: NyayaLens is an AI-powered legal document understanding platform designed for educational and informational assistance. It does not provide legal advice, legal opinions, or replace a licensed attorney. Review severity levels indicate AI-identified review priority, not legal enforceability.';

// Disallowed phrases that overstep into unlicensed legal representation or outcome guarantees
const PROHIBITED_LEGAL_CLAIMS = [
  { pattern: /\b(this\s+contract\s+is\s+100%\s+legal)\b/gi, replacement: 'the document contains standard language regarding' },
  { pattern: /\b(this\s+contract\s+is\s+definitely\s+(illegal|void))\b/gi, replacement: 'this provision may warrant legal review for enforceability' },
  { pattern: /\b(you\s+will\s+(definitely\s+)?win\s+the\s+lawsuit)\b/gi, replacement: 'dispute resolution outcomes depend on judicial interpretation' },
  { pattern: /\b(you\s+will\s+lose)\b/gi, replacement: 'there is potential contractual exposure' },
  { pattern: /\b(i\s+advise\s+you\s+to\s+sign)\b/gi, replacement: 'consulting with legal counsel before signing is recommended' },
];

/**
 * Validates generated answer against legal safety guardrails and neutralizes
 * any indirect prompt injection attempts that may have originated from document text.
 */
export function validateQASafety(
  rawAnswer: string
): { validatedAnswer: string; safetyValidation: SafetyValidationResult } {
  let text = rawAnswer;
  const warnings: string[] = [];
  const violationsBlocked: string[] = [];

  // 1. Scan and neutralize prohibited legal outcome certainty statements
  for (const rule of PROHIBITED_LEGAL_CLAIMS) {
    if (rule.pattern.test(text)) {
      violationsBlocked.push(`Neutralized certainty claim matching ${rule.pattern.source}`);
      text = text.replace(rule.pattern, rule.replacement);
    }
  }

  // 2. Escape any raw boundary marker tags that may have leaked from document content
  if (text.includes('<<<UNTRUSTED_DOCUMENT_CONTENT>>>') || text.includes('<<</UNTRUSTED_DOCUMENT_CONTENT>>>')) {
    violationsBlocked.push('Escaped leaked boundary markers from untrusted document content.');
    text = text
      .replace(/<<<UNTRUSTED_DOCUMENT_CONTENT>>>/g, '[DOCUMENT_EXCERPT_START]')
      .replace(/<<<\/UNTRUSTED_DOCUMENT_CONTENT>>>/g, '[DOCUMENT_EXCERPT_END]');
  }

  const safetyValidation: SafetyValidationResult = {
    isSafe: true,
    warnings,
    violationsBlocked,
    disclaimerAttached: true,
  };

  return {
    validatedAnswer: text,
    safetyValidation,
  };
}

/**
 * Neutralizes indirect prompt injection strings embedded inside document content
 * before processing in the Q&A pipeline.
 */
export function sanitizeDocumentContentForQA(rawText: string): string {
  // Strip or neutralize common indirect prompt injection payloads embedded in contract text
  return rawText
    .replace(/SYSTEM\s+OVERRIDE\s*:.*/gi, '[FILTERED_ADVERSARIAL_DIRECTIVE]')
    .replace(/IGNORE\s+ALL\s+(PREVIOUS|PRIOR)\s+INSTRUCTIONS.*/gi, '[FILTERED_ADVERSARIAL_DIRECTIVE]')
    .replace(/NOTE\s+TO\s+AI\s*:.*/gi, '[FILTERED_INDIRECT_PROMPT]')
    .replace(/<<<UNTRUSTED_DOCUMENT_CONTENT>>>/g, '[ESCAPED_BOUNDARY]')
    .replace(/<<<\/UNTRUSTED_DOCUMENT_CONTENT>>>/g, '[ESCAPED_BOUNDARY]');
}

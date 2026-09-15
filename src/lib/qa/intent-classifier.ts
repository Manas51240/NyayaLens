import { detectPromptInjectionAttempts } from '../sanitizer';
import { IntentClassificationResult, QueryIntent } from './types';

const LEGAL_STOP_WORDS = new Set([
  'what', 'when', 'where', 'which', 'who', 'how', 'why', 'does', 'do', 'did', 'have', 'has', 'had',
  'this', 'that', 'these', 'those', 'about', 'document', 'documents', 'agreement', 'agreements', 'contract', 'contracts',
  'section', 'sections', 'clause', 'clauses', 'provision', 'provisions',
  'party', 'parties', 'company', 'employee', 'employer', 'tenant', 'landlord', 'provider', 'customer',
  'shall', 'terms', 'rules', 'regarding', 'under', 'there', 'their',
  'with', 'from', 'into', 'been', 'permit', 'allow', 'state', 'entitled', 'receive', 'given', 'take',
  'make', 'apply', 'following', 'amount', 'many', 'much', 'time', 'date', 'late', 'package',
  'the', 'are', 'for', 'any', 'all', 'can', 'not', 'and', 'you', 'your', 'our', 'his', 'her', 'its', 'may', 'per', 'via', 'will',
  'is', 'was', 'were', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'of', 'by', 'as', 'an', 'be', 'so', 'if'
]);

// Deterministic natural-language phrase mapping to core legal constructs
export const NATURAL_LANGUAGE_LEGAL_MAPPINGS: Array<{
  pattern: RegExp;
  expansion: string[];
  intentHint?: QueryIntent;
}> = [
  {
    pattern: /\bleave\s+early\b/i,
    expansion: ['termination', 'terminate', 'cancellation', 'early termination', 'notice'],
    intentHint: 'SPECIFIC_CLAUSE_QUERY',
  },
  {
    pattern: /\b(?:don'?t|do\s+not)\s+comply\b/i,
    expansion: ['breach', 'default', 'cure', 'remedy', 'termination'],
    intentHint: 'RISK_LIABILITY_QUERY',
  },
  {
    pattern: /\bget\s+out\s+of\s+(?:the\s+)?contract\b/i,
    expansion: ['termination', 'cancellation', 'notice', 'expiration'],
    intentHint: 'SPECIFIC_CLAUSE_QUERY',
  },
  {
    pattern: /\bwhat\s+happens\s+if\s+i\s+break\s+(?:it|the\s+contract)\b/i,
    expansion: ['breach', 'default', 'remedies', 'cure', 'termination'],
    intentHint: 'RISK_LIABILITY_QUERY',
  },
  {
    pattern: /\bhow\s+much\s+do\s+i\s+have\s+to\s+pay\b/i,
    expansion: ['payment', 'fee', 'compensation', 'rent', 'invoice', 'penalty'],
    intentHint: 'FINANCIAL_TERMS_QUERY',
  },
  {
    pattern: /\bquit\s+(?:my\s+)?job\b/i,
    expansion: ['termination', 'resignation', 'notice', 'severance'],
    intentHint: 'PARTY_OBLIGATION_QUERY',
  },
  {
    pattern: /\bwork\s+for\s+(?:a\s+)?competitor\b/i,
    expansion: ['non-solicitation', 'non-compete', 'restrictive covenant', 'confidentiality'],
    intentHint: 'SPECIFIC_CLAUSE_QUERY',
  },
  {
    pattern: /\bkick\s+me\s+out\b/i,
    expansion: ['termination', 'default', 'eviction', 'notice'],
    intentHint: 'SPECIFIC_CLAUSE_QUERY',
  },
  {
    pattern: /\blate\s+fee\b/i,
    expansion: ['penalty', 'interest', 'liquidated damages', 'default'],
    intentHint: 'FINANCIAL_TERMS_QUERY',
  },
];

/**
 * Classifies query intent and extracts target topics for evidence retrieval.
 */
export function classifyQueryIntent(question: string): IntentClassificationResult {
  const qClean = question.trim();
  const qLower = qClean.toLowerCase();

  // 1. Prompt Injection Scanning
  const injection = detectPromptInjectionAttempts(qClean);
  if (injection.hasInjectionAttempt) {
    return {
      intent: 'ADVERSARIAL_INJECTION',
      confidence: 100,
      primaryTopics: ['adversarial_injection'],
      extractedEntities: [],
      requiresLegalAdviceDisclaimer: false,
      detectedAdversarialPattern: injection.detectedPatterns[0],
    };
  }

  // 2. Legal Advice Detection
  const advicePatterns = [
    /\bshould\s+i\s+(sign|agree|accept|execute|reject|negotiate)\b/i,
    /\bcan\s+i\s+sue\b/i,
    /\bwill\s+i\s+win\b/i,
    /\bam\s+i\s+(liable|at\s+fault|in\s+breach)\b/i,
    /\bis\s+this\s+(clause\s+)?(legal|illegal|valid|void|enforceable)\b/i,
    /\bwhat\s+should\s+i\s+do\b/i,
    /\badvise\s+me\b/i,
  ];

  const isAdviceRequest = advicePatterns.some((p) => p.test(qLower));

  // Extract primary search topics
  const words = qLower
    .replace(/[-_]/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !LEGAL_STOP_WORDS.has(w));

  const primaryTopics = Array.from(new Set(words));

  // Apply deterministic natural language legal phrase expansion
  let phraseIntentHint: QueryIntent | undefined;
  for (const mapping of NATURAL_LANGUAGE_LEGAL_MAPPINGS) {
    if (mapping.pattern.test(qLower)) {
      if (!phraseIntentHint && mapping.intentHint) {
        phraseIntentHint = mapping.intentHint;
      }
      for (const term of mapping.expansion) {
        if (!primaryTopics.includes(term)) {
          primaryTopics.push(term);
        }
      }
    }
  }

  // Entity extraction heuristic (parties or specific legal roles)
  const extractedEntities: string[] = [];
  if (/\b(tenant|landlord)\b/i.test(qLower)) extractedEntities.push('Tenant/Landlord');
  if (/\b(employee|employer)\b/i.test(qLower)) extractedEntities.push('Employee/Employer');
  if (/\b(disclosing|receiving)\b/i.test(qLower)) extractedEntities.push('Disclosing/Receiving Party');
  if (/\b(customer|provider|vendor)\b/i.test(qLower)) extractedEntities.push('Customer/Provider');

  if (isAdviceRequest) {
    return {
      intent: 'LEGAL_ADVICE_REQUEST',
      confidence: 95,
      primaryTopics,
      extractedEntities,
      requiresLegalAdviceDisclaimer: true,
    };
  }

  // 3. Dates & Timeline Query
  if (/\b(when|date|dates|deadline|expire|expires|expiration|term|duration|renewal|notice\s+period|how\s+long|days\s+prior)\b/i.test(qLower)) {
    return {
      intent: 'DATES_TIMELINE_QUERY',
      confidence: 90,
      primaryTopics,
      extractedEntities,
      requiresLegalAdviceDisclaimer: false,
    };
  }

  // 4. Financial Terms Query
  if (/\b(pay|payment|cost|salary|bonus|rent|fee|fees|clawback|penalty|penalties|liquidated\s+damages|deposit|expense|financial)\b/i.test(qLower)) {
    return {
      intent: 'FINANCIAL_TERMS_QUERY',
      confidence: 90,
      primaryTopics,
      extractedEntities,
      requiresLegalAdviceDisclaimer: false,
    };
  }

  // 5. Risk & Liability Query
  if (/\b(liability|damages|cap|capped|limitation|indemnif|indemnity|hold\s+harmless|risk|breach|remedies)\b/i.test(qLower)) {
    return {
      intent: 'RISK_LIABILITY_QUERY',
      confidence: 90,
      primaryTopics,
      extractedEntities,
      requiresLegalAdviceDisclaimer: false,
    };
  }

  // 6. Party Obligations Query
  if (/\b(must|obligation|obligations|required\s+to|duty|duties|responsible\s+for|can\s+the\s+company|can\s+the\s+tenant)\b/i.test(qLower)) {
    return {
      intent: 'PARTY_OBLIGATION_QUERY',
      confidence: 85,
      primaryTopics,
      extractedEntities,
      requiresLegalAdviceDisclaimer: false,
    };
  }

  // 7. Specific Clause Query
  if (/\b(termination|non-compet[a-z]*|non-solicit[a-z]*|confidential|confidentiality|arbitration|dispute|governing\s+law|jurisdiction|ip|assignment|severability|force\s+majeure)\b/i.test(qLower)) {
    return {
      intent: 'SPECIFIC_CLAUSE_QUERY',
      confidence: 90,
      primaryTopics,
      extractedEntities,
      requiresLegalAdviceDisclaimer: false,
    };
  }

  // 8. General Document Inquiry
  return {
    intent: 'GENERAL_DOCUMENT_INQUIRY',
    confidence: 75,
    primaryTopics,
    extractedEntities,
    requiresLegalAdviceDisclaimer: false,
  };
}

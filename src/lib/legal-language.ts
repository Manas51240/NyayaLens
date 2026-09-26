/**
 * Legal Language & Contractual Modality Analyzer
 *
 * Scans contractual agreements for operative legal language markers:
 * - Mandatory Duties (SHALL, MUST, WILL, IS REQUIRED TO)
 * - Permissive Rights & Discretion (MAY, CAN, IS PERMITTED TO, AT ITS DISCRETION)
 * - Prohibitions & Negative Covenants (SHALL NOT, MUST NOT, MAY NOT)
 * - Conditions & Precedents (SUBJECT TO, PROVIDED THAT, UNLESS, EXCEPT, NOTWITHSTANDING, ONLY IF)
 *
 * Provides objective, structural document analysis regarding operative legal force
 * without rendering formal legal advice.
 */

export type ModalityCategory = 'mandatory' | 'permissive' | 'prohibition' | 'conditional';

export interface ModalityOccurrence {
  id: string;
  term: string;
  category: ModalityCategory;
  categoryLabel: string;
  sentence: string;
  sourceSection: string;
  operativeForceExplanation: string;
  bindingParty?: string;
}

export interface LegalLanguageSummary {
  totalTermsFound: number;
  mandatoryCount: number;
  permissiveCount: number;
  prohibitionCount: number;
  conditionalCount: number;
  termCounts: Record<string, number>;
  occurrences: ModalityOccurrence[];
  disclaimer: string;
}

interface TermDefinition {
  regex: RegExp;
  termDisplay: string;
  category: ModalityCategory;
  categoryLabel: string;
  operativeExplanation: string;
}

const MODALITY_DICTIONARY: TermDefinition[] = [
  // Prohibitions (check first before generic shall/must)
  {
    regex: /\b(?:shall\s+not|must\s+not)\b/gi,
    termDisplay: 'SHALL NOT',
    category: 'prohibition',
    categoryLabel: 'Strict Prohibition',
    operativeExplanation:
      'Creates an absolute negative covenant forbidding the subject from engaging in the specified conduct. Any contravention constitutes a contractual breach.',
  },
  {
    regex: /\b(?:may\s+not)\b/gi,
    termDisplay: 'MAY NOT',
    category: 'prohibition',
    categoryLabel: 'Denial of Permission',
    operativeExplanation:
      'Expressly denies authorization or discretion. Withholds permission from the subject party to perform the described act.',
  },
  // Mandatory Duties
  {
    regex: /\bshall\b/gi,
    termDisplay: 'SHALL',
    category: 'mandatory',
    categoryLabel: 'Mandatory Covenant',
    operativeExplanation:
      'Imposes a strict, legally binding affirmative duty or obligation. In contract drafting, "shall" denotes an unconditional covenant that the obligor must satisfy.',
  },
  {
    regex: /\bmust\b/gi,
    termDisplay: 'MUST',
    category: 'mandatory',
    categoryLabel: 'Mandatory Requirement',
    operativeExplanation:
      'Specifies an imperative prerequisite, standard of compliance, or affirmative duty that leaves no discretion to the obligor.',
  },
  {
    regex: /\b(?:is\s+required\s+to|are\s+required\s+to)\b/gi,
    termDisplay: 'IS REQUIRED TO',
    category: 'mandatory',
    categoryLabel: 'Mandatory Requirement',
    operativeExplanation:
      'Expresses an unavoidable legal requirement or compliance obligation imposed on the designated party.',
  },
  // Permissive Rights & Discretion
  {
    regex: /\bmay\b/gi,
    termDisplay: 'MAY',
    category: 'permissive',
    categoryLabel: 'Permissive Right / Discretion',
    operativeExplanation:
      'Confers a discretionary power, privilege, or option. The designated party is authorized but not legally obligated to exercise this action.',
  },
  {
    regex: /\b(?:can|is\s+permitted\s+to|are\s+permitted\s+to)\b/gi,
    termDisplay: 'PERMITTED TO',
    category: 'permissive',
    categoryLabel: 'Permissive Authorization',
    operativeExplanation:
      'Grants formal consent or authorization to perform the specified action at the party’s sole election.',
  },
  {
    regex: /\b(?:at\s+(?:its|the)\s+discretion|in\s+(?:its|the)\s+discretion)\b/gi,
    termDisplay: 'AT DISCRETION',
    category: 'permissive',
    categoryLabel: 'Sole Discretion',
    operativeExplanation:
      'Authorizes unilateral election or judgment by the entitled party, typically without requirement of mutual consensus unless bad faith is proven.',
  },
  // Conditions & Precedents
  {
    regex: /\bsubject\s+to\b/gi,
    termDisplay: 'SUBJECT TO',
    category: 'conditional',
    categoryLabel: 'Contractual Subordination / Condition',
    operativeExplanation:
      'Subordinates the clause to another condition, agreement, or external standard. Operative rights or duties take effect only upon satisfaction of the condition.',
  },
  {
    regex: /\bprovided\s+that\b/gi,
    termDisplay: 'PROVIDED THAT',
    category: 'conditional',
    categoryLabel: 'Proviso / Qualification',
    operativeExplanation:
      'Introduces an essential limitation, carve-out, or condition precedent that qualifies the preceding obligation or grant.',
  },
  {
    regex: /\bnotwithstanding\b/gi,
    termDisplay: 'NOTWITHSTANDING',
    category: 'conditional',
    categoryLabel: 'Supervening Priority Rule',
    operativeExplanation:
      'Establishes legal supremacy over conflicting provisions. Operates as an override ensuring the specified rule governs despite contradictory terms elsewhere.',
  },
  {
    regex: /\b(?:unless|except)\b/gi,
    termDisplay: 'UNLESS / EXCEPT',
    category: 'conditional',
    categoryLabel: 'Exclusionary Condition',
    operativeExplanation:
      'Identifies a specific exception or condition precedent. If the exception applies, the general contractual covenant or restriction does not govern.',
  },
];

/**
 * Parses raw text into discrete numbered sections or titled clauses
 */
function extractSectionsFromText(rawText: string): Array<{ sectionTitle: string; content: string }> {
  const chunks = rawText
    .split(/(?:\n\s*\n|\n(?=(?:SECTION|ARTICLE|§|[0-9]{1,2}\.)\s*))/i)
    .map((c) => c.trim())
    .filter((c) => c.length > 10);

  const result: Array<{ sectionTitle: string; content: string }> = [];

  for (const chunk of chunks) {
    const firstLine = chunk.split('\n')[0].trim();
    let sectionTitle = 'General Provisions';

    const headerMatch = firstLine.match(/^(?:SECTION|ARTICLE|§|[0-9]{1,2}\.)\s*[^:\n]{2,60}(?=:|$)/i);
    if (headerMatch) {
      sectionTitle = headerMatch[0].trim();
    } else if (/^(?:Client|Service Provider|Effective Date|Term|Jurisdiction)/i.test(firstLine)) {
      sectionTitle = 'Document Header & Parties';
    } else if (firstLine.length < 50 && /^[A-Z][A-Za-z\s]+$/.test(firstLine)) {
      sectionTitle = firstLine;
    }

    result.push({ sectionTitle, content: chunk });
  }

  return result;
}

/**
 * Analyzes contractual language across the document text.
 */
export function analyzeLegalLanguage(rawText: string): LegalLanguageSummary {
  if (!rawText || rawText.trim().length === 0) {
    return {
      totalTermsFound: 0,
      mandatoryCount: 0,
      permissiveCount: 0,
      prohibitionCount: 0,
      conditionalCount: 0,
      termCounts: {},
      occurrences: [],
      disclaimer:
        'Notice: This analysis identifies contractual modality keywords (SHALL, MUST, MAY, etc.) to illustrate document structure. It does not constitute formal legal counsel or legal advice.',
    };
  }

  const sections = extractSectionsFromText(rawText);
  const occurrences: ModalityOccurrence[] = [];
  const termCounts: Record<string, number> = {
    SHALL: 0,
    MUST: 0,
    MAY: 0,
    'SHALL NOT': 0,
    'SUBJECT TO': 0,
    'PROVIDED THAT': 0,
    NOTWITHSTANDING: 0,
    'UNLESS / EXCEPT': 0,
    'IS REQUIRED TO': 0,
    'PERMITTED TO': 0,
    'AT DISCRETION': 0,
    'MAY NOT': 0,
  };

  let idCounter = 1;

  for (const sec of sections) {
    // Split section into sentences
    const sentences = sec.content
      .replace(/([.?!])\s+(?=[A-Z0-9])/g, '$1|__SPLIT__|')
      .split('|__SPLIT__|')
      .map((s) => s.replace(/\s+/g, ' ').trim())
      .filter((s) => s.length > 20);

    for (const sentence of sentences) {
      // Avoid checking demo disclaimers
      if (/DEMO NOTICE|fictional and created solely/i.test(sentence)) continue;

      const matchedInSentence = new Set<string>();

      for (const def of MODALITY_DICTIONARY) {
        // Reset regex state
        def.regex.lastIndex = 0;
        const match = def.regex.exec(sentence);

        if (match) {
          const matchedTerm = match[0].toUpperCase();

          // Don't duplicate "SHALL" if "SHALL NOT" already matched
          if (def.termDisplay === 'SHALL' && matchedInSentence.has('SHALL NOT')) continue;
          if (def.termDisplay === 'MUST' && matchedInSentence.has('MUST NOT')) continue;
          if (def.termDisplay === 'MAY' && matchedInSentence.has('MAY NOT')) continue;

          matchedInSentence.add(def.termDisplay);
          termCounts[def.termDisplay] = (termCounts[def.termDisplay] || 0) + 1;

          // Attempt to detect subject / party
          let bindingParty = undefined;
          if (/\b(?:Service Provider|Provider)\b/i.test(sentence)) {
            bindingParty = 'Service Provider';
          } else if (/\b(?:Client|Customer)\b/i.test(sentence)) {
            bindingParty = 'Client';
          } else if (/\b(?:Each party|Either party|Both parties)\b/i.test(sentence)) {
            bindingParty = 'Mutual (Both Parties)';
          }

          occurrences.push({
            id: `lang-occ-${idCounter++}`,
            term: def.termDisplay,
            category: def.category,
            categoryLabel: def.categoryLabel,
            sentence,
            sourceSection: sec.sectionTitle,
            operativeForceExplanation: def.operativeExplanation,
            bindingParty,
          });
        }
      }
    }
  }

  let mandatoryCount = 0;
  let permissiveCount = 0;
  let prohibitionCount = 0;
  let conditionalCount = 0;

  for (const occ of occurrences) {
    if (occ.category === 'mandatory') mandatoryCount++;
    else if (occ.category === 'permissive') permissiveCount++;
    else if (occ.category === 'prohibition') prohibitionCount++;
    else if (occ.category === 'conditional') conditionalCount++;
  }

  return {
    totalTermsFound: occurrences.length,
    mandatoryCount,
    permissiveCount,
    prohibitionCount,
    conditionalCount,
    termCounts,
    occurrences,
    disclaimer:
      'Notice: This contractual language analysis identifies and categorizes legal modality markers (MAY, MUST, SHALL, etc.) to illustrate operative document structure and obligation density. It does not constitute formal legal counsel or legal advice.',
  };
}

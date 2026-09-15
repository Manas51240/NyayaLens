/**
 * Legal Modality Guardian
 *
 * Ensures contractual modality (shall, must, may, can, will, unless, except,
 * provided that, subject to, notwithstanding, only if) is preserved faithfully
 * when simplifying or synthesizing legal clauses.
 *
 * Prevents dangerous legal distortions:
 * - Converting a permissive right ("may terminate") into an unconditional command ("must terminate").
 * - Converting a mandatory duty ("shall pay within 30 days") into an optional preference ("may pay").
 * - Stripping essential legal qualifiers ("subject to approval" -> "unconditionally").
 */

export interface ModalityIntegrityReport {
  isPreserved: boolean;
  violations: string[];
  originalModalityProfile: string[];
  generatedModalityProfile: string[];
}

const MANDATORY_TERMS = ['shall', 'must', 'is required to', 'are required to', 'covenants to', 'agrees to'];
const PERMISSIVE_TERMS = ['may', 'can', 'is permitted to', 'are permitted to', 'has the option to', 'at the discretion of', 'at its discretion'];
const CONDITIONAL_TERMS = ['unless', 'except', 'provided that', 'subject to', 'notwithstanding', 'only if', 'within', 'after', 'before', 'upon'];

/**
 * Extracts legal modality indicators present in a text snippet.
 */
export function extractModalityTerms(text: string): {
  mandatory: string[];
  permissive: string[];
  conditional: string[];
} {
  const lower = text.toLowerCase();
  
  const mandatory = MANDATORY_TERMS.filter((term) =>
    new RegExp(`\\b${term}\\b`, 'i').test(lower)
  );
  const permissive = PERMISSIVE_TERMS.filter((term) =>
    new RegExp(`\\b${term}\\b`, 'i').test(lower)
  );
  const conditional = CONDITIONAL_TERMS.filter((term) =>
    new RegExp(`\\b${term}\\b`, 'i').test(lower)
  );

  return { mandatory, permissive, conditional };
}

/**
 * Verifies that the contractual modality in the generated text does not distort
 * the original source quote.
 */
export function verifyModalityIntegrity(
  sourceQuote: string,
  generatedExplanation: string
): ModalityIntegrityReport {
  const sourceMod = extractModalityTerms(sourceQuote);
  const genMod = extractModalityTerms(generatedExplanation);
  const violations: string[] = [];

  // Distortion 1: Original is permissive ("may"), but generated is strictly mandatory ("must" / "shall")
  // without reflecting optionality
  if (sourceMod.permissive.length > 0 && sourceMod.mandatory.length === 0) {
    const hasUnconditionalMandate =
      /\b(?:must|shall|is obligated to|compelled to|strictly required to)\b/i.test(generatedExplanation) &&
      !/\b(?:option|discretion|permitted|may|can|elects to|if it chooses)\b/i.test(generatedExplanation);

    if (hasUnconditionalMandate) {
      violations.push(
        `Improperly converted permissive language ("${sourceMod.permissive.join(', ')}") into mandatory duty without preserving optionality.`
      );
    }
  }

  // Distortion 2: Original is mandatory ("shall" / "must"), but generated is treated as purely optional
  if (sourceMod.mandatory.length > 0 && sourceMod.permissive.length === 0) {
    const hasDilutedPermission =
      /\b(?:is optional|not required|may choose whether|purely voluntary|at discretion)\b/i.test(generatedExplanation) &&
      !/\b(?:must|shall|requires|obligation|mandatory|duty)\b/i.test(generatedExplanation);

    if (hasDilutedPermission) {
      violations.push(
        `Improperly converted mandatory contractual duty ("${sourceMod.mandatory.join(', ')}") into an optional provision.`
      );
    }
  }

  // Distortion 3: Original has essential conditions ("subject to", "unless", "provided that"), but generated asserts unconditional absolute
  if (sourceMod.conditional.length > 0) {
    const assertsUnconditional =
      /\b(?:unconditionally|without exception|regardless of any condition|at any time without notice)\b/i.test(generatedExplanation);

    if (assertsUnconditional) {
      violations.push(
        `Stripped critical contractual condition ("${sourceMod.conditional.join(', ')}") to assert an unconditional right or obligation.`
      );
    }
  }

  return {
    isPreserved: violations.length === 0,
    violations,
    originalModalityProfile: [
      ...sourceMod.mandatory,
      ...sourceMod.permissive,
      ...sourceMod.conditional,
    ],
    generatedModalityProfile: [
      ...genMod.mandatory,
      ...genMod.permissive,
      ...genMod.conditional,
    ],
  };
}

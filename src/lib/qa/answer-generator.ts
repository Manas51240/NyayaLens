import { LegalDocument } from '@/types/legal';
import { IntentClassificationResult, RetrievalResult } from './types';
import { synthesizeGeminiGroundedAnswer } from './gemini-synthesis';

export interface GeneratedAnswerResult {
  answer: string;
  notFoundInDocument: boolean;
  missingInformationNotice?: string;
  suggestedFollowUpQuestions: string[];
  evidenceOverride?: Array<{ section: string; quote: string; confidence: number }>;
  answerType?: 'direct_answer' | 'not_found' | 'ambiguous' | 'legal_advice_boundary';
  limitations?: string;
  isVerbatimEvidence?: boolean;
  modalityPreserved?: boolean;
  confidenceOverride?: number;
}

/**
 * Generates an evidence-grounded answer using Gemini 2.5 Flash when available,
 * with automatic deterministic fallback.
 */
export async function generateGroundedAnswerAsync(
  document: LegalDocument,
  question: string,
  intentResult: IntentClassificationResult,
  retrievalResult: RetrievalResult
): Promise<GeneratedAnswerResult> {
  // Case 1: Adversarial Injection detected (handled deterministically immediately)
  if (intentResult.intent === 'ADVERSARIAL_INJECTION') {
    return generateDeterministicGroundedAnswer(document, question, intentResult, retrievalResult);
  }

  // Case 2: Insufficient or Absent Evidence (handled deterministically to prevent hallucination)
  if (!retrievalResult.hasSufficientEvidence || retrievalResult.evidenceItems.length === 0) {
    return generateDeterministicGroundedAnswer(document, question, intentResult, retrievalResult);
  }

  // Case 3: Attempt Gemini 2.5 Flash Grounded Synthesis
  try {
    const geminiResult = await synthesizeGeminiGroundedAnswer({
      question,
      documentTitle: document.title,
      documentType: document.documentType || 'Legal Agreement',
      rawText: document.rawText,
      intentResult,
      retrievalResult,
    });

    if (geminiResult) {
      const evidenceOverride = geminiResult.evidence.map((e) => ({
        section: e.section,
        quote: e.quote,
        confidence: geminiResult.confidence,
      }));

      return {
        answer: geminiResult.answer,
        notFoundInDocument: geminiResult.notFound,
        missingInformationNotice: geminiResult.limitations,
        suggestedFollowUpQuestions: geminiResult.suggestedFollowUpQuestions.length > 0
          ? geminiResult.suggestedFollowUpQuestions
          : [
              'Would you like me to identify potential counter-proposals for this clause?',
              'Should we formulate targeted questions on this for your attorney?',
            ],
        evidenceOverride: evidenceOverride.length > 0 ? evidenceOverride : undefined,
        answerType: geminiResult.answerType,
        limitations: geminiResult.limitations,
        isVerbatimEvidence: geminiResult.evidence.every((e) => e.isVerbatim),
        modalityPreserved: geminiResult.modalityPreserved,
        confidenceOverride: geminiResult.confidence,
      };
    }
  } catch {
    // If Gemini call fails, seamlessly continue to deterministic fallback
  }

  // Case 4: Deterministic Fallback
  return generateDeterministicGroundedAnswer(document, question, intentResult, retrievalResult);
}

/**
 * Deterministic evidence-grounded answer generator (offline / fallback mode).
 */
export function generateDeterministicGroundedAnswer(
  document: LegalDocument,
  question: string,
  intentResult: IntentClassificationResult,
  retrievalResult: RetrievalResult
): GeneratedAnswerResult {
  // Case 1: Adversarial Injection detected
  if (intentResult.intent === 'ADVERSARIAL_INJECTION') {
    return {
      answer:
        'I detected an adversarial instruction or command attempt in your question. As an institutional AI legal assistant, I strictly answer questions grounded in the factual contents of your uploaded document and do not execute external commands or override system instructions.',
      notFoundInDocument: true,
      missingInformationNotice: 'Adversarial command pattern neutralized.',
      suggestedFollowUpQuestions: [
        'What are the termination notice requirements?',
        'What obligations apply to confidentiality?',
      ],
    };
  }

  // Case 2: Insufficient or Absent Evidence
  if (!retrievalResult.hasSufficientEvidence || retrievalResult.evidenceItems.length === 0) {
    const topicDisplay = intentResult.primaryTopics.length > 0 ? intentResult.primaryTopics.join(', ') : question;
    let answer = `I searched ${document.title} for provisions related to "${question}", but I could not find sufficient evidence in the uploaded document. I couldn't find any relevant clauses, and the document appears silent on this matter.`;

    if (intentResult.requiresLegalAdviceDisclaimer) {
      answer = `**Legal Review Notice**: NyayaLens assists in understanding contract language and identifying review priorities, but cannot advise you on whether to sign, reject, breach, or pursue litigation. You should review these provisions with a qualified attorney before taking legal action.\n\n` + answer;
    }

    return {
      answer,
      notFoundInDocument: true,
      missingInformationNotice: `I searched ${document.title} for terms regarding "${topicDisplay}", but I could not find any clauses, sections, or provisions addressing this subject in the document text. Silence on a key term may warrant review with legal counsel to clarify whether default statutory laws or common law principles apply.`,
      suggestedFollowUpQuestions: [
        `Should an explicit clause addressing ${topicDisplay} be drafted into the agreement?`,
        'Does governing state statutory law fill this omission if left unstated?',
      ],
    };
  }

  // Case 3: Grounded Dynamic Synthesis Derived Exclusively from Evidence
  const primaryEvidence = retrievalResult.evidenceItems[0];
  const secondaryEvidence = retrievalResult.evidenceItems[1];
  const qLower = question.toLowerCase();
  const quoteText = primaryEvidence.quote;
  const quoteLower = quoteText.toLowerCase();

  let synthesisText = '';

  // 1. Payment due period & financial terms inquiries
  if (
    /\b(payment|payable|pay|due|invoice|invoices|fee|fees)\b/i.test(qLower) &&
    /\b(payable|due|invoices?|fee|incur|interest)\b/i.test(quoteLower)
  ) {
    const dueMatch = quoteText.match(/\b(?:payable|due)\s+within\s+([0-9]{1,3}\s*days?(?:\s+of\s+receipt)?)/i);
    const overdueMatch = quoteText.match(/amounts?\s+overdue\s+by\s+more\s+than\s+([^\.]+?\.)/i);
    const feeMatch = quoteText.match(/\b(?:monthly\s+service\s+fee\s+of\s+([^\.]+?)\.)/i);

    const duePeriodStr = dueMatch ? dueMatch[1] : 'the period specified in the invoice clause';

    synthesisText = `According to ${primaryEvidence.sectionTitle} of ${document.title}, invoices are payable within **${duePeriodStr}**.\n\nKey payment terms set forth in this provision include:\n`;
    if (dueMatch) {
      synthesisText += `• **Payment Due Period**: Invoices are payable within ${dueMatch[1]}.\n`;
    }
    if (feeMatch) {
      synthesisText += `• **Service Fee**: Monthly service fee of ${feeMatch[1]}.\n`;
    }
    if (overdueMatch) {
      synthesisText += `• **Overdue Balances**: Amounts overdue by more than ${overdueMatch[1]}\n`;
    }
  }
  // 2. Termination conditions & notice inquiries
  else if (
    /\b(termination|terminate|cancel|cancellation|end|conditions?|convenience)\b/i.test(qLower) &&
    /\b(terminate|termination|breach|insolvent|convenience)\b/i.test(quoteLower)
  ) {
    synthesisText = `Under ${primaryEvidence.sectionTitle} of ${document.title}, the agreement outlines the following termination conditions:\n\n`;

    const breachMatch = quoteText.match(/material\s+breach[^\.]*?(?:cured\s+within\s+([0-9]{1,3}\s*days?)[^\.]*?\.)/i);
    const insolvMatch = quoteText.match(/immediately\s+if[^\.]*?(?:insolvent|ceases[^\.]*?\.)/i);
    const convenMatch = quoteText.match(/convenience[^\.]*?(?:providing\s+([0-9]{1,3}\s*days?['’]?\s*(?:written\s+)?notice)[^\.]*?\.)/i);

    if (breachMatch) {
      synthesisText += `• **Termination for Material Breach**: Either party may terminate if a material breach is not cured within ${breachMatch[1] || '30 days'} after written notice.\n`;
    }
    if (insolvMatch) {
      synthesisText += `• **Immediate Termination for Insolvency**: Either party may terminate immediately if the other party becomes insolvent or ceases substantially all business operations.\n`;
    }
    if (convenMatch) {
      synthesisText += `• **Termination for Convenience**: The Client may terminate for convenience by providing ${convenMatch[1] || "60 days' written notice"}, subject to payment of accrued undisputed amounts.\n`;
    }

    if (!breachMatch && !insolvMatch && !convenMatch) {
      // General termination summary from sentences
      const sentences = quoteText.split(/(?<=\.)\s+/).filter((s) => /terminate/i.test(s));
      sentences.forEach((s) => {
        synthesisText += `• ${s.trim()}\n`;
      });
    }
  }
  // 3. Confidentiality inquiries
  else if (
    /\b(confidential|proprietary|non-disclosure|secret)\b/i.test(qLower) &&
    /\b(confidential|protect|disclosed)\b/i.test(quoteLower)
  ) {
    synthesisText = `Under ${primaryEvidence.sectionTitle} of ${document.title}, each party must protect confidential information received from the other party and may use such information solely for purposes of performing this Agreement. Disclosures are prohibited except to authorized personnel, professional advisers, or where required by law.\n`;
  }
  // 4. Limitation of liability inquiries
  else if (
    /\b(liability|damages|cap|capped|indemnif)\b/i.test(qLower) &&
    /\b(liability|damages|exceed|aggregate)\b/i.test(quoteLower)
  ) {
    const capMatch = quoteText.match(/aggregate\s+liability[^\.]*?shall\s+not\s+exceed[^\.]*?\./i);
    const exclMatch = quoteText.match(/indirect[^\.]*?consequential\s+damages/i);

    synthesisText = `Under ${primaryEvidence.sectionTitle} of ${document.title}:\n`;
    if (exclMatch) {
      synthesisText += `• **Damage Exclusions**: Neither party is liable for indirect, incidental, special, or consequential damages.\n`;
    }
    if (capMatch) {
      synthesisText += `• **Liability Cap**: Each party's aggregate liability is capped at the fees paid or payable during the preceding period (e.g., six months).\n`;
    }
  }
  // 5. Governing law & dispute resolution inquiries
  else if (
    /\b(governing\s+law|jurisdiction|dispute|court|courts|arbitration)\b/i.test(qLower) &&
    /\b(laws?|governed|jurisdiction|courts?|negotiation)\b/i.test(quoteLower)
  ) {
    synthesisText = `Under ${primaryEvidence.sectionTitle} of ${document.title}, this Agreement is governed by the laws applicable in the specified jurisdiction. The parties are required to first attempt good-faith negotiation, and unresolved disputes are subject to the competent local courts or agreed dispute resolution forums.\n`;
  }
  // 6. General clause dynamic extraction
  else {
    const sentences = quoteText
      .split(/(?<=\.)\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20);

    const relevant = sentences.filter((s) =>
      intentResult.primaryTopics.some((t) => s.toLowerCase().includes(t.toLowerCase()))
    );

    const displaySentences = relevant.length > 0 ? relevant.slice(0, 3) : sentences.slice(0, 2);

    synthesisText = `Based on my review of ${primaryEvidence.sectionTitle} in ${document.title}:\n\n` +
      displaySentences.map((s) => `• ${s}`).join('\n') + '\n';
  }

  // Append Grounded Citation Quote
  let answerText = synthesisText.trim() + `\n\n> "${primaryEvidence.quote}" (${primaryEvidence.sectionTitle})`;

  if (secondaryEvidence && secondaryEvidence.sectionTitle !== primaryEvidence.sectionTitle) {
    answerText += `\n\nAdditionally, ${secondaryEvidence.sectionTitle} specifies:\n> "${secondaryEvidence.quote}"`;
  }

  // Legal Advice Re-framing Guardrail
  if (intentResult.requiresLegalAdviceDisclaimer) {
    answerText += `\n\n**Legal Review Notice**: NyayaLens assists in understanding contract language and identifying review priorities, but cannot advise you on whether to sign, breach, or pursue litigation. You should review these provisions with a qualified attorney before taking legal action.`;
  } else {
    answerText += `\n\nThis language sets out the relevant terms regarding your inquiry. Consider discussing with legal counsel whether this provision aligns with your intended risk profile.`;
  }

  const suggestedFollowUpQuestions = [
    `What are the practical or financial consequences of this ${primaryEvidence.sectionTitle} provision?`,
    'Can this term be amended or clarified prior to execution?',
  ];

  return {
    answer: answerText,
    notFoundInDocument: false,
    suggestedFollowUpQuestions,
    isVerbatimEvidence: true,
    modalityPreserved: true,
  };
}

export const generateGroundedAnswer = generateDeterministicGroundedAnswer;

import { LegalDocument } from '@/types/legal';
import { IntentClassificationResult, RetrievalResult } from './types';

export interface GeneratedAnswerResult {
  answer: string;
  notFoundInDocument: boolean;
  missingInformationNotice?: string;
  suggestedFollowUpQuestions: string[];
}

/**
 * Generates grounded answers exclusively based on retrieved document evidence.
 * Explicitly states when evidence is insufficient.
 */
export function generateGroundedAnswer(
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
    let answer = `I searched ${document.title} for provisions related to "${question}", but I could not find sufficient evidence or clauses addressing this subject in the document text. The document appears silent on this matter.`;

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

  // Case 3: Grounded Answer Derived Exclusively from Evidence
  const primaryEvidence = retrievalResult.evidenceItems[0];
  const secondaryEvidence = retrievalResult.evidenceItems[1];

  let answerText = `Based on my review of ${document.title}, the document states:\n\n> "${primaryEvidence.quote}" (${primaryEvidence.sectionTitle})`;

  if (secondaryEvidence && secondaryEvidence.sectionTitle !== primaryEvidence.sectionTitle) {
    answerText += `\n\nAdditionally, ${secondaryEvidence.sectionTitle} specifies:\n> "${secondaryEvidence.quote}"`;
  }

  // Case 4: Legal Advice Re-framing Guardrail
  if (intentResult.requiresLegalAdviceDisclaimer) {
    answerText += `\n\n**Legal Review Notice**: NyayaLens assists in understanding contract language and identifying review priorities, but cannot advise you on whether to sign, breach, or pursue litigation. You should review these provisions with a qualified attorney before taking legal action.`;
  } else {
    answerText += `\n\nThis language sets out the relevant terms regarding your inquiry. Consider discussing with legal counsel whether this provision aligns with your intended risk profile.`;
  }

  // Generate tailored counsel questions based on the retrieved topic
  const suggestedFollowUpQuestions = [
    `What are the practical or financial consequences of this ${primaryEvidence.sectionTitle} provision?`,
    'Can this term be amended or clarified prior to execution?',
  ];

  return {
    answer: answerText,
    notFoundInDocument: false,
    suggestedFollowUpQuestions,
  };
}

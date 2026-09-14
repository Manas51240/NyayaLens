import { LegalDocument } from '@/types/legal';
import { GroundedQAResponse } from './types';
import { classifyQueryIntent } from './intent-classifier';
import { retrieveEvidence } from './retriever';
import { generateGroundedAnswer } from './answer-generator';
import { calculateGroundedConfidence } from './confidence-calculator';
import {
  validateQASafety,
  sanitizeDocumentContentForQA,
  LEGAL_DISCLAIMER_NOTICE,
} from './safety-validator';

/**
 * Full Evidence-Grounded Document Q&A Pipeline:
 * question
 * → intent classification
 * → retrieval
 * → relevant evidence
 * → AI answer
 * → evidence references
 * → confidence
 * → safety validation
 */
export async function runGroundedQAPipeline(
  document: LegalDocument,
  question: string
): Promise<GroundedQAResponse> {
  const cleanQuestion = question.trim();

  // 1. Intent Classification
  const intentResult = classifyQueryIntent(cleanQuestion);

  // 2. Document Content Sanitization & Prompt Injection Protection
  const sanitizedRawText = sanitizeDocumentContentForQA(document.rawText);
  const secureDoc: LegalDocument = {
    ...document,
    rawText: sanitizedRawText,
  };

  // 3. Evidence Retrieval
  const retrievalResult = retrieveEvidence(secureDoc, intentResult);

  // 4. Grounded AI Answer Generation (Constrained to Evidence)
  const answerResult = generateGroundedAnswer(
    secureDoc,
    cleanQuestion,
    intentResult,
    retrievalResult
  );

  // 5. Evidence References & Confidence Scoring
  const { confidence, evidenceReferences } = calculateGroundedConfidence(
    retrievalResult,
    answerResult.notFoundInDocument
  );

  // 6. Safety Validation & Legal Guardrail Enforcement
  const { validatedAnswer, safetyValidation } = validateQASafety(answerResult.answer);

  return {
    question: cleanQuestion,
    intent: intentResult,
    retrieval: retrievalResult,
    answer: validatedAnswer,
    groundedEvidence: evidenceReferences,
    notFoundInDocument: answerResult.notFoundInDocument,
    missingInformationNotice: answerResult.missingInformationNotice,
    suggestedFollowUpQuestions: answerResult.suggestedFollowUpQuestions,
    confidence,
    safetyValidation,
    safetyDisclaimer: LEGAL_DISCLAIMER_NOTICE,
  };
}

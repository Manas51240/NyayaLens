import { LegalDocument } from '@/types/legal';
import { GroundedQAResponse } from './types';
import { classifyQueryIntent } from './intent-classifier';
import { retrieveEvidence } from './retriever';
import { generateGroundedAnswerAsync } from './answer-generator';
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
 * → AI answer (Gemini 2.5 Flash synthesis with strict schema & fallback)
 * → evidence verification
 * → confidence calculation
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

  // 3. Evidence Retrieval (Deterministic multi-stage retrieval of top chunks)
  const retrievalResult = retrieveEvidence(secureDoc, intentResult);

  // 4. Grounded AI Answer Generation (Gemini 2.5 Flash when available + deterministic fallback)
  const answerResult = await generateGroundedAnswerAsync(
    secureDoc,
    cleanQuestion,
    intentResult,
    retrievalResult
  );

  // 5. Evidence References & Confidence Scoring
  let finalEvidence = answerResult.evidenceOverride;
  let finalConfidence = 0;

  if (!finalEvidence || finalEvidence.length === 0) {
    const { confidence, evidenceReferences } = calculateGroundedConfidence(
      retrievalResult,
      answerResult.notFoundInDocument
    );
    finalConfidence = answerResult.confidenceOverride !== undefined
      ? answerResult.confidenceOverride
      : confidence;
    finalEvidence = evidenceReferences;
  } else {
    finalConfidence = answerResult.confidenceOverride ?? 85;
  }

  // 6. Safety Validation & Legal Guardrail Enforcement
  const { validatedAnswer, safetyValidation } = validateQASafety(answerResult.answer);

  return {
    question: cleanQuestion,
    intent: intentResult,
    retrieval: retrievalResult,
    answer: validatedAnswer,
    groundedEvidence: finalEvidence,
    notFoundInDocument: answerResult.notFoundInDocument,
    missingInformationNotice: answerResult.missingInformationNotice,
    suggestedFollowUpQuestions: answerResult.suggestedFollowUpQuestions,
    confidence: finalConfidence,
    safetyValidation,
    safetyDisclaimer: LEGAL_DISCLAIMER_NOTICE,
    answerType: answerResult.answerType,
    limitations: answerResult.limitations,
    isVerbatimEvidence: answerResult.isVerbatimEvidence,
    modalityPreserved: answerResult.modalityPreserved,
  };
}

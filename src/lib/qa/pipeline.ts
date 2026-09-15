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

import { getCachedQAResponse, setCachedQAResponse } from './qa-cache';
import { getOrBuildDocumentIndex } from './document-indexer';

/**
 * Full Evidence-Grounded Document Q&A Pipeline:
 * question
 * → cache check (immediate 0ms response on identical repeated query)
 * → intent classification
 * → retrieval via DocumentIndex
 * → relevant evidence
 * → AI answer (Gemini 2.5 Flash synthesis with strict schema & fallback)
 * → evidence verification
 * → confidence calculation
 * → safety validation
 * → cache store
 */
export async function runGroundedQAPipeline(
  document: LegalDocument,
  question: string
): Promise<GroundedQAResponse> {
  const cleanQuestion = question.trim();

  // 0. High-efficiency deduplication check: return cached verified response if available
  const cachedResponse = getCachedQAResponse(document, cleanQuestion);
  if (cachedResponse) {
    return cachedResponse;
  }

  // 1. Intent Classification
  const intentResult = classifyQueryIntent(cleanQuestion);

  // 2. Document Content Sanitization & Prompt Injection Protection via DocumentIndex
  const docIndex = getOrBuildDocumentIndex(document);
  const secureDoc: LegalDocument = {
    ...document,
    rawText: docIndex.sanitizedRawText,
  };

  // 3. Evidence Retrieval (Deterministic multi-stage retrieval using pre-indexed chunks)
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

  const finalResponse: GroundedQAResponse = {
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

  // Cache verified response for high-efficiency request deduplication
  setCachedQAResponse(document, cleanQuestion, finalResponse);

  return finalResponse;
}

import { GroundedEvidence, AskDocumentResponse } from '@/types/legal';

export type QueryIntent =
  | 'SPECIFIC_CLAUSE_QUERY'
  | 'PARTY_OBLIGATION_QUERY'
  | 'DATES_TIMELINE_QUERY'
  | 'FINANCIAL_TERMS_QUERY'
  | 'RISK_LIABILITY_QUERY'
  | 'LEGAL_ADVICE_REQUEST'
  | 'GENERAL_DOCUMENT_INQUIRY'
  | 'ADVERSARIAL_INJECTION';

export interface IntentClassificationResult {
  intent: QueryIntent;
  confidence: number; // 0 to 100
  primaryTopics: string[];
  extractedEntities: string[];
  requiresLegalAdviceDisclaimer: boolean;
  detectedAdversarialPattern?: string;
}

export interface RetrievedEvidenceItem {
  id: string;
  quote: string;
  sectionTitle: string;
  sectionId?: string;
  startLine?: number;
  endLine?: number;
  relevanceScore: number; // 0 to 1
  matchType: 'exact' | 'semantic' | 'keyword';
  tokenCount: number;
}

export interface RetrievalResult {
  query: string;
  evidenceItems: RetrievedEvidenceItem[];
  hasSufficientEvidence: boolean;
  searchExplanation?: string;
}

export interface SafetyValidationResult {
  isSafe: boolean;
  warnings: string[];
  violationsBlocked: string[];
  disclaimerAttached: boolean;
}

export interface GroundedQAResponse extends AskDocumentResponse {
  intent: IntentClassificationResult;
  retrieval: RetrievalResult;
  confidence: number;
  safetyValidation: SafetyValidationResult;
}

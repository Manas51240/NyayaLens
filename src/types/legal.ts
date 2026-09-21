export type RiskCategory =
  | 'termination'
  | 'payment'
  | 'liability'
  | 'renewal'
  | 'confidentiality'
  | 'privacy/data'
  | 'dispute resolution'
  | 'restrictive covenants'
  | 'penalties'
  | 'unusual obligations';

export type RiskSeverity = 'high' | 'medium' | 'low' | 'informational';

export interface SourceReference {
  section: string;
  pageOrRef?: string;
  exactQuote: string;
  confidence: number; // 0 to 100
}

export interface LegalRisk {
  id: string;
  category: RiskCategory;
  severity: RiskSeverity;
  title: string;
  explanation: string;
  sourceSection: string;
  pageOrRef?: string;
  quote: string;
  confidence: number; // 0 to 100
  reviewRecommendation: string;
  suggestedQuestionForLawyer: string;
}

export interface ImportantClause {
  id: string;
  title: string;
  category: string;
  originalText: string;
  plainEnglishTranslation: string;
  sourceSection: string;
  pageOrRef?: string;
  severity: RiskSeverity;
  confidence: number;
  suggestedAction: string;
}

export interface LegalObligation {
  id: string;
  party: string;
  description: string;
  deadline?: string;
  isRecurring: boolean;
  frequency?: string;
  consequences?: string;
  sourceSection: string;
}

export interface ActionItem {
  id: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  timeline?: string;
  category: string;
  suggestedQuestionsForLawyer: string[];
  documentsToGather?: string[];
  responsibleParty?: string;
  sourceClause?: string;
  noticePeriod?: string;
  status?: 'pending' | 'in_progress' | 'completed';
}

export interface ConsultationBrief {
  documentPurpose: string;
  parties: { name: string; role: string }[];
  governingLawAndJurisdiction: string;
  keyBusinessTerms: string[];
  highPriorityConcerns: string[];
  questionsForCounsel: { topic: string; question: string; rationale: string }[];
  relevantSectionsToHighlight: string[];
  disclaimerNotice: string;
}

export interface LegalDocument {
  id: string;
  title: string;
  fileName: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'md';
  fileSize: number;
  uploadedAt: string;
  rawText: string;
  documentType: string;
  parties: { name: string; role: string }[];
  effectiveDate?: string;
  expirationDate?: string;
  jurisdiction?: string;
  plainLanguageSummary: string;
  keyDates: { label: string; date: string; isCritical: boolean }[];
  clauses: ImportantClause[];
  obligations: LegalObligation[];
  risks: LegalRisk[];
  actionItems: ActionItem[];
  consultationBrief: ConsultationBrief;
  tags?: string[];
}

export interface GroundedEvidence {
  quote: string;
  section: string;
  confidence: number;
}

export interface AskDocumentResponse {
  question: string;
  answer: string;
  groundedEvidence: GroundedEvidence[];
  notFoundInDocument: boolean;
  missingInformationNotice?: string;
  suggestedFollowUpQuestions: string[];
  safetyDisclaimer: string;
  confidence?: number;
  answerType?: 'direct_answer' | 'not_found' | 'ambiguous' | 'legal_advice_boundary';
  limitations?: string;
  isVerbatimEvidence?: boolean;
  modalityPreserved?: boolean;
}

export type ReviewPriority = 'high' | 'medium' | 'low' | 'neutral';

export interface SemanticDeltaItem {
  id: string;
  category: 'changed_terms' | 'dates' | 'obligations' | 'payment' | 'termination' | 'liability' | 'renewal' | 'confidentiality' | 'dispute_provisions';
  title: string;
  description: string;
  docAContent: string;
  docBContent: string;
  sourceRefA?: string;
  sourceRefB?: string;
  quoteA?: string;
  quoteB?: string;
  reviewPriority: ReviewPriority;
  objectiveExplanation: string;
  counselDiscussionPrompt?: string;
}

export interface ComparisonCategoryDelta {
  category: 'changed_terms' | 'dates' | 'obligations' | 'payment' | 'termination' | 'liability' | 'renewal' | 'confidentiality' | 'dispute_provisions';
  categoryLabel: string;
  hasDeltas: boolean;
  deltaCount: number;
  maxReviewPriority: ReviewPriority;
  summary: string;
  items: SemanticDeltaItem[];
}

export interface ComparisonItemChange {
  title: string;
  category: string;
  docAContent: string;
  docBContent: string;
  riskImpact: 'increases_risk' | 'decreases_risk' | 'neutral';
  explanation: string;
  recommendation: string;
  sourceRefA?: string;
  sourceRefB?: string;
  reviewPriority?: ReviewPriority;
}

export interface ComparisonResult {
  docA: { id: string; title: string };
  docB: { id: string; title: string };
  executiveSummary: string;
  overallRiskShift: 'higher_for_user' | 'lower_for_user' | 'balanced_shift';
  reviewPrioritySummary: 'high_review_priority' | 'medium_review_priority' | 'routine_variations';
  additions: string[];
  removals: string[];
  changedClauses: ComparisonItemChange[];
  changedDates: { description: string; docA: string; docB: string; sourceRefA?: string; sourceRefB?: string }[];
  changedFinancialObligations: { description: string; docA: string; docB: string; sourceRefA?: string; sourceRefB?: string }[];
  changedTerminationRights: { description: string; docA: string; docB: string; sourceRefA?: string; sourceRefB?: string }[];
  changedLiabilityProvisions: { description: string; docA: string; docB: string; sourceRefA?: string; sourceRefB?: string }[];
  changedRenewalProvisions: { description: string; docA: string; docB: string; sourceRefA?: string; sourceRefB?: string }[];
  categoryDeltas: {
    changedTerms: ComparisonCategoryDelta;
    dates: ComparisonCategoryDelta;
    obligations: ComparisonCategoryDelta;
    payment: ComparisonCategoryDelta;
    termination: ComparisonCategoryDelta;
    liability: ComparisonCategoryDelta;
    renewal: ComparisonCategoryDelta;
    confidentiality: ComparisonCategoryDelta;
    disputeProvisions: ComparisonCategoryDelta;
  };
  actionItemsForReview: string[];
  legalDisclaimer: string;
}

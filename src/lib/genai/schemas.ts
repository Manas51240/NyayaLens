import { z } from 'zod';

export const RiskCategoryEnum = z.enum([
  'termination',
  'payment',
  'liability',
  'renewal',
  'confidentiality',
  'privacy/data',
  'dispute resolution',
  'restrictive covenants',
  'penalties',
  'unusual obligations',
]);

export const RiskSeverityEnum = z.enum(['high', 'medium', 'low', 'informational']);

export const LegalPartySchema = z.object({
  name: z.string().min(1, 'Party name cannot be empty'),
  role: z.string().min(1, 'Party role cannot be empty'),
});

export const DocumentClassificationSchema = z.object({
  documentType: z.string().min(2, 'Document type must be specified'),
  title: z.string().min(2, 'Document title must be specified'),
  confidence: z.number().min(0).max(100),
  reasoning: z.string().min(5, 'Reasoning must be provided'),
  evidenceQuote: z.string().min(5, 'Classification must reference document evidence'),
});

export const GroundedKeyDateSchema = z.object({
  label: z.string().min(2, 'Date label is required'),
  date: z.string().min(2, 'Date value is required'),
  isCritical: z.boolean(),
  sourceSection: z.string().optional(),
  evidenceQuote: z.string().optional(),
});

export const GroundedClauseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2, 'Clause title is required'),
  category: z.string().min(2, 'Clause category is required'),
  originalText: z.string().min(5, 'Original verbatim clause text must be provided as evidence'),
  plainEnglishTranslation: z.string().min(5, 'Plain English translation is required'),
  sourceSection: z.string().min(1, 'Source section reference is required'),
  pageOrRef: z.string().optional(),
  severity: RiskSeverityEnum,
  confidence: z.number().min(0).max(100),
  suggestedAction: z.string().min(5, 'Suggested action is required'),
});

export const GroundedObligationSchema = z.object({
  id: z.string().min(1),
  party: z.string().min(1, 'Obligated party must be identified'),
  description: z.string().min(5, 'Obligation description is required'),
  deadline: z.string().optional(),
  isRecurring: z.boolean(),
  frequency: z.string().optional(),
  consequences: z.string().optional(),
  sourceSection: z.string().min(1, 'Source section reference is required'),
  evidenceQuote: z.string().optional(),
});

export const GroundedRiskSchema = z.object({
  id: z.string().min(1),
  category: RiskCategoryEnum,
  severity: RiskSeverityEnum,
  title: z.string().min(2, 'Risk title is required'),
  explanation: z.string().min(5, 'Risk explanation is required'),
  sourceSection: z.string().min(1, 'Source section reference is required'),
  pageOrRef: z.string().optional(),
  quote: z.string().min(5, 'Verbatim contract quote must be provided as grounding evidence'),
  confidence: z.number().min(0).max(100),
  reviewRecommendation: z.string().min(5, 'Review recommendation is required'),
  suggestedQuestionForLawyer: z.string().min(5, 'Suggested question for lawyer is required'),
});

export const ActionItemSchema = z.object({
  id: z.string().min(1),
  priority: z.enum(['high', 'medium', 'low']),
  action: z.string().min(5, 'Action description is required'),
  timeline: z.string().optional(),
  category: z.string().min(2, 'Category is required'),
  suggestedQuestionsForLawyer: z.array(z.string()),
  documentsToGather: z.array(z.string()).optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
});

export const ConsultationBriefSchema = z.object({
  documentPurpose: z.string().min(5),
  parties: z.array(LegalPartySchema),
  governingLawAndJurisdiction: z.string().min(2),
  keyBusinessTerms: z.array(z.string()),
  highPriorityConcerns: z.array(z.string()),
  questionsForCounsel: z.array(
    z.object({
      topic: z.string(),
      question: z.string(),
      rationale: z.string(),
    })
  ),
  relevantSectionsToHighlight: z.array(z.string()),
  disclaimerNotice: z.string(),
});

export const AbsenceRecordSchema = z.object({
  topic: z.string(),
  notFound: z.literal(true),
  missingInformationNotice: z.string(),
  searchTermsChecked: z.array(z.string()),
  reviewAdvice: z.string(),
});

export const GroundedEvidenceSchema = z.object({
  quote: z.string().min(5, 'Grounded evidence must contain a verbatim quote'),
  section: z.string().min(1, 'Section reference is required'),
  confidence: z.number().min(0).max(100),
});

export const AskDocumentResponseSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(5),
  groundedEvidence: z.array(GroundedEvidenceSchema),
  notFoundInDocument: z.boolean(),
  missingInformationNotice: z.string().optional(),
  suggestedFollowUpQuestions: z.array(z.string()),
  safetyDisclaimer: z.string(),
});

export const CompleteDocumentAnalysisSchema = z.object({
  documentType: z.string(),
  parties: z.array(LegalPartySchema),
  effectiveDate: z.string().optional(),
  expirationDate: z.string().optional(),
  jurisdiction: z.string(),
  plainLanguageSummary: z.string(),
  keyDates: z.array(GroundedKeyDateSchema),
  clauses: z.array(GroundedClauseSchema),
  obligations: z.array(GroundedObligationSchema),
  risks: z.array(GroundedRiskSchema),
  actionItems: z.array(ActionItemSchema),
  consultationBrief: ConsultationBriefSchema,
});

export type DocumentClassification = z.infer<typeof DocumentClassificationSchema>;
export type GroundedKeyDate = z.infer<typeof GroundedKeyDateSchema>;
export type GroundedClause = z.infer<typeof GroundedClauseSchema>;
export type GroundedObligation = z.infer<typeof GroundedObligationSchema>;
export type GroundedRisk = z.infer<typeof GroundedRiskSchema>;
export type AbsenceRecord = z.infer<typeof AbsenceRecordSchema>;
export type CompleteDocumentAnalysis = z.infer<typeof CompleteDocumentAnalysisSchema>;

import { LegalDocument, ReviewPriority, SemanticDeltaItem, ComparisonCategoryDelta } from '@/types/legal';

export interface ExtractedFeature {
  dimension: 'changed_terms' | 'dates' | 'obligations' | 'payment' | 'termination' | 'liability' | 'renewal' | 'confidentiality' | 'dispute_provisions';
  title: string;
  sourceSection: string;
  verbatimSnippet: string;
  normalizedValue: string;
  attributes: Record<string, string | number | boolean>;
}

export interface DocumentFeatureProfile {
  docId: string;
  title: string;
  features: ExtractedFeature[];
}

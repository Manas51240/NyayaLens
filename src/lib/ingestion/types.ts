/**
 * NyayaLens Document Ingestion Pipeline Types
 */

export type SupportedFormat = 'pdf' | 'docx' | 'txt' | 'md';

export type IngestionErrorCode =
  | 'EMPTY_FILE'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FORMAT'
  | 'MAGIC_BYTE_MISMATCH'
  | 'CORRUPT_ARCHIVE'
  | 'PASSWORD_PROTECTED'
  | 'INSUFFICIENT_TEXT'
  | 'SCANNED_DOCUMENT_OCR_REQUIRED'
  | 'MALFORMED_REQUEST'
  | 'EXTRACTION_FAILED'
  | 'PII_REDACTION_ERROR';

export class IngestionError extends Error {
  public readonly code: IngestionErrorCode;
  public readonly httpStatus: number;

  constructor(code: IngestionErrorCode, message: string, httpStatus: number = 400) {
    super(message);
    this.name = 'IngestionError';
    this.code = code;
    this.httpStatus = httpStatus;
    Object.setPrototypeOf(this, IngestionError.prototype);
  }
}

export interface FileValidationResult {
  valid: boolean;
  format?: SupportedFormat;
  sanitizedFileName: string;
  fileSize: number;
  error?: string;
  errorCode?: IngestionErrorCode;
}

export interface ExtractedDocument {
  rawText: string;
  format: SupportedFormat;
  fileName: string;
  fileSize: number;
  wordCount: number;
  charCount: number;
  extractionNotes?: string[];
}

export interface DetectedSection {
  id: string;
  sectionNumber?: string;
  title: string;
  text: string;
  startLine: number;
  endLine: number;
  charCount: number;
  wordCount: number;
}

export interface LegalParty {
  name: string;
  role: string;
}

export interface ExtractedMetadata {
  title: string;
  documentType: string;
  parties: LegalParty[];
  effectiveDate?: string;
  expirationDate?: string;
  governingLaw?: string;
  jurisdiction?: string;
  wordCount: number;
  charCount: number;
  lineCount: number;
  sectionCount: number;
  estimatedPageCount: number;
  estimatedReadingTimeMinutes: number;
}

export interface DocumentChunk {
  id: string;
  sectionId?: string;
  sectionTitle?: string;
  chunkIndex: number;
  text: string;
  startLine: number;
  endLine: number;
  tokenEstimate: number;
}

export interface SecurityAnalysis {
  isUntrusted: boolean;
  hasPromptInjectionAttempt: boolean;
  detectedInjectionPatterns: string[];
  isolatedPromptText: string;
  piiRedacted: boolean;
  redactionCount: number;
}

export interface IngestionResult {
  id: string;
  fileName: string;
  format: SupportedFormat;
  fileSize: number;
  uploadedAt: string;
  rawText: string;
  normalizedText: string;
  metadata: ExtractedMetadata;
  sections: DetectedSection[];
  chunks: DocumentChunk[];
  security: SecurityAnalysis;
}

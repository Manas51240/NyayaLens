import { validateUploadedFile } from './validator';
import { extractDocumentText } from './extractors';
import { normalizeText, isolateUntrustedContent } from './normalizer';
import { detectSections } from './section-detector';
import { extractMetadata } from './metadata-extractor';
import { chunkSections } from './chunker';
import { IngestionResult, IngestionError, SupportedFormat } from './types';

export interface IngestDocumentOptions {
  buffer: Buffer;
  fileName: string;
  fileSize: number;
  enablePiiPreRedaction?: boolean;
}

export interface IngestRawTextOptions {
  rawText: string;
  fileName?: string;
  fileType?: SupportedFormat;
  enablePiiPreRedaction?: boolean;
}

/**
 * Ingests and processes a document buffer through the full NyayaLens pipeline.
 */
export async function ingestDocument(options: IngestDocumentOptions): Promise<IngestionResult> {
  const { buffer, fileName, fileSize, enablePiiPreRedaction = false } = options;

  // 1. Validate file (Extension, Size, Magic Bytes)
  const validation = validateUploadedFile(fileName, fileSize, buffer);
  if (!validation.valid || !validation.format) {
    throw new IngestionError(
      validation.errorCode || 'UNSUPPORTED_FORMAT',
      validation.error || 'The uploaded file failed security validation.',
      validation.errorCode === 'FILE_TOO_LARGE' ? 413 : 400
    );
  }

  const { format, sanitizedFileName } = validation;

  // 2. Multi-Format Extraction
  const extracted = await extractDocumentText(buffer, format, sanitizedFileName, fileSize);

  // 3. Text Normalization
  const normalizedText = normalizeText(extracted.rawText);

  if (!normalizedText || normalizedText.trim().length < 20) {
    throw new IngestionError(
      'INSUFFICIENT_TEXT',
      'The document does not contain sufficient text for legal analysis. Please verify the document content.',
      422
    );
  }

  // 4. Security Isolation & Untrusted Content Wrapping
  const { processedText, security } = isolateUntrustedContent(normalizedText, enablePiiPreRedaction);

  // 5. Legal Section & Clause Boundary Detection
  const sections = detectSections(processedText);

  // 6. Structured Metadata Extraction
  const metadata = extractMetadata(processedText, sanitizedFileName, sections);

  // 7. Semantic Legal Chunking
  const chunks = chunkSections(sections);

  // 8. Generate Unique Ingestion Result
  const id = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  return {
    id,
    fileName: sanitizedFileName,
    format,
    fileSize,
    uploadedAt: new Date().toISOString(),
    rawText: extracted.rawText,
    normalizedText: processedText,
    metadata,
    sections,
    chunks,
    security,
  };
}

/**
 * Ingests raw text (e.g. pasted into the analyze page or sent via JSON payload).
 */
export function ingestRawText(options: IngestRawTextOptions): IngestionResult {
  const {
    rawText,
    fileName = 'Pasted_Document.txt',
    fileType = 'txt',
    enablePiiPreRedaction = false,
  } = options;

  if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
    throw new IngestionError('EMPTY_FILE', 'Document text cannot be empty.', 400);
  }

  const normalized = normalizeText(rawText);
  if (normalized.trim().length < 20) {
    throw new IngestionError(
      'INSUFFICIENT_TEXT',
      'The provided text is too short for legal analysis (minimum 20 characters required).',
      422
    );
  }

  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileSize = Buffer.byteLength(rawText, 'utf-8');

  const { processedText, security } = isolateUntrustedContent(normalized, enablePiiPreRedaction);
  const sections = detectSections(processedText);
  const metadata = extractMetadata(processedText, sanitizedFileName, sections);
  const chunks = chunkSections(sections);

  const id = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  return {
    id,
    fileName: sanitizedFileName,
    format: fileType,
    fileSize,
    uploadedAt: new Date().toISOString(),
    rawText,
    normalizedText: processedText,
    metadata,
    sections,
    chunks,
    security,
  };
}

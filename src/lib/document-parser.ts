import {
  MAX_FILE_SIZE_BYTES,
  ALLOWED_EXTENSIONS,
  validateUploadedFile,
} from './ingestion/validator';
import { extractDocumentText } from './ingestion/extractors';
import { normalizeText } from './ingestion/normalizer';
import { SupportedFormat } from './ingestion/types';

export { MAX_FILE_SIZE_BYTES, ALLOWED_EXTENSIONS };

export interface ParsedDocumentResult {
  text: string;
  fileType: SupportedFormat;
  fileName: string;
  fileSize: number;
  wordCount: number;
}

/**
 * Validates file name and size constraints.
 * Retained for backwards compatibility with existing consumers.
 */
export function validateFileMetadata(
  fileName: string,
  fileSize: number
): { valid: boolean; error?: string } {
  const result = validateUploadedFile(fileName, fileSize);
  return {
    valid: result.valid,
    error: result.error,
  };
}

/**
 * Extracts normalized plain text from a supported document buffer.
 * Retained for backwards compatibility with existing consumers.
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  fileName: string,
  fileSize: number
): Promise<ParsedDocumentResult> {
  const validation = validateUploadedFile(fileName, fileSize, buffer);
  if (!validation.valid || !validation.format) {
    throw new Error(validation.error || 'Failed file validation.');
  }

  const extracted = await extractDocumentText(buffer, validation.format, validation.sanitizedFileName, fileSize);
  const normalized = normalizeText(extracted.rawText);

  return {
    text: normalized,
    fileType: validation.format,
    fileName: validation.sanitizedFileName,
    fileSize,
    wordCount: normalized.split(/\s+/).length,
  };
}


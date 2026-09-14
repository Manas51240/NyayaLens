import mammoth from 'mammoth';
import { SupportedFormat, ExtractedDocument, IngestionError } from './types';

/**
 * Extracts plain text from a PDF buffer using pdf-parse with fallback streams.
 */
export async function extractPdf(buffer: Buffer): Promise<{ text: string; notes?: string[] }> {
  const notes: string[] = [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    const text = data.text || '';

    if (data.numpages) {
      notes.push(`Extracted ${data.numpages} pages.`);
    }

    if (text.trim().length > 0) {
      return { text, notes };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);

    // Check for password protection
    if (/password|encrypt/i.test(errorMsg)) {
      throw new IngestionError(
        'PASSWORD_PROTECTED',
        'This PDF document is encrypted or password-protected. Please upload an unencrypted document.',
        422
      );
    }

    notes.push(`Primary PDF parser failed: ${errorMsg}. Attempting text stream fallback.`);
  }

  // Fallback stream text extraction
  const rawStr = buffer.toString('utf-8');
  const printableMatches = rawStr.match(/[\x20-\x7E\t\r\n]{8,}/g);
  const fallbackText = printableMatches ? printableMatches.join('\n') : '';

  if (fallbackText.trim().length > 20) {
    notes.push('Text successfully recovered using stream extraction fallback.');
    return { text: fallbackText, notes };
  }

  throw new IngestionError(
    'EXTRACTION_FAILED',
    'Failed to extract text from the PDF. The document may be an image-only scan or contains corrupted streams.',
    422
  );
}

/**
 * Extracts raw text from a DOCX buffer using mammoth.
 */
export async function extractDocx(buffer: Buffer): Promise<{ text: string; notes?: string[] }> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value || '';
    const notes: string[] = [];

    if (result.messages && result.messages.length > 0) {
      notes.push(...result.messages.map((m) => `${m.type}: ${m.message}`));
    }

    return { text, notes };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (/corrupt|zip|central directory|end of data/i.test(errorMsg)) {
      throw new IngestionError(
        'CORRUPT_ARCHIVE',
        'The DOCX file structure appears corrupted or incomplete. Please re-export and re-upload the document.',
        422
      );
    }
    throw new IngestionError(
      'EXTRACTION_FAILED',
      `Failed to extract text from DOCX document: ${errorMsg}`,
      422
    );
  }
}

/**
 * Extracts text from plain text or Markdown buffer with UTF-8 BOM handling.
 */
export function extractPlainText(buffer: Buffer): { text: string } {
  // Strip UTF-8 BOM if present (0xEF, 0xBB, 0xBF)
  let cleanBuffer = buffer;
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    cleanBuffer = buffer.subarray(3);
  }

  const text = cleanBuffer.toString('utf-8');
  return { text };
}

/**
 * Master extraction dispatcher.
 */
export async function extractDocumentText(
  buffer: Buffer,
  format: SupportedFormat,
  fileName: string,
  fileSize: number
): Promise<ExtractedDocument> {
  let rawText = '';
  let notes: string[] | undefined;

  switch (format) {
    case 'pdf': {
      const result = await extractPdf(buffer);
      rawText = result.text;
      notes = result.notes;
      break;
    }
    case 'docx': {
      const result = await extractDocx(buffer);
      rawText = result.text;
      notes = result.notes;
      break;
    }
    case 'md':
    case 'txt': {
      const result = extractPlainText(buffer);
      rawText = result.text;
      break;
    }
    default:
      throw new IngestionError(
        'UNSUPPORTED_FORMAT',
        `Unsupported document format: ${format}`,
        400
      );
  }

  const trimmed = rawText.trim();
  if (trimmed.length < 20) {
    throw new IngestionError(
      'INSUFFICIENT_TEXT',
      'The document contains insufficient text for legal analysis (minimum 20 characters required). Please verify that the file is not empty or an unscanned image.',
      422
    );
  }

  const wordCount = trimmed.split(/\s+/).length;

  return {
    rawText,
    format,
    fileName,
    fileSize,
    wordCount,
    charCount: rawText.length,
    extractionNotes: notes,
  };
}

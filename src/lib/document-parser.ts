import mammoth from 'mammoth';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

export const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md'];

export interface ParsedDocumentResult {
  text: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'md';
  fileName: string;
  fileSize: number;
  wordCount: number;
}

export function validateFileMetadata(fileName: string, fileSize: number): { valid: boolean; error?: string } {
  if (!fileName || typeof fileName !== 'string') {
    return { valid: false, error: 'Invalid file name provided.' };
  }

  const extMatch = fileName.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
  const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : '';

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Unsupported file format (${ext || 'unknown'}). Please upload a PDF, DOCX, TXT, or Markdown document.`,
    };
  }

  if (fileSize <= 0) {
    return { valid: false, error: 'The uploaded file appears to be empty (0 bytes).' };
  }

  if (fileSize > MAX_FILE_SIZE_BYTES) {
    const sizeInMb = (fileSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeInMb} MB) exceeds maximum allowed limit of 10 MB.`,
    };
  }

  return { valid: true };
}

/**
 * Extracts raw plain text from PDF, DOCX, TXT, or MD buffer.
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  fileName: string,
  fileSize: number
): Promise<ParsedDocumentResult> {
  const validation = validateFileMetadata(fileName, fileSize);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const lower = fileName.toLowerCase();
  let extractedText = '';
  let detectedType: 'pdf' | 'docx' | 'txt' | 'md' = 'txt';

  if (lower.endsWith('.docx')) {
    detectedType = 'docx';
    const result = await mammoth.extractRawText({ buffer });
    extractedText = result.value || '';
  } else if (lower.endsWith('.pdf')) {
    detectedType = 'pdf';
    try {
      // Dynamic require/import for pdf-parse to be safe across environments
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      extractedText = data.text || '';
    } catch (pdfErr) {
      console.warn('pdf-parse encountered error or is in serverless mode, extracting text fallback:', pdfErr);
      // Fallback text extraction from buffer string representation if standard parser fails
      const rawStr = buffer.toString('utf-8');
      const cleanMatch = rawStr.match(/[\x20-\x7E\t\r\n]{10,}/g);
      extractedText = cleanMatch ? cleanMatch.join('\n') : rawStr;
    }
  } else if (lower.endsWith('.md')) {
    detectedType = 'md';
    extractedText = buffer.toString('utf-8');
  } else {
    detectedType = 'txt';
    extractedText = buffer.toString('utf-8');
  }

  // Clean and normalize extracted text
  const cleanedText = extractedText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const wordCount = cleanedText.length > 0 ? cleanedText.split(/\s+/).length : 0;

  return {
    text: cleanedText,
    fileType: detectedType,
    fileName,
    fileSize,
    wordCount,
  };
}

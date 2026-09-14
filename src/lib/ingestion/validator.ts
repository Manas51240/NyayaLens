import { SupportedFormat, FileValidationResult, IngestionError, IngestionErrorCode } from './types';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_EXTENSIONS: readonly string[] = ['.pdf', '.docx', '.txt', '.md'] as const;

/**
 * Sanitizes a filename to protect against path traversal and dangerous characters.
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') {
    return 'document_upload.txt';
  }

  // Strip null bytes and control characters
  let clean = fileName.replace(/[\x00-\x1F\x7F]/g, '');

  // Extract basename to eliminate path traversal attempts (e.g., ../../etc/passwd)
  clean = clean.replace(/^.*[\\/]/, '');

  // Remove repeated relative path navigation characters
  clean = clean.replace(/\.{2,}/g, '.');

  // Allow only alphanumeric, spaces, underscores, dashes, and periods
  clean = clean.replace(/[^a-zA-Z0-9\s._-]/g, '_').trim();

  if (!clean || clean === '.') {
    return 'document_upload.txt';
  }

  // Restrict filename length to 120 chars while preserving extension
  if (clean.length > 120) {
    const extIdx = clean.lastIndexOf('.');
    if (extIdx > 0 && clean.length - extIdx < 10) {
      const ext = clean.substring(extIdx);
      clean = clean.substring(0, 110) + ext;
    } else {
      clean = clean.substring(0, 120);
    }
  }

  return clean;
}

/**
 * Validates file size constraints (min 1 byte, max 10MB).
 */
export function validateFileSize(fileSize: number): { valid: boolean; errorCode?: IngestionErrorCode; error?: string } {
  if (fileSize <= 0) {
    return {
      valid: false,
      errorCode: 'EMPTY_FILE',
      error: 'The uploaded file appears to be empty (0 bytes). Please upload a valid document.',
    };
  }

  if (fileSize > MAX_FILE_SIZE_BYTES) {
    const sizeInMb = (fileSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      errorCode: 'FILE_TOO_LARGE',
      error: `File size (${sizeInMb} MB) exceeds maximum allowed limit of 10 MB.`,
    };
  }

  return { valid: true };
}

/**
 * Checks magic bytes against expected file format to prevent MIME spoofing.
 */
export function validateMagicBytes(
  buffer: Buffer,
  format: SupportedFormat
): { valid: boolean; errorCode?: IngestionErrorCode; error?: string } {
  if (!buffer || buffer.length === 0) {
    return {
      valid: false,
      errorCode: 'EMPTY_FILE',
      error: 'Cannot inspect magic bytes of an empty buffer.',
    };
  }

  if (format === 'pdf') {
    // PDF magic bytes: %PDF- (0x25 0x50 0x44 0x46) within the first 1024 bytes
    const headerSlice = buffer.subarray(0, Math.min(buffer.length, 1024));
    const headerStr = headerSlice.toString('latin1');
    if (!headerStr.includes('%PDF-')) {
      return {
        valid: false,
        errorCode: 'MAGIC_BYTE_MISMATCH',
        error: 'The file has a .pdf extension but lacks a valid PDF header signature (%PDF-).',
      };
    }
  } else if (format === 'docx') {
    // DOCX files are ZIP archives with PK\x03\x04 or PK\x05\x06 (0x50 0x4B)
    if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
      return {
        valid: false,
        errorCode: 'MAGIC_BYTE_MISMATCH',
        error: 'The file has a .docx extension but lacks a valid Office Open XML ZIP signature (PK).',
      };
    }
  } else if (format === 'txt' || format === 'md') {
    // Check for excessive binary null bytes which indicate an executable or raw binary disguised as text
    const inspectLength = Math.min(buffer.length, 4096);
    let nullByteCount = 0;
    for (let i = 0; i < inspectLength; i++) {
      if (buffer[i] === 0x00) {
        nullByteCount++;
      }
    }
    if (nullByteCount > 0) {
      return {
        valid: false,
        errorCode: 'MAGIC_BYTE_MISMATCH',
        error: 'The text file contains binary null bytes, indicating it is an unsupported binary file.',
      };
    }
  }

  return { valid: true };
}

/**
 * Comprehensive file validator for incoming uploads.
 */
export function validateUploadedFile(
  fileName: string,
  fileSize: number,
  buffer?: Buffer
): FileValidationResult {
  const sanitized = sanitizeFileName(fileName);

  // Validate extension
  const extMatch = sanitized.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
  const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : '';

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      sanitizedFileName: sanitized,
      fileSize,
      errorCode: 'UNSUPPORTED_FORMAT',
      error: `Unsupported file format "${ext || 'unknown'}". Supported formats are: PDF, DOCX, TXT, and Markdown (MD).`,
    };
  }

  const format = ext.replace('.', '') as SupportedFormat;

  // Validate size
  const sizeCheck = validateFileSize(fileSize);
  if (!sizeCheck.valid) {
    return {
      valid: false,
      format,
      sanitizedFileName: sanitized,
      fileSize,
      errorCode: sizeCheck.errorCode,
      error: sizeCheck.error,
    };
  }

  // Validate magic bytes if buffer is supplied
  if (buffer) {
    const magicCheck = validateMagicBytes(buffer, format);
    if (!magicCheck.valid) {
      return {
        valid: false,
        format,
        sanitizedFileName: sanitized,
        fileSize,
        errorCode: magicCheck.errorCode,
        error: magicCheck.error,
      };
    }
  }

  return {
    valid: true,
    format,
    sanitizedFileName: sanitized,
    fileSize,
  };
}

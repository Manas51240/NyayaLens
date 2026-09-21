import { describe, it, expect } from 'vitest';
import { sanitizeFileName, stripBidiAndHiddenChars, validateMagicBytes, validateUploadedFile } from '@/lib/ingestion/validator';
import { IngestionError } from '@/lib/ingestion/types';

describe('Document Ingestion Edge Cases & Security Hardening', () => {
  describe('Unicode Bidi & Hidden Character Defense', () => {
    it('strips Right-to-Left Override (RLO: U+202E) attacks from filenames', () => {
      // Attacker attempts to make "contract_exe.pdf" appear as "contract_pdf.exe" via RLO
      const maliciousName = 'contract_\u202Efdp.exe';
      const sanitized = sanitizeFileName(maliciousName);
      expect(sanitized).not.toContain('\u202E');
      expect(sanitized).toBe('contract_fdp.exe');
    });

    it('strips zero-width spaces (U+200B) and directional isolates (U+2066-U+2069)', () => {
      const payload = 'Confidential\u200B_\u2066Agreement\u2069\uFEFF.pdf';
      const clean = stripBidiAndHiddenChars(payload);
      expect(clean).toBe('Confidential_Agreement.pdf');
    });

    it('sanitizes Unicode bidi characters during filename normalization', () => {
      const bidiName = '\u202A\u202BSecret\u200CContract\u202C\u202D.docx';
      const sanitized = sanitizeFileName(bidiName);
      expect(sanitized).toBe('SecretContract.docx');
      expect(sanitized).not.toMatch(/[\u200B-\u200D\uFEFF\u202A-\u202E\u2066-\u2069]/);
    });
  });

  describe('Magic Byte & Format Validation Under Adversarial Inputs', () => {
    it('rejects PDF file when magic bytes are missing (%PDF-)', () => {
      // Create a fake PDF that is actually plain text
      const fakePdf = Buffer.from('This is not really a PDF document.');
      const result = validateMagicBytes(fakePdf, 'pdf');
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('MAGIC_BYTE_MISMATCH');
    });

    it('rejects DOCX file missing PK signature', () => {
      const fakeDocx = Buffer.from('Fake docx content without PK magic bytes');
      const result = validateMagicBytes(fakeDocx, 'docx');
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('MAGIC_BYTE_MISMATCH');
    });

    it('rejects binary files disguised as TXT via embedded null bytes', () => {
      // Binary payload with null bytes
      const binaryDisguisedAsTxt = Buffer.from([0x48, 0x65, 0x6c, 0x00, 0x6c, 0x6f]);
      const result = validateMagicBytes(binaryDisguisedAsTxt, 'txt');
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('MAGIC_BYTE_MISMATCH');
    });
  });

  describe('Scanned Document & OCR Error Classification', () => {
    it('instantiates IngestionError with SCANNED_DOCUMENT_OCR_REQUIRED and code 422', () => {
      const err = new IngestionError(
        'SCANNED_DOCUMENT_OCR_REQUIRED',
        'The uploaded PDF contains 4 page(s) but lacks a machine-readable text layer.',
        422
      );
      expect(err.code).toBe('SCANNED_DOCUMENT_OCR_REQUIRED');
      expect(err.httpStatus).toBe(422);
      expect(err.message).toContain('machine-readable text layer');
    });
  });

  describe('Path Traversal & Windows Reserved Names', () => {
    it('strips deep relative path traversal sequences', () => {
      const traversal = '../../../../../../etc/passwd.pdf';
      const sanitized = sanitizeFileName(traversal);
      expect(sanitized).toBe('passwd.pdf');
    });

    it('neutralizes Windows reserved device names (CON, PRN, AUX, NUL)', () => {
      expect(sanitizeFileName('CON.txt')).toBe('safe_CON.txt');
      expect(sanitizeFileName('NUL.docx')).toBe('safe_NUL.docx');
      expect(sanitizeFileName('aux.pdf')).toBe('safe_aux.pdf');
    });
  });
});

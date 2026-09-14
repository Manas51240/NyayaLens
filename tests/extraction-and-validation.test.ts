import { describe, it, expect } from 'vitest';
import { validateFileMetadata, extractTextFromBuffer, MAX_FILE_SIZE_BYTES } from '../src/lib/document-parser';

describe('Document Extraction and Validation', () => {
  it('accepts valid PDF, DOCX, TXT, and Markdown files under limit', () => {
    expect(validateFileMetadata('contract.pdf', 500000).valid).toBe(true);
    expect(validateFileMetadata('agreement.docx', 120000).valid).toBe(true);
    expect(validateFileMetadata('terms.txt', 4000).valid).toBe(true);
    expect(validateFileMetadata('policy.md', 8000).valid).toBe(true);
  });

  it('rejects unsupported file formats and scripts', () => {
    const invalidFormats = ['malicious.exe', 'script.bat', 'data.zip', 'photo.jpg', 'doc_without_ext'];
    for (const name of invalidFormats) {
      const res = validateFileMetadata(name, 5000);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Unsupported file format');
    }
  });

  it('rejects empty (0 byte) files', () => {
    const res = validateFileMetadata('empty.txt', 0);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('0 bytes');
  });

  it('rejects files exceeding the 10MB maximum limit', () => {
    const res = validateFileMetadata('huge_legal_archive.pdf', MAX_FILE_SIZE_BYTES + 1024);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('exceeds maximum allowed limit');
  });

  it('correctly extracts plain text and computes word count from buffer', async () => {
    const textContent = 'This Master Agreement is entered into by Alpha Corp and Beta LLC.\nBoth parties agree to standard terms.';
    const buffer = Buffer.from(textContent, 'utf-8');
    const result = await extractTextFromBuffer(buffer, 'agreement.txt', buffer.byteLength);

    expect(result.fileType).toBe('txt');
    expect(result.text).toContain('Alpha Corp and Beta LLC');
    expect(result.wordCount).toBeGreaterThan(10);
  });
});

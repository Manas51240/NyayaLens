import { NextRequest, NextResponse } from 'next/server';
import { ingestDocument, ingestRawText, IngestionError, IngestionResult, sanitizeFileName } from '@/lib/ingestion';
import { analyzeLegalDocument } from '@/lib/grounded-ai-engine';
import { safeLogError, getSafeErrorMessage } from '@/lib/security/error-sanitizer';

import { checkRateLimit } from '@/lib/security/rate-limiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  try {
    // 1. Rate Limiting Check (30 doc analyses/min per client)
    const rateLimit = checkRateLimit(req, { maxRequests: 30, windowMs: 60000 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many analysis requests. Please wait a moment before analyzing another document.', errorCode: 'RATE_LIMITED' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.resetSeconds),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': '0',
            'x-request-id': requestId,
          },
        }
      );
    }

    const contentType = req.headers.get('content-type') || '';
    let ingestionResult: IngestionResult;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const piiFlag = formData.get('enablePiiPreRedaction');
      const enablePiiPreRedaction = piiFlag === 'true';

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No file was provided in the upload request.', errorCode: 'MALFORMED_REQUEST' },
          { status: 400 }
        );
      }

      const fileName = file.name;
      const fileSize = file.size;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      ingestionResult = await ingestDocument({
        buffer,
        fileName,
        fileSize,
        enablePiiPreRedaction,
      });
    } else {
      // JSON payload (e.g. pasted text or direct test mock)
      const body = await req.json();
      if (!body.rawText || typeof body.rawText !== 'string' || body.rawText.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Document text cannot be empty.', errorCode: 'EMPTY_FILE' },
          { status: 400 }
        );
      }

      // Enforce 5MB limit on raw text in JSON payload to protect against memory exhaustion
      if (body.rawText.length > 5 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: 'Document text exceeds maximum allowed size of 5 MB.', errorCode: 'FILE_TOO_LARGE' },
          { status: 413 }
        );
      }

      const safeFileName = sanitizeFileName(body.fileName || 'Pasted_Document.txt');
      const validFileType = body.fileType === 'md' ? 'md' : 'txt';

      ingestionResult = ingestRawText({
        rawText: body.rawText,
        fileName: safeFileName,
        fileType: validFileType,
        enablePiiPreRedaction: !!body.enablePiiPreRedaction,
      });
    }

    // Analyze document through grounded AI engine
    const analysisResult = await analyzeLegalDocument(
      ingestionResult.normalizedText,
      ingestionResult.fileName,
      ingestionResult.format,
      ingestionResult.fileSize
    );

    return NextResponse.json(
      {
        success: true,
        document: analysisResult,
        ingestion: {
          id: ingestionResult.id,
          sections: ingestionResult.sections,
          metadata: ingestionResult.metadata,
          chunks: ingestionResult.chunks,
          security: {
            hasPromptInjectionAttempt: ingestionResult.security.hasPromptInjectionAttempt,
            detectedInjectionPatterns: ingestionResult.security.detectedInjectionPatterns,
            piiRedacted: ingestionResult.security.piiRedacted,
            redactionCount: ingestionResult.security.redactionCount,
          },
        },
      },
      {
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'x-request-id': requestId,
        },
      }
    );
  } catch (error: unknown) {
    if (error instanceof IngestionError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errorCode: error.code,
        },
        {
          status: error.httpStatus,
          headers: { 'x-request-id': requestId },
        }
      );
    }

    // Safe error message to avoid exposing system details, stack traces, or secrets
    safeLogError(`Document analysis route failure [req: ${requestId}]`, error);
    const message = getSafeErrorMessage(error, 'An internal error occurred during document processing.');
    return NextResponse.json(
      { success: false, error: message, errorCode: 'EXTRACTION_FAILED' },
      {
        status: 500,
        headers: { 'x-request-id': requestId },
      }
    );
  }
}


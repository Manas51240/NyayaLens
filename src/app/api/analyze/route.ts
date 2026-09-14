import { NextRequest, NextResponse } from 'next/server';
import { ingestDocument, ingestRawText, IngestionError, IngestionResult } from '@/lib/ingestion';
import { analyzeLegalDocument } from '@/lib/grounded-ai-engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
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

      ingestionResult = ingestRawText({
        rawText: body.rawText,
        fileName: body.fileName || 'Pasted_Document.txt',
        fileType: body.fileType || 'txt',
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

    return NextResponse.json({
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
    });
  } catch (error: unknown) {
    if (error instanceof IngestionError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errorCode: error.code,
        },
        { status: error.httpStatus }
      );
    }

    // Safe error message to avoid exposing system details, stack traces, or secrets
    console.error('Document analysis route failure:', error);
    const message = error instanceof Error ? error.message : 'An error occurred during document processing.';
    return NextResponse.json(
      { success: false, error: message, errorCode: 'EXTRACTION_FAILED' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromBuffer, validateFileMetadata } from '@/lib/document-parser';
import { analyzeLegalDocument } from '@/lib/grounded-ai-engine';
import { redactPersonalIdentifiableInformation } from '@/lib/sanitizer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let textContent = '';
    let fileName = 'Uploaded_Document.txt';
    let fileType: 'pdf' | 'docx' | 'txt' | 'md' = 'txt';
    let fileSize = 0;
    let enablePiiPreRedaction = false;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const piiFlag = formData.get('enablePiiPreRedaction');
      enablePiiPreRedaction = piiFlag === 'true';

      if (!file) {
        return NextResponse.json({ error: 'No file was provided in the upload request.' }, { status: 400 });
      }

      fileName = file.name;
      fileSize = file.size;

      const validation = validateFileMetadata(fileName, fileSize);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const parsed = await extractTextFromBuffer(buffer, fileName, fileSize);
      textContent = parsed.text;
      fileType = parsed.fileType;
    } else {
      // JSON payload (e.g. pasted text or test mock)
      const body = await req.json();
      if (!body.rawText || typeof body.rawText !== 'string' || body.rawText.trim().length === 0) {
        return NextResponse.json({ error: 'Document text cannot be empty.' }, { status: 400 });
      }

      textContent = body.rawText.trim();
      fileName = body.fileName || 'Pasted_Document.txt';
      fileType = (body.fileType as 'pdf' | 'docx' | 'txt' | 'md') || 'txt';
      fileSize = Buffer.byteLength(textContent, 'utf8');
      enablePiiPreRedaction = !!body.enablePiiPreRedaction;
    }

    if (!textContent || textContent.length < 20) {
      return NextResponse.json(
        { error: 'The document does not contain sufficient text for legal analysis. Please verify the file content.' },
        { status: 400 }
      );
    }

    // Optional PII pre-redaction
    let finalDocText = textContent;
    if (enablePiiPreRedaction) {
      const piiResult = redactPersonalIdentifiableInformation(textContent);
      finalDocText = piiResult.redactedText;
    }

    // Analyze document through grounded AI engine
    const analysisResult = await analyzeLegalDocument(finalDocText, fileName, fileType, fileSize);

    return NextResponse.json({
      success: true,
      document: analysisResult,
    });
  } catch (error: unknown) {
    console.error('Document analysis route failure:', error);
    const message = error instanceof Error ? error.message : 'An error occurred during document processing.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

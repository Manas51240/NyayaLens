import { NextRequest, NextResponse } from 'next/server';
import { askDocumentQuestion } from '@/lib/grounded-ai-engine';
import { LegalDocument } from '@/types/legal';
import { safeLogError, getSafeErrorMessage } from '@/lib/security/error-sanitizer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { document, question } = body as { document: LegalDocument; question: string };

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json({ error: 'Please provide a valid question.' }, { status: 400 });
    }

    if (question.length > 3000) {
      return NextResponse.json(
        { error: 'Question exceeds maximum allowed length of 3,000 characters.' },
        { status: 400 }
      );
    }

    if (!document || !document.rawText || typeof document.rawText !== 'string') {
      return NextResponse.json({ error: 'Document context is missing or invalid.' }, { status: 400 });
    }

    if (document.rawText.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Document content exceeds maximum allowed size of 10 MB.' },
        { status: 400 }
      );
    }

    const result = await askDocumentQuestion(document, question.trim());

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: unknown) {
    safeLogError('Ask route failure', error);
    const message = getSafeErrorMessage(error, 'An internal error occurred during Q&A retrieval.');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { askDocumentQuestion } from '@/lib/grounded-ai-engine';
import { LegalDocument } from '@/types/legal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { document, question } = body as { document: LegalDocument; question: string };

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json({ error: 'Please provide a valid question.' }, { status: 400 });
    }

    if (!document || !document.rawText) {
      return NextResponse.json({ error: 'Document context is missing.' }, { status: 400 });
    }

    const result = await askDocumentQuestion(document, question.trim());

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: unknown) {
    console.error('Ask route failure:', error);
    const message = error instanceof Error ? error.message : 'An error occurred during Q&A retrieval.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

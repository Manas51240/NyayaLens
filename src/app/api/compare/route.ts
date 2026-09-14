import { NextRequest, NextResponse } from 'next/server';
import { compareLegalDocuments } from '@/lib/grounded-ai-engine';
import { LegalDocument } from '@/types/legal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { docA, docB } = body as { docA: LegalDocument; docB: LegalDocument };

    if (!docA || !docB) {
      return NextResponse.json({ error: 'Both Document A and Document B are required for comparison.' }, { status: 400 });
    }

    const comparison = compareLegalDocuments(docA, docB);

    return NextResponse.json({
      success: true,
      comparison,
    });
  } catch (error: unknown) {
    console.error('Comparison route failure:', error);
    const message = error instanceof Error ? error.message : 'An error occurred during document comparison.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

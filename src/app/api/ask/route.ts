import { NextRequest, NextResponse } from 'next/server';
import { askDocumentQuestion } from '@/lib/grounded-ai-engine';
import { LegalDocument } from '@/types/legal';
import { safeLogError, getSafeErrorMessage } from '@/lib/security/error-sanitizer';

import { checkRateLimit } from '@/lib/security/rate-limiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting Check (60 req/min per client)
    const rateLimit = checkRateLimit(req, { maxRequests: 60, windowMs: 60000 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before submitting another inquiry.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.resetSeconds),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

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

    return NextResponse.json(
      {
        success: true,
        result,
      },
      {
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      }
    );
  } catch (error: unknown) {
    safeLogError('Ask route failure', error);
    const message = getSafeErrorMessage(error, 'An internal error occurred during Q&A retrieval.');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

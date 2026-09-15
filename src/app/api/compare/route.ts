import { NextRequest, NextResponse } from 'next/server';
import { compareLegalDocuments } from '@/lib/grounded-ai-engine';
import { LegalDocument } from '@/types/legal';
import { safeLogError, getSafeErrorMessage } from '@/lib/security/error-sanitizer';

import { checkRateLimit } from '@/lib/security/rate-limiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting Check (30 comparisons/min per client)
    const rateLimit = checkRateLimit(req, { maxRequests: 30, windowMs: 60000 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many comparison requests. Please wait a moment before submitting another comparison.' },
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
    const { docA, docB } = body as { docA: LegalDocument; docB: LegalDocument };

    if (!docA || !docB || typeof docA !== 'object' || typeof docB !== 'object') {
      return NextResponse.json({ error: 'Both Document A and Document B are required for comparison.' }, { status: 400 });
    }

    if (
      (docA.rawText && typeof docA.rawText === 'string' && docA.rawText.length > 10 * 1024 * 1024) ||
      (docB.rawText && typeof docB.rawText === 'string' && docB.rawText.length > 10 * 1024 * 1024)
    ) {
      return NextResponse.json(
        { error: 'Document content exceeds maximum allowed size of 10 MB for comparison.' },
        { status: 400 }
      );
    }

    const comparison = compareLegalDocuments(docA, docB);

    return NextResponse.json(
      {
        success: true,
        comparison,
      },
      {
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      }
    );
  } catch (error: unknown) {
    safeLogError('Comparison route failure', error);
    const message = getSafeErrorMessage(error, 'An internal error occurred during document comparison.');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

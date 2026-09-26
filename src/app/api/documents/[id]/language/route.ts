import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/server/session';
import { documentStore } from '@/lib/server/document-store';
import { analyzeLegalLanguage } from '@/lib/legal-language';
import { safeLogError } from '@/lib/security/error-sanitizer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  try {
    const { id } = await params;
    const session = getSessionFromRequest(req);

    const result = documentStore.getDocument(id, session.sessionId);

    if (!result.found || !result.document) {
      return NextResponse.json(
        { success: false, error: 'Document not found.' },
        { status: 404, headers: { 'x-request-id': requestId } }
      );
    }

    if (result.forbidden) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied: You do not have permission to view this document.',
        },
        { status: 403, headers: { 'x-request-id': requestId } }
      );
    }

    const languageAnalysis = analyzeLegalLanguage(result.document.rawText || '');

    return NextResponse.json(
      {
        success: true,
        documentId: id,
        analysis: languageAnalysis,
      },
      { headers: { 'x-request-id': requestId } }
    );
  } catch (err) {
    safeLogError(`Legal language API error [req: ${requestId}]`, err);
    return NextResponse.json(
      { success: false, error: 'Internal server error analyzing legal language.' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}

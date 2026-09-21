import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, SESSION_COOKIE_NAME } from '@/lib/server/session';
import { documentStore } from '@/lib/server/document-store';
import { LegalDocument } from '@/types/legal';
import { safeLogError } from '@/lib/security/error-sanitizer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  try {
    const session = getSessionFromRequest(req);
    const documents = documentStore.listDocuments(session.sessionId);

    const response = NextResponse.json(
      {
        success: true,
        documents,
        total: documents.length,
      },
      {
        headers: {
          'x-request-id': requestId,
        },
      }
    );

    // Set signed session cookie if new
    if (session.isNew) {
      response.cookies.set(SESSION_COOKIE_NAME, session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });
    }

    return response;
  } catch (err) {
    safeLogError(`List documents route error [req: ${requestId}]`, err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve documents.' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}

export async function POST(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  try {
    const session = getSessionFromRequest(req);
    const body = await req.json();
    const document = body.document as LegalDocument;

    if (!document || !document.id || !document.title) {
      return NextResponse.json(
        { success: false, error: 'Invalid document structure provided.' },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    const savedRecord = documentStore.saveDocument(document, session.sessionId);

    const response = NextResponse.json(
      {
        success: true,
        document: savedRecord.document,
        ownerSessionId: savedRecord.ownerSessionId,
      },
      {
        status: 201,
        headers: {
          'x-request-id': requestId,
        },
      }
    );

    if (session.isNew) {
      response.cookies.set(SESSION_COOKIE_NAME, session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });
    }

    return response;
  } catch (err) {
    safeLogError(`Save document route error [req: ${requestId}]`, err);
    return NextResponse.json(
      { success: false, error: 'Failed to persist document.' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}

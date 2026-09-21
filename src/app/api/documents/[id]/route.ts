import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, SESSION_COOKIE_NAME } from '@/lib/server/session';
import { documentStore } from '@/lib/server/document-store';
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

    if (!result.found) {
      return NextResponse.json(
        { success: false, error: 'Document not found.' },
        { status: 404, headers: { 'x-request-id': requestId } }
      );
    }

    if (result.forbidden) {
      // IDOR blocked: Calling session is attempting to access a document belonging to another session
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied: You do not have permission to view this document.',
          errorCode: 'FORBIDDEN',
        },
        { status: 403, headers: { 'x-request-id': requestId } }
      );
    }

    const response = NextResponse.json(
      {
        success: true,
        document: result.document,
      },
      { headers: { 'x-request-id': requestId } }
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
    safeLogError(`Get document by ID error [req: ${requestId}]`, err);
    return NextResponse.json(
      { success: false, error: 'Internal server error retrieving document.' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  try {
    const { id } = await params;
    const session = getSessionFromRequest(req);

    const result = documentStore.deleteDocument(id, session.sessionId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status, headers: { 'x-request-id': requestId } }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Document removed successfully.' },
      { status: 200, headers: { 'x-request-id': requestId } }
    );
  } catch (err) {
    safeLogError(`Delete document error [req: ${requestId}]`, err);
    return NextResponse.json(
      { success: false, error: 'Internal server error deleting document.' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}

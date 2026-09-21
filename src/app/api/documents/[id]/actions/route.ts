import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/server/session';
import { documentStore } from '@/lib/server/document-store';
import { ActionItem } from '@/types/legal';
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
        { success: false, error: 'Document not found' },
        { status: 404, headers: { 'x-request-id': requestId } }
      );
    }
    if (result.forbidden) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403, headers: { 'x-request-id': requestId } }
      );
    }

    return NextResponse.json(
      { success: true, actionItems: result.document.actionItems || [] },
      { headers: { 'x-request-id': requestId } }
    );
  } catch (err) {
    safeLogError(`Get action items error [req: ${requestId}]`, err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve action items' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}

export async function POST(
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
        { success: false, error: 'Document not found' },
        { status: 404, headers: { 'x-request-id': requestId } }
      );
    }
    if (result.forbidden) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403, headers: { 'x-request-id': requestId } }
      );
    }

    const body = await req.json();
    const item = body.item as Partial<ActionItem>;

    if (!item || !item.action || typeof item.action !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Action title/description is required' },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    const newItem: ActionItem = {
      id: item.id || `act_${crypto.randomUUID()}`,
      priority: item.priority === 'high' ? 'high' : item.priority === 'low' ? 'low' : 'medium',
      action: item.action.trim(),
      category: (item.category || 'Compliance').trim(),
      timeline: item.timeline?.trim() || undefined,
      responsibleParty: item.responsibleParty?.trim() || undefined,
      sourceClause: item.sourceClause?.trim() || undefined,
      noticePeriod: item.noticePeriod?.trim() || undefined,
      suggestedQuestionsForLawyer: Array.isArray(item.suggestedQuestionsForLawyer)
        ? item.suggestedQuestionsForLawyer
        : [],
      documentsToGather: Array.isArray(item.documentsToGather) ? item.documentsToGather : [],
      status: item.status || 'pending',
    };

    result.document.actionItems = [newItem, ...(result.document.actionItems || [])];
    documentStore.saveDocument(result.document, session.sessionId);

    return NextResponse.json(
      { success: true, item: newItem },
      { status: 201, headers: { 'x-request-id': requestId } }
    );
  } catch (err) {
    safeLogError(`Create action item error [req: ${requestId}]`, err);
    return NextResponse.json(
      { success: false, error: 'Failed to create action item' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}

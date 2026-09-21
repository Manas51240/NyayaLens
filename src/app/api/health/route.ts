import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const startTime = Date.now();

export async function GET(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  // Diagnostic status check without leaking any secret values
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY);

  const responseBody = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptimeSeconds,
    environment: process.env.NODE_ENV || 'production',
    services: {
      aiEngine: hasGeminiKey ? 'configured' : 'unconfigured',
      rateLimiter: 'active',
      ingestionPipeline: 'ready',
      storageMode: 'session_isolated',
    },
    system: {
      supportedFormats: ['pdf', 'docx', 'txt', 'md'],
      maxFileSizeMb: 10,
    },
  };

  return NextResponse.json(responseBody, {
    status: 200,
    headers: {
      'x-request-id': requestId,
      'Cache-Control': 'no-store, max-age=0',
      'Content-Type': 'application/json',
    },
  });
}

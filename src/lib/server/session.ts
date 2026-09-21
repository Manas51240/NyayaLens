import crypto from 'crypto';
import { NextRequest } from 'next/server';

export const SESSION_COOKIE_NAME = 'nyayalens_session';
export const SESSION_HEADER_NAME = 'x-session-id';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Stable secret from env or auto-generated for runtime
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  'nyayalens_production_session_signing_secret_key_v1';

/**
 * Creates a cryptographically signed session token:
 * format: <sessionId>.<timestamp>.<hmacSignature>
 */
export function createSignedSessionToken(customSessionId?: string): string {
  const sessionId = customSessionId || `ses_${crypto.randomUUID()}`;
  const timestamp = Date.now().toString();
  const payload = `${sessionId}.${timestamp}`;

  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(payload);
  const signature = hmac.digest('hex');

  return `${payload}.${signature}`;
}

/**
 * Verifies the validity, tampering, and expiration of a session token.
 */
export function verifySessionToken(token: string): {
  valid: boolean;
  sessionId?: string;
  expired?: boolean;
} {
  if (!token || typeof token !== 'string') {
    return { valid: false };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false };
  }

  const [sessionId, timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);

  if (isNaN(timestamp) || !sessionId.startsWith('ses_')) {
    return { valid: false };
  }

  // Verify HMAC signature
  const payload = `${sessionId}.${timestampStr}`;
  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');

  // Constant-time comparison to prevent timing attacks
  const signatureBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return { valid: false };
  }

  // Check TTL expiration
  if (Date.now() - timestamp > SESSION_TTL_MS) {
    return { valid: false, expired: true, sessionId };
  }

  return { valid: true, sessionId };
}

/**
 * Extracts session from request cookies or headers, or issues a new signed session.
 */
export function getSessionFromRequest(req: NextRequest): {
  sessionId: string;
  token: string;
  isNew: boolean;
} {
  // 1. Try Cookie
  const cookieToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (cookieToken) {
    const verified = verifySessionToken(cookieToken);
    if (verified.valid && verified.sessionId) {
      return { sessionId: verified.sessionId, token: cookieToken, isNew: false };
    }
  }

  // 2. Try Header
  const headerToken = req.headers.get(SESSION_HEADER_NAME);
  if (headerToken) {
    const verified = verifySessionToken(headerToken);
    if (verified.valid && verified.sessionId) {
      return { sessionId: verified.sessionId, token: headerToken, isNew: false };
    }
  }

  // 3. Generate new session
  const newToken = createSignedSessionToken();
  const verified = verifySessionToken(newToken);
  return {
    sessionId: verified.sessionId!,
    token: newToken,
    isNew: true,
  };
}

import crypto from 'crypto';
import { NextRequest } from 'next/server';

export const SESSION_COOKIE_NAME = 'nyayalens_session';
export const SESSION_HEADER_NAME = 'x-session-id';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Resolves the cryptographic session secret.
 * In production (NODE_ENV === 'production'), a secret must be explicitly set via SESSION_SECRET
 * or NEXTAUTH_SECRET; failing to configure it throws an unrecoverable Configuration Error.
 * In development/test environments, a local-only development key is provided.
 */
export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[SECURITY CONFIGURATION ERROR] Missing required SESSION_SECRET environment variable in production mode. ' +
        'Refusing to start session operations with insecure default secret. Please configure SESSION_SECRET in production.'
      );
    }
    return 'nyayalens_development_only_secret_do_not_use_in_production_environment';
  }
  return secret;
}

/**
 * Creates a cryptographically signed session token:
 * format: <sessionId>.<timestamp>.<hmacSignature>
 */
export function createSignedSessionToken(customSessionId?: string): string {
  const sessionId = customSessionId || `ses_${crypto.randomUUID()}`;
  const timestamp = Date.now().toString();
  const payload = `${sessionId}.${timestamp}`;

  const secret = getSessionSecret();
  const hmac = crypto.createHmac('sha256', secret);
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
  const secret = getSessionSecret();
  const hmac = crypto.createHmac('sha256', secret);
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

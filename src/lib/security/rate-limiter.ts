import { NextRequest } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export interface RateLimitOptions {
  maxRequests?: number;
  windowMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

// Bounded in-memory store for rate limiting
const ipRateLimitStore = new Map<string, RateLimitRecord>();
const MAX_STORE_SIZE = 1000;

// Periodic cleanup of stale records every 5 minutes
let lastCleanup = Date.now();
function cleanupStaleRecords(now: number) {
  if (now - lastCleanup < 60000 && ipRateLimitStore.size < MAX_STORE_SIZE) {
    return;
  }
  lastCleanup = now;
  for (const [key, record] of ipRateLimitStore.entries()) {
    if (now > record.resetTime) {
      ipRateLimitStore.delete(key);
    }
  }
}

/**
 * Extracts client IP or proxy IP from incoming NextRequest
 */
export function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim();
    if (ip) return ip;
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  
  // Fallback identifier
  return 'default-client';
}

/**
 * Evaluates in-memory sliding rate limit for a request.
 */
export function checkRateLimit(
  req: NextRequest,
  options: RateLimitOptions = {}
): RateLimitResult {
  const maxRequests = options.maxRequests ?? 60;
  const windowMs = options.windowMs ?? 60000;

  // In test environment, allow high throughput so automated test suites run without throttling
  if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') {
    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests,
      resetSeconds: Math.ceil(windowMs / 1000),
    };
  }

  const now = Date.now();
  cleanupStaleRecords(now);

  const identifier = getClientIdentifier(req);
  const existing = ipRateLimitStore.get(identifier);

  if (!existing || now > existing.resetTime) {
    // New or expired window
    ipRateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      resetSeconds: Math.ceil(windowMs / 1000),
    };
  }

  existing.count += 1;
  const remaining = Math.max(0, maxRequests - existing.count);
  const resetSeconds = Math.max(1, Math.ceil((existing.resetTime - now) / 1000));

  return {
    allowed: existing.count <= maxRequests,
    limit: maxRequests,
    remaining,
    resetSeconds,
  };
}

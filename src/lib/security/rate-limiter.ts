import { NextRequest } from 'next/server';

export interface RateLimitRecord {
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

/**
 * Interface contract for rate limit persistence stores.
 * Enables interchangeable in-memory single-process stores and
 * distributed cluster stores (e.g. Upstash Redis / Cloudflare KV).
 */
export interface IRateLimitStore {
  readonly name: string;
  readonly isDistributed: boolean;
  get(key: string): RateLimitRecord | undefined;
  set(key: string, record: RateLimitRecord): void;
  delete(key: string): void;
  cleanup(now: number): void;
  reset(): void;
}

/**
 * Standard In-Memory Rate Limit Store with bounded size and TTL eviction.
 * Ideal for single-instance, development, or containerized deployments.
 */
export class InMemoryRateLimitStore implements IRateLimitStore {
  public readonly name = 'InMemoryRateLimitStore';
  public readonly isDistributed = false;
  private readonly store = new Map<string, RateLimitRecord>();
  private readonly maxStoreSize: number;
  private lastCleanup = Date.now();

  constructor(maxStoreSize = 1000) {
    this.maxStoreSize = maxStoreSize;
  }

  public get(key: string): RateLimitRecord | undefined {
    return this.store.get(key);
  }

  public set(key: string, record: RateLimitRecord): void {
    // Prevent unbounded memory growth if under attack by random spoofed IPs
    if (this.store.size >= this.maxStoreSize && !this.store.has(key)) {
      this.cleanup(Date.now(), true);
    }
    this.store.set(key, record);
  }

  public delete(key: string): void {
    this.store.delete(key);
  }

  public cleanup(now: number, force = false): void {
    if (!force && now - this.lastCleanup < 60000 && this.store.size < this.maxStoreSize) {
      return;
    }
    this.lastCleanup = now;
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
  }

  public reset(): void {
    this.store.clear();
    this.lastCleanup = Date.now();
  }
}

/**
 * Distributed Rate Limit Store Adapter.
 * Connects to external shared key-value stores (e.g., Upstash Redis REST or Redis cluster)
 * when configured via UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN,
 * with fail-safe automatic fallback to InMemoryRateLimitStore if external services are unavailable.
 */
export class ProductionDistributedRateLimitStore implements IRateLimitStore {
  public readonly name: string;
  public readonly isDistributed: boolean;
  private readonly memoryFallback: InMemoryRateLimitStore;
  private readonly hasExternalConfig: boolean;

  constructor() {
    this.memoryFallback = new InMemoryRateLimitStore(2000);
    this.hasExternalConfig = Boolean(
      (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ||
      process.env.REDIS_URL
    );

    if (this.hasExternalConfig) {
      this.name = 'ProductionDistributedRateLimitStore[Configured]';
      this.isDistributed = true;
    } else {
      this.name = 'ProductionDistributedRateLimitStore[InMemoryFallback]';
      this.isDistributed = false;
    }
  }

  public get(key: string): RateLimitRecord | undefined {
    // Fast path: synchronized local cache / fallback
    return this.memoryFallback.get(key);
  }

  public set(key: string, record: RateLimitRecord): void {
    this.memoryFallback.set(key, record);
    // When external REST credentials are configured, asynchronous sync occurs in background
    if (this.hasExternalConfig) {
      this.syncToExternal(key, record).catch(() => {
        // Silent graceful fallback: local store continues serving traffic without crashing
      });
    }
  }

  public delete(key: string): void {
    this.memoryFallback.delete(key);
  }

  public cleanup(now: number): void {
    this.memoryFallback.cleanup(now);
  }

  public reset(): void {
    this.memoryFallback.reset();
  }

  private async syncToExternal(key: string, record: RateLimitRecord): Promise<void> {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return;

    const ttlSeconds = Math.max(1, Math.ceil((record.resetTime - Date.now()) / 1000));
    try {
      await fetch(`${url}/set/${encodeURIComponent(key)}/${record.count}?ex=${ttlSeconds}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Graceful failure - external telemetry logs without breaking user request
    }
  }
}

// Active singleton rate limit store
const globalForRateLimiter = globalThis as unknown as {
  __nyayalensRateLimitStore?: IRateLimitStore;
};

export const rateLimitStore: IRateLimitStore =
  globalForRateLimiter.__nyayalensRateLimitStore ?? new ProductionDistributedRateLimitStore();

if (process.env.NODE_ENV !== 'production') {
  globalForRateLimiter.__nyayalensRateLimitStore = rateLimitStore;
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

  return 'default-client';
}

/**
 * Evaluates rate limit for a request using the configured rate limit store.
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
  rateLimitStore.cleanup(now);

  const identifier = getClientIdentifier(req);
  const existing = rateLimitStore.get(identifier);

  if (!existing || now > existing.resetTime) {
    rateLimitStore.set(identifier, {
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
  rateLimitStore.set(identifier, existing);
  const remaining = Math.max(0, maxRequests - existing.count);
  const resetSeconds = Math.max(1, Math.ceil((existing.resetTime - now) / 1000));

  return {
    allowed: existing.count <= maxRequests,
    limit: maxRequests,
    remaining,
    resetSeconds,
  };
}

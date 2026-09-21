import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as healthRoute } from '@/app/api/health/route';

describe('Production Health Check Endpoint (/api/health)', () => {
  it('returns healthy status with system telemetry', async () => {
    const req = new NextRequest('http://localhost:3000/api/health');
    const res = await healthRoute(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('healthy');
    expect(typeof data.timestamp).toBe('string');
    expect(typeof data.uptimeSeconds).toBe('number');
    expect(data.services).toBeDefined();
    expect(data.services.rateLimiter).toBe('active');
    expect(data.services.ingestionPipeline).toBe('ready');
    expect(data.system.maxFileSizeMb).toBe(10);
  });

  it('preserves or generates x-request-id correlation header', async () => {
    const customId = 'test-trace-id-12345';
    const req = new NextRequest('http://localhost:3000/api/health', {
      headers: { 'x-request-id': customId },
    });
    const res = await healthRoute(req);
    expect(res.headers.get('x-request-id')).toBe(customId);
  });

  it('never exposes API keys, database credentials, or secret variables', async () => {
    const req = new NextRequest('http://localhost:3000/api/health');
    const res = await healthRoute(req);
    const text = await res.text();

    // Check that sensitive keywords and values are not present
    expect(text).not.toContain('AIzaSy');
    expect(text).not.toContain('password');
    expect(text).not.toContain('SESSION_SECRET');
    expect(text).not.toContain('privateKey');
    expect(text).not.toContain('service_role');
  });
});

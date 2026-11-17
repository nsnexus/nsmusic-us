import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/auth', () => ({ requireAdmin: async () => ({ ok: false, status: 401 }) }));
const { middleware } = await import('../../src/middleware.js');
const { NextRequest } = await import('next/server');

describe('middleware', () => {
  it('lets the countries route authorize itself (BR panel token)', async () => {
    const res = await middleware(new NextRequest('https://us.test/api/admin/countries'));
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });
  it('still blocks other admin APIs without login', async () => {
    const res = await middleware(new NextRequest('https://us.test/api/admin/orders'));
    expect(res.status).toBe(401);
  });
});

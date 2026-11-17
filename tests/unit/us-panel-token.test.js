import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/usOrders', () => ({ getUsEnv: () => ({ US_PANEL_TOKEN: 'a'.repeat(40) }) }));
vi.mock('../../src/lib/supabase-edge', () => ({ getSupabaseEdge: () => null }));
vi.mock('../../src/lib/auth', () => ({ requireAdmin: async () => ({ ok: false, status: 401, error: 'no' }) }));

const { GET } = await import('../../src/app/api/admin/countries/route.js');
const req = (token) => new Request('https://us.test/api/admin/countries', { headers: token ? { 'x-panel-token': token } : {} });

describe('countries admin via BR panel token', () => {
  beforeEach(() => vi.clearAllMocks());
  it('accepts the shared token', async () => { expect((await GET(req('a'.repeat(40)))).status).toBe(200); });
  it('rejects a wrong token', async () => { expect((await GET(req('b'.repeat(40)))).status).toBe(401); });
  it('rejects a missing token', async () => { expect((await GET(req())).status).toBe(401); });
});

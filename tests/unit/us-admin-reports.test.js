import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/auth', () => ({ requireAdmin: vi.fn() }));
vi.mock('@/lib/supabase-edge', () => ({ getSupabaseEdge: vi.fn() }));
import { requireAdmin } from '@/lib/auth';
import { getSupabaseEdge } from '@/lib/supabase-edge';
import { GET } from '@/app/api/admin/reports/route';

let tables;
let requests;
function database() {
  return { from(table) {
    const filters = [];
    let offset = 0;
    let limit = 500;
    const q = {
      select() { return q; },
      is(key, value) { filters.push([key, value]); return q; },
      eq(key, value) { filters.push([key, value]); return q; },
      gte() { return q; }, lt() { return q; }, or() { return q; }, order() { return q; },
      limit(value) { limit = value; return q; }, offset(value) { offset = value; return q; },
      then(resolve) {
        requests.push({ table, filters, offset, limit });
        let result = tables[table] || [];
        for (const [key, value] of filters) result = result.filter(row => key === 'extras->us->>market' ? row.extras?.us?.market === value : row[key] === value);
        return Promise.resolve({ data: result.slice(offset, offset + limit), error: null }).then(resolve);
      },
    };
    return q;
  } };
}
const request = params => new Request(`https://test.example/api/admin/reports?${params}`);
const order = (id = 'order-1') => ({ id, order_number: id, deleted_at: null, created_at: '2026-10-02T12:00:00Z', paid_at: '2026-10-03T12:00:00Z', payment_status: 'PAGO', suno_task_id: 'task', suno_provider: 'kie', extras: { us: { market: 'US' }, usPaidCents: 799 } });
const session = (id, amount, rest = {}) => ({ id, order_id: 'order-1', sku: 'combo', amount_cents: amount, currency: 'usd', paid_at: '2026-10-03T12:00:00Z', revoked: false, ...rest });
beforeEach(() => {
  vi.resetAllMocks();
  tables = { orders: [order()], us_checkout_sessions: [] };
  requests = [];
  requireAdmin.mockResolvedValue({ ok: true });
  getSupabaseEdge.mockImplementation(database);
});

describe('US admin reports', () => {
  it('requires admin authentication before database access', async () => {
    requireAdmin.mockResolvedValue({ ok: false, status: 403, error: 'Denied' });
    expect((await GET(request('tipo=faturamento'))).status).toBe(403);
    expect(getSupabaseEdge).not.toHaveBeenCalled();
  });
  it('sums authoritative USD cents and excludes revoked, unpaid and foreign-currency sessions', async () => {
    tables.us_checkout_sessions = [session('one', 499), session('two', 799), session('refund', 999, { revoked: true }), session('unpaid', 599, { paid_at: null }), session('br', 999, { currency: 'brl' })];
    const response = await GET(request('tipo=faturamento&dateFrom=2026-10-01&dateTo=2026-10-31'));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({ currency: 'usd', faturamentoTotal: 12.98, vendasCount: 1, cardCount: 2, geracoes: 1, fees: null, net: null, reconciliationRequired: true });
    expect(data).not.toHaveProperty('gastoGeracao');
  });
  it('rejects invalid and overlong date ranges before querying data', async () => {
    expect((await GET(request('dateFrom=2026-02-30'))).status).toBe(400);
    expect((await GET(request('dateFrom=2024-01-01&dateTo=2026-10-31'))).status).toBe(400);
    expect((await GET(request('tipo=pedidos_mes&mes=2026-13'))).status).toBe(400);
    expect(getSupabaseEdge).not.toHaveBeenCalled();
  });
  it('preserves daily shape with UTC dates and package entitlements', async () => {
    tables.us_checkout_sessions = [session('song', 499, { sku: 'audio_only' }), session('keepsake', 999, { sku: 'combo_retrospectiva', order_id: 'order-2' })];
    const data = await (await GET(request('tipo=vendas_por_dia&mes=2026-10'))).json();
    expect(data.dias).toHaveLength(31);
    expect(data.timeZone).toBe('UTC');
    expect(data.dias[2]).toMatchObject({ dataIso: '2026-10-03', musicas: 2, videos: 1, cartas: 1, retrospectivas: 1, playbacks: 0, pedidosPagos: 2, faturamento: 14.98 });
  });
  it('returns safe order report data from server-stored cents without exposing extras or owner hashes', async () => {
    tables.orders[0].extras.us.ownerHash = 'private';
    tables.orders.push({ ...order('foreign'), extras: { us: { market: 'BR' } } });
    const data = await (await GET(request('tipo=pedidos_mes&mes=2026-10'))).json();
    expect(data.pedidos).toHaveLength(1);
    expect(data.pedidos[0]).toMatchObject({ paidAmount: 7.99, usPaidCents: 799, currency: 'usd' });
    expect(JSON.stringify(data)).not.toContain('private');
    expect(data.pedidos[0]).not.toHaveProperty('extras');
  });
  it('paginates rather than silently truncating Supabase results', async () => {
    tables.orders = Array.from({ length: 501 }, (_, index) => order(`order-${index}`));
    const data = await (await GET(request('tipo=pedidos_recentes&dias=8'))).json();
    expect(data.total).toBe(501);
    expect(requests.filter(item => item.table === 'orders').map(item => item.offset)).toEqual([0, 500]);
  });
});

import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/cloudflareContext';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseEdge } from '@/lib/supabase-edge';
import { getUsPackage } from '@/lib/usCatalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const DAY = 86400000;
const PAGE_SIZE = 500;
const MAX_PAGES = 20;
const ORDER_FIELDS = 'id,order_number,payment_status,paid_at,created_at,has_video_access,has_carta_access,has_retrospectiva_access,suno_generation_count,suno_requested_at,suno_provider,suno_task_id,extras';
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const paid = row => ['PAGO', 'PAGAMENTO_APROVADO'].includes(row.payment_status);
const dayKey = value => typeof value === 'string' ? value.slice(0, 10) : '';

function day(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) throw fail('Informe uma data válida no formato AAAA-MM-DD.');
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw fail('Informe uma data válida.');
  return date.getTime();
}

function reportRange(params, tipo) {
  const today = day(new Date().toISOString().slice(0, 10));
  if (tipo === 'pedidos_recentes') {
    const dias = Number(params.get('dias') || 8);
    if (!Number.isInteger(dias) || dias < 1 || dias > 30) throw fail('O período deve ter entre 1 e 30 dias.');
    return { start: today - dias * DAY, end: today + DAY, dias };
  }
  if (tipo === 'pedidos_mes' || tipo === 'vendas_por_dia') {
    const mes = params.get('mes') || new Date().toISOString().slice(0, 7);
    if (!/^(20\d{2})-(0[1-9]|1[0-2])$/.test(mes)) throw fail('Informe um mês válido no formato AAAA-MM.');
    const [year, month] = mes.split('-').map(Number);
    return { start: day(`${mes}-01`), end: Date.UTC(year, month, 1), mes };
  }
  const end = params.has('dateTo') ? day(params.get('dateTo')) + DAY : today + DAY;
  const start = params.has('dateFrom') ? day(params.get('dateFrom')) : end - 30 * DAY;
  if (start >= end || end - start > 366 * DAY) throw fail('Escolha um período de até 366 dias, com início anterior ao fim.');
  return { start, end };
}

async function rows(buildQuery) {
  const all = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await buildQuery().limit(PAGE_SIZE).offset(page * PAGE_SIZE);
    if (error || !Array.isArray(data)) throw fail('Não foi possível consultar o relatório. Tente novamente.', 503);
    all.push(...data);
    if (data.length < PAGE_SIZE) return all;
  }
  throw fail('O relatório excede 10.000 registros. Selecione um período menor.', 422);
}

function safeOrder(row) {
  const extras = row.extras || {};
  const cents = Number(extras.usPaidCents);
  const amount = Number.isSafeInteger(cents) && cents >= 0 ? cents / 100 : null;
  const isPaid = paid(row);
  return {
    id: row.id, orderNumber: row.order_number, paymentStatus: row.payment_status,
    createdAt: row.created_at, paidAt: row.paid_at, currency: 'usd',
    hasVideoAccess: isPaid && Boolean(row.has_video_access), hasCartaAccess: isPaid && Boolean(row.has_carta_access),
    hasRetrospectivaAccess: isPaid && Boolean(row.has_retrospectiva_access), hasPlaybackAccess: false,
    sunoGenerationCount: Number(row.suno_generation_count) || (row.suno_task_id ? 1 : 0), sunoRequestedAt: row.suno_requested_at,
    sunoProvider: row.suno_provider, sunoTaskId: row.suno_task_id,
    paidAmount: isPaid ? amount : 0, usPaidCents: isPaid ? cents : 0,
    videoPaidAt: isPaid && row.has_video_access ? row.paid_at : null,
    cartaPaidAt: isPaid && row.has_carta_access ? row.paid_at : null,
    retrospectivaPaidAt: isPaid && row.has_retrospectiva_access ? row.paid_at : null,
    videoAddonPaid: false, cartaAddonPaid: false, retrospectivaAddonPaid: false, playbackAddonPaid: false,
  };
}

function validSessions(sessions) {
  return sessions.filter(session => session.currency === 'usd' && session.revoked === false && session.paid_at && Number.isSafeInteger(Number(session.amount_cents)) && Number(session.amount_cents) > 0);
}

export async function GET(request) {
  let env = {};
  try { env = getRequestContext()?.env || {}; } catch { /* Local development has no Pages context. */ }
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status || 401, headers: { 'Cache-Control': 'no-store' } });
  try {
    const params = new URL(request.url).searchParams;
    const tipo = params.get('tipo') || 'faturamento';
    if (!['faturamento', 'vendas_por_dia', 'pedidos_mes', 'pedidos_recentes'].includes(tipo)) throw fail('Tipo de relatório inválido.');
    const range = reportRange(params, tipo);
    const start = new Date(range.start).toISOString();
    const end = new Date(range.end).toISOString();
    const db = getSupabaseEdge(env);
    if (!db) throw fail('O banco de dados não está configurado.', 503);
    const ordersQuery = () => db.from('orders').select(ORDER_FIELDS).is('deleted_at', null).eq('extras->us->>market', 'US');
    const sessionQuery = () => db.from('us_checkout_sessions').select('id,order_id,sku,amount_cents,currency,paid_at,revoked').eq('currency', 'usd').eq('revoked', false).gte('paid_at', start).lt('paid_at', end).order('paid_at').order('id');
    const base = { ok: true, currency: 'usd', timeZone: 'UTC', source: 'us_checkout_sessions', fees: null, net: null, reconciliationRequired: true };
    if (tipo === 'pedidos_mes' || tipo === 'pedidos_recentes') {
      const orders = await rows(() => ordersQuery().or(`and(created_at.gte.${start},created_at.lt.${end}),and(paid_at.gte.${start},paid_at.lt.${end})`).order('created_at').order('id'));
      return NextResponse.json({ ...base, mes: range.mes, dias: range.dias, total: orders.length, pedidos: orders.map(safeOrder) }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const [orders, rawSessions] = await Promise.all([
      rows(() => ordersQuery().gte('created_at', start).lt('created_at', end).order('created_at').order('id')),
      rows(sessionQuery),
    ]);
    const sessions = validSessions(rawSessions);
    const generations = order => Number(order.suno_generation_count) || (order.suno_task_id ? 1 : 0);
    if (tipo === 'faturamento') {
      const totalCents = sessions.reduce((sum, session) => sum + Number(session.amount_cents), 0);
      const geracoes = orders.reduce((sum, order) => sum + generations(order), 0);
      return NextResponse.json({ ...base, faturamentoTotal: totalCents / 100, vendasCount: new Set(sessions.map(session => session.order_id)).size, cardTotal: totalCents / 100, cardCount: sessions.length, geracoes, geracoesTotal: geracoes, geracoesKie: orders.filter(order => order.suno_provider === 'kie').reduce((sum, order) => sum + generations(order), 0), geracoesBot: 0 }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const dias = [];
    for (let current = range.start; current < range.end; current += DAY) {
      const dataIso = new Date(current).toISOString().slice(0, 10);
      const sales = sessions.filter(session => dayKey(session.paid_at) === dataIso);
      const created = orders.filter(order => dayKey(order.created_at) === dataIso);
      const rank = session => getUsPackage(session.sku)?.rank || 0;
      dias.push({ dia: Number(dataIso.slice(8)), dataIso, musicas: sales.length, videos: sales.filter(session => rank(session) >= 3).length, cartas: sales.filter(session => rank(session) >= 2).length, retrospectivas: sales.filter(session => rank(session) >= 4).length, playbacks: 0, pedidosPagos: new Set(sales.map(session => session.order_id)).size, faturamento: sales.reduce((sum, session) => sum + Number(session.amount_cents), 0) / 100, pedidosCriados: created.length, geracoes: created.reduce((sum, order) => sum + generations(order), 0) });
    }
    return NextResponse.json({ ...base, mes: range.mes, dias }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error.status ? error.message : 'Não foi possível gerar o relatório.' }, { status: error.status || 500, headers: { 'Cache-Control': 'no-store' } });
  }
}

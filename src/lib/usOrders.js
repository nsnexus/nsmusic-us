import { getRequestContext } from '@/lib/cloudflareContext';
import { getSupabaseEdge } from './supabase-edge';
import { mapSupabaseOrderToFirestore, mapOrderUpdatesToSupabase } from './supabaseSync';

export function getUsEnv() { try { return getRequestContext()?.env || {}; } catch { return {}; } }
export const usFailure = (message, status = 500) => Object.assign(new Error(message), { status });
export function usDatabase(env = {}) { const db = getSupabaseEdge(env); if (!db) throw usFailure('This service is not configured yet. Please try again later.', 503); return db; }
export async function usHash(value) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map(byte => byte.toString(16).padStart(2, '0')).join(''); }
export const usCookieName = id => 'ns_us_order_' + id;
export const isUsPaid = order => ['PAGO', 'PAGAMENTO_APROVADO'].includes(order?.paymentStatus);

export async function getUsOrder(id, env = {}) {
  if (!/^[a-f0-9-]{36}$/i.test(String(id))) throw usFailure('Please check your order link.', 400);
  const { data, error } = await usDatabase(env).from('orders').select('*').eq('id', id).is('deleted_at', null).maybeSingle();
  if (error) throw usFailure('We could not load your order. Please try again.', 503);
  if (!data || data.extras?.us?.market !== 'US') throw usFailure('Order not found.', 404);
  const mapped = mapSupabaseOrderToFirestore(data);
  return { ...mapped, paid: isUsPaid(mapped), extras: data.extras };
}

export async function requireOwnedUsOrder(request, id, env = {}) {
  const order = await getUsOrder(id, env);
  const name = usCookieName(id);
  const cookie = (request?.headers?.get('cookie') || '').split(';').map(item => item.trim()).find(item => item.startsWith(name + '='));
  let token = cookie ? cookie.substring(name.length + 1) : '';
  if (!token && request) {
    try {
      const url = new URL(request.url);
      const queryToken = url.searchParams.get('token');
      if (queryToken) token = queryToken;
    } catch (_) {}
  }
  if (!token || !/^[a-f0-9]{64}$/i.test(token) || await usHash(token) !== order.extras?.us?.ownerHash) throw usFailure('Open this order in the browser where you created it.', 403);
  return order;
}

export function publicUsOrder(order) {
  const paid = isUsPaid(order);
  const count = order.audioFiles?.length || (order.audioUrl ? 1 : 0);
  return {
    id: order.id, orderNumber: order.orderNumber, customerName: order.customerName, honoreeName: order.honoreeName,
    lyrics: order.lyrics, story: order.story, relationship: order.relationship, occasion: order.occasion, musicStyle: order.musicStyle, paymentStatus: order.paymentStatus, paid,
    productionStatus: order.productionStatus, sunoTaskId: order.sunoTaskId, sku: order.usPackageSku || order.extras?.us?.sku,
    hasCartaAccess: paid && Boolean(order.hasCartaAccess), hasVideoAccess: paid && Boolean(order.hasVideoAccess), hasRetrospectivaAccess: paid && Boolean(order.hasRetrospectivaAccess),
    audioFiles: Array.from({ length: count }, (_, index) => '/api/us/audio?orderId=' + order.id + '&track=' + index),
    audioUrl: count ? '/api/us/audio?orderId=' + order.id + '&track=0' : null,
    usLetter: order.usLetter || '', usVideo: order.usVideo || null, usVideoUrl: order.usVideoUrl || '', usRetrospective: order.usRetrospective || null,
    extras: { us: { spec: order.extras?.us?.spec } },
  };
}

export async function updateUsOrder(id, updates, env = {}) {
  const patch = mapOrderUpdatesToSupabase(updates);
  if (patch._extraFields) { patch.extras = patch._extraFields; delete patch._extraFields; }
  try {
    const { data, error } = await usDatabase(env).rpc('us_patch_order', { p_id: id, p_patch: patch });
    if (!error && data) return data;
  } catch (_) {}
  const { error: updateError } = await usDatabase(env).from('orders').eq('id', id).update(patch);
  if (updateError) throw usFailure('Your changes could not be saved. Please try again.', 503);
  return true;
}

export async function reserveUsGeneration(id, env = {}) {
  try {
    const { data, error } = await usDatabase(env).rpc('us_reserve_generation', { p_id: id });
    if (!error && typeof data === 'boolean') {
      if (data) return true;
      const order = await getUsOrder(id, env);
      if (order.sunoTaskId || order.productionStatus === 'GERANDO_AUDIO') return false;
    }
  } catch (_) {}
  const { data, error } = await usDatabase(env)
    .from('orders')
    .eq('id', id)
    .in('production_status', ['LETRA_CRIADA', 'ERRO_GERACAO', 'US_GENERATION_REVIEW'])
    .is('suno_task_id', null)
    .update({ production_status: 'GERANDO_AUDIO', suno_requested_at: new Date().toISOString() });
  if (error) throw usFailure('We could not start your song. Please try again.', 503);
  return Boolean(data && data.length > 0);
}

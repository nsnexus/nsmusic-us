import { getUsPackage } from './usCatalog';
import { usDatabase, usFailure } from './usOrders';
export { verifyStripeWebhookSignature } from './stripe';

export function usSiteUrl(env = {}) {
  const value = env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3011';
  const url = new URL(value);
  if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)) throw usFailure('A secure site URL is required.', 503);
  return url.origin;
}
export const STRIPE_API_VERSION = '2025-03-31.basil';

async function stripe(path, env, options = {}) {
  const key = env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
  if (!key) throw usFailure('Secure checkout is not configured yet.', 503);
  // Versão da API fixada: a partir da 2026-03-25.dahlia a Stripe renomeou os valores de ui_mode
  // ('embedded' → 'embedded_page') e passou a recusar o valor antigo. Sem fixar, a conta usa a versão
  // padrão dela e o checkout embutido quebra quando essa versão muda.
  const res = await fetch('https://api.stripe.com/v1/' + path, { ...options, headers: { Authorization: 'Bearer ' + key, 'Stripe-Version': STRIPE_API_VERSION, ...options.headers }, signal: AbortSignal.timeout(15000) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Só o tipo/código do erro (nunca a mensagem da Stripe) vai para o log e para o cliente, para dar
    // para diagnosticar sem expor detalhes internos.
    const codigo = String(data?.error?.code || data?.error?.type || res.status).replace(/[^a-z0-9_]/gi, '').slice(0, 40);
    console.warn('[usStripe] Stripe recusou', path.split('/')[0], codigo, data?.error?.param || '');
    throw usFailure(`Stripe is temporarily unavailable. Please try again. (code: ${codigo})`, 502);
  }
  return data;
}
export const retrieveUsSession = (id, env) => stripe('checkout/sessions/' + encodeURIComponent(id), env);

export function usPublishableKey(env = {}) {
  const key = String(env.STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '').trim();
  return /^pk_(live|test)_[A-Za-z0-9]+$/.test(key) ? key : '';
}

// embedded=true: Checkout embutido na própria página (ui_mode=embedded, volta por return_url).
// Sem chave publicável configurada, cai no Checkout hospedado da Stripe (comportamento antigo).
export function usCheckoutForm(order, sku, origin, { embedded = false } = {}) {
  const pack = getUsPackage(sku);
  if (!pack) throw usFailure('Please choose one of the four available packages.', 400);
  const language = order?.extras?.us?.spec?.language === 'es' ? 'es' : 'en';
  const delivery = origin + '/delivery?orderId=' + encodeURIComponent(order.id);
  const params = {
    mode: 'payment', locale: language, 'payment_method_types[0]': 'card',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': String(pack.priceCents),
    'line_items[0][price_data][product_data][name]': 'NS Music — ' + pack.name,
    'line_items[0][quantity]': '1', client_reference_id: order.id,
    'metadata[orderId]': order.id, 'metadata[sku]': sku, 'metadata[market]': 'US',
    'payment_intent_data[metadata][orderId]': order.id, 'payment_intent_data[metadata][market]': 'US',
  };
  if (embedded) {
    params.ui_mode = 'embedded';
    params.return_url = delivery + '&session_id={CHECKOUT_SESSION_ID}';
  } else {
    params.success_url = delivery + '&session_id={CHECKOUT_SESSION_ID}';
    params.cancel_url = delivery + '&cancelled=1';
  }
  if (order.customerEmail && String(order.customerEmail).trim()) {
    params.customer_email = String(order.customerEmail).trim();
  }
  return new URLSearchParams(params);
}
export async function createUsCheckout(order, sku, env) {
  const pack = getUsPackage(sku);
  const publishableKey = usPublishableKey(env);
  const embedded = Boolean(publishableKey);
  const form = usCheckoutForm(order, sku, usSiteUrl(env), { embedded });
  // A stable key prevents double clicks/retries from creating duplicate charges. The mode is part of the
  // key because Stripe rejects the same key reused with different parameters.
  const session = await stripe('checkout/sessions', env, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Idempotency-Key': 'ns-us-' + (embedded ? 'emb-' : '') + order.id + '-' + sku }, body: form.toString() });
  if (!session.id) throw usFailure('Stripe did not return a secure checkout.', 502);
  if (embedded ? !session.client_secret : (!session.url || !/^https:\/\/checkout\.stripe\.com\//.test(session.url))) throw usFailure('Stripe did not return a secure checkout.', 502);
  const { error } = await usDatabase(env).from('us_checkout_sessions').upsert({ id: session.id, order_id: order.id, sku, amount_cents: pack.priceCents, currency: 'usd' }, { onConflict: 'id' });
  if (error) throw usFailure('We could not prepare your order for payment. Please try again.', 503);
  return embedded
    ? { sessionId: session.id, clientSecret: session.client_secret, publishableKey, embedded: true }
    : { sessionId: session.id, checkoutUrl: session.url, embedded: false };
}

export function validateUsSession(session, record, expectedOrderId) {
  const pack = getUsPackage(record?.sku);
  return Boolean(pack && record && session?.id === record.id && record.order_id === expectedOrderId
    && session.client_reference_id === expectedOrderId && session.metadata?.orderId === expectedOrderId
    && session.metadata?.market === 'US' && session.metadata?.sku === pack.sku
    && session.mode === 'payment' && session.status === 'complete' && session.payment_status === 'paid'
    && session.currency === 'usd' && session.amount_total === pack.priceCents
    && record.amount_cents === pack.priceCents && record.currency === 'usd');
}
export async function fulfillUsSession(sessionId, expectedOrderId, env) {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId || '')) throw usFailure('Invalid checkout session.', 400);
  const db = usDatabase(env);
  const { data: record, error } = await db.from('us_checkout_sessions').select('*').eq('id', sessionId).maybeSingle();
  if (error) throw usFailure('Payment confirmation is temporarily unavailable.', 503);
  if (!record || (expectedOrderId && record.order_id !== expectedOrderId)) throw usFailure('This checkout does not belong to this order.', 403);
  const session = await retrieveUsSession(sessionId, env);
  if (session.payment_status !== 'paid') return false;
  if (!validateUsSession(session, record, expectedOrderId || record.order_id)) throw usFailure('Payment details did not match this order.', 409);
  const { data, error: applyError } = await db.rpc('us_fulfill_checkout', { p_session_id: sessionId, p_payment_intent: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null });
  if (applyError || !data) throw usFailure('We received your payment confirmation but could not update the order yet. Please retry.', 503);
  return true;
}

import { getUsPackage } from './usCatalog';
import { usDatabase, usFailure } from './usOrders';
export { verifyStripeWebhookSignature } from './stripe';

export function usSiteUrl(env = {}) {
  const value = env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3011';
  const url = new URL(value);
  if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)) throw usFailure('A secure site URL is required.', 503);
  return url.origin;
}
async function stripe(path, env, options = {}) {
  const key = env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
  if (!key) throw usFailure('Secure checkout is not configured yet.', 503);
  const res = await fetch('https://api.stripe.com/v1/' + path, { ...options, headers: { Authorization: 'Bearer ' + key, ...options.headers }, signal: AbortSignal.timeout(15000) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw usFailure('Stripe is temporarily unavailable. Please try again.', 502);
  return data;
}
export const retrieveUsSession = (id, env) => stripe('checkout/sessions/' + encodeURIComponent(id), env);

export function usCheckoutForm(order, sku, origin) {
  const pack = getUsPackage(sku);
  if (!pack) throw usFailure('Please choose one of the four available packages.', 400);
  return new URLSearchParams({
    mode: 'payment', locale: 'en', 'payment_method_types[0]': 'card',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': String(pack.priceCents),
    'line_items[0][price_data][product_data][name]': 'NS Music — ' + pack.name,
    'line_items[0][quantity]': '1', client_reference_id: order.id,
    'metadata[orderId]': order.id, 'metadata[sku]': sku, 'metadata[market]': 'US',
    'payment_intent_data[metadata][orderId]': order.id, 'payment_intent_data[metadata][market]': 'US',
    customer_email: order.customerEmail,
    success_url: origin + '/delivery?orderId=' + encodeURIComponent(order.id) + '&session_id={CHECKOUT_SESSION_ID}',
    cancel_url: origin + '/delivery?orderId=' + encodeURIComponent(order.id) + '&cancelled=1',
  });
}
export async function createUsCheckout(order, sku, env) {
  const pack = getUsPackage(sku);
  const form = usCheckoutForm(order, sku, usSiteUrl(env));
  // A stable key prevents double clicks/retries from creating duplicate charges.
  const session = await stripe('checkout/sessions', env, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Idempotency-Key': 'ns-us-' + order.id + '-' + sku }, body: form.toString() });
  if (!session.id || !session.url || !/^https:\/\/checkout\.stripe\.com\//.test(session.url)) throw usFailure('Stripe did not return a secure checkout.', 502);
  const { error } = await usDatabase(env).from('us_checkout_sessions').upsert({ id: session.id, order_id: order.id, sku, amount_cents: pack.priceCents, currency: 'usd' }, { onConflict: 'id' });
  if (error) throw usFailure('We could not prepare your order for payment. Please try again.', 503);
  return { sessionId: session.id, checkoutUrl: session.url };
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

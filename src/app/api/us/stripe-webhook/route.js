import { NextResponse } from 'next/server';
import { getUsEnv, usDatabase } from '@/lib/usOrders';
import { fulfillUsSession, verifyStripeWebhookSignature } from '@/lib/usStripe';
import { startPaidUsMusic } from '@/lib/usGeneration';
export const runtime = 'nodejs';
export async function POST(req) {
  const env = getUsEnv(); const secret = env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Webhook is not configured.' }, { status: 503 });
  const raw = await req.text();
  if (!await verifyStripeWebhookSignature(raw, req.headers.get('stripe-signature'), secret)) return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  try {
    const event = JSON.parse(raw);
    if (['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) {
      const sessionId = event.data.object.id;
      const paid = await fulfillUsSession(sessionId, null, env);
      if (paid) {
        const { data, error } = await usDatabase(env).from('us_checkout_sessions').select('order_id, amount_cents').eq('id', sessionId).maybeSingle();
        if (error || !data) throw new Error('Order confirmation pending.');
        await startPaidUsMusic(data.order_id, env);
        try {
          const { sendMetaPurchaseEvent } = await import('@/lib/metaCapi');
          const sessionObj = event.data?.object || {};
          const customerEmail = sessionObj.customer_details?.email || sessionObj.customer_email || '';
          const customerPhone = sessionObj.customer_details?.phone || '';
          const value = (data.amount_cents || sessionObj.amount_total || 499) / 100;
          await sendMetaPurchaseEvent({
            orderId: data.order_id,
            value,
            currency: 'USD',
            contentName: 'Custom Song',
            eventId: `purchase_${data.order_id}_us`,
            customerPhone,
            customerEmail,
          }, env);
        } catch (capiErr) {
          console.warn('[meta-capi-us] Falha ao enviar evento CAPI:', capiErr.message);
        }
      }
    }
    if (event.type === 'charge.dispute.created' || (event.type === 'charge.refunded' && event.data.object.refunded === true)) {
      const object = event.data.object;
      const paymentIntent = object.payment_intent;
      if (paymentIntent) { const { error } = await usDatabase(env).rpc('us_revoke_payment', { p_payment_intent: paymentIntent }); if (error) throw error; }
    }
    return NextResponse.json({ received: true });
  } catch { return NextResponse.json({ error: 'Payment processing will be retried.' }, { status: 503 }); }
}

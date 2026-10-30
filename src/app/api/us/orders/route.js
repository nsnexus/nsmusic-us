import { NextResponse } from 'next/server';
import { getUsEnv, usDatabase, usHash, usCookieName, requireOwnedUsOrder, publicUsOrder } from '@/lib/usOrders';
import { validateUsSpec, readUsJson } from '@/lib/usGeneration';
import { getUsPackage } from '@/lib/usCatalog';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await readUsJson(req);
    const spec = validateUsSpec(body);
    const pack = getUsPackage(body.sku || 'audio_only');
    if (!pack || typeof body.lyrics !== 'string' || body.lyrics.trim().length < 80 || body.lyrics.length > 4500) {
      return NextResponse.json({ error: 'Please use 80–4,500 characters of lyrics.' }, { status: 400 });
    }
    const email = typeof body.customerEmail === 'string' ? body.customerEmail.trim() : '';
    const phone = typeof body.customerPhone === 'string' ? body.customerPhone.trim() : '';

    if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (body.termsAccepted !== true) {
      return NextResponse.json({ error: 'Please accept the terms before creating your order.' }, { status: 400 });
    }
    const env = getUsEnv();
    const id = crypto.randomUUID();
    const token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
    const now = new Date().toISOString();
    const row = {
      id,
      order_number: 'US-' + Date.now().toString(36).toUpperCase() + '-' + id.slice(0, 5).toUpperCase(),
      customer_name: spec.senderName || 'A friend',
      customer_email: email,
      customer_phone: phone,
      honoree_name: spec.recipientName,
      relationship: spec.relationship,
      occasion: spec.occasion,
      story: spec.story,
      music_style: spec.genre,
      music_mood: spec.mood,
      voice_type: spec.vocals,
      lyrics: body.lyrics.trim(),
      production_status: 'LETRA_CRIADA',
      payment_status: 'AGUARDANDO_PAGAMENTO',
      created_at: now,
      updated_at: now,
      extras: {
        us: {
          market: 'US',
          currency: 'usd',
          sku: pack.sku,
          spec,
          ownerHash: await usHash(token),
          customerPhone: phone,
        },
        paymentMethod: 'stripe',
        paymentGateway: 'stripe',
        termsAccepted: true,
        termsAcceptedAt: now,
        total: pack.priceCents / 100,
      },
    };
    const { error } = await usDatabase(env).from('orders').insert(row);
    if (error) {
      console.error('[us/orders] Insert error:', error);
      throw new Error(error.message || 'We could not save your order. Please try again.');
    }
    const response = NextResponse.json({ order: { id, orderNumber: row.order_number } }, { status: 201 });
    response.cookies.set(usCookieName(id), token, {
      httpOnly: true,
      secure: new URL(req.url).protocol === 'https:',
      sameSite: 'lax',
      path: '/',
      maxAge: 90 * 86400,
    });
    return response;
  } catch (error) {
    console.error('[us/orders] POST error:', error);
    return NextResponse.json({ error: error.message || 'We could not create your order.' }, { status: error.status || 503 });
  }
}

export async function GET(req) {
  try {
    const id = new URL(req.url).searchParams.get('orderId');
    const order = await requireOwnedUsOrder(req, id, getUsEnv());
    return NextResponse.json({ order: publicUsOrder(order) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 503 });
  }
}

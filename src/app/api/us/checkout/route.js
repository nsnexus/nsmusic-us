import { NextResponse } from 'next/server';
import { requireOwnedUsOrder, getUsEnv, isUsPaid } from '@/lib/usOrders';
import { createUsCheckout } from '@/lib/usStripe';
export const runtime = 'nodejs';
export async function POST(req) {
  try { const { orderId, sku } = await req.json(); const env = getUsEnv(); const order = await requireOwnedUsOrder(req, orderId, env); if (isUsPaid(order)) return NextResponse.json({ error: 'This order is already paid. Open your delivery page.' }, { status: 409 }); return NextResponse.json(await createUsCheckout(order, sku, env)); }
  catch (error) { return NextResponse.json({ error: error.message || 'Could not open checkout.' }, { status: error.status || 503 }); }
}

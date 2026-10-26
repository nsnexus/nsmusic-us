import { NextResponse } from 'next/server';
import { getUsEnv, requireOwnedUsOrder, publicUsOrder, getUsOrder, isUsPaid } from '@/lib/usOrders';
import { fulfillUsSession } from '@/lib/usStripe';
export const runtime = 'nodejs';
export async function POST(req) {
  try { const { orderId, sessionId } = await req.json(); const env = getUsEnv(); const order = await requireOwnedUsOrder(req, orderId, env); if (!isUsPaid(order) && sessionId) await fulfillUsSession(sessionId, orderId, env); const current = await getUsOrder(orderId, env); return NextResponse.json({ paid: isUsPaid(current), order: publicUsOrder(current) }, { headers: { 'Cache-Control': 'no-store' } }); }
  catch (error) { return NextResponse.json({ error: error.message || 'Could not check payment.' }, { status: error.status || 503 }); }
}

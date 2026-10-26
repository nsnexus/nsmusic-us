import { getUsEnv, isUsPaid, requireOwnedUsOrder, updateUsOrder } from '@/lib/usOrders';
import { validateGiftUpdate } from '@/lib/usGifts';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const input = await request.json();
    if (!input || typeof input.orderId !== 'string' || !input.orderId) return Response.json({ error: 'Choose an order.' }, { status: 400 });
    const env = getUsEnv();
    const order = await requireOwnedUsOrder(request, input.orderId, env);
    const updates = validateGiftUpdate({ ...order, id: input.orderId, paid: isUsPaid(order) }, input, env);
    await updateUsOrder(input.orderId, updates, env);
    return Response.json({ ok: true, ...updates });
  } catch (error) {
    const status = error.status || (error instanceof SyntaxError ? 400 : 500);
    return Response.json({ error: status < 500 ? error.message : 'Your gift could not be saved. Please try again.' }, { status });
  }
}

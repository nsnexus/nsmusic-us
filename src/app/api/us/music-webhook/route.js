import { getUsEnv } from '@/lib/usOrders';
import { usMusicCallbackSignature, refreshPaidUsMusic } from '@/lib/usGeneration';
export const runtime = 'nodejs';
export async function POST(req) {
  try {
    const params = new URL(req.url).searchParams; const id = params.get('orderId'); const provided = params.get('signature') || ''; const env = getUsEnv();
    if (!/^[a-f0-9-]{36}$/i.test(id || '')) return Response.json({ error: 'Invalid order.' }, { status: 400 });
    const expected = await usMusicCallbackSignature(id, env);
    if (!expected || provided.length !== expected.length) return Response.json({ error: 'Invalid callback signature.' }, { status: 401 });
    let different = 0; for (let i = 0; i < expected.length; i++) different |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
    if (different) return Response.json({ error: 'Invalid callback signature.' }, { status: 401 });
    // Never trust callback audio/status: independently query the stored task at the provider.
    const result = await refreshPaidUsMusic(id, env);
    return Response.json({ received: true, status: result.status });
  } catch { return Response.json({ error: 'Music confirmation will be retried.' }, { status: 503 }); }
}

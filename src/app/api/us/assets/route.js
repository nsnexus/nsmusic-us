import { getUsEnv, requireOwnedUsOrder, isUsPaid } from '@/lib/usOrders';
import { ownedAssetKey } from '@/lib/usAssets';
export const runtime = 'nodejs';
export async function GET(req) {
  try {
    const env = getUsEnv(); const params = new URL(req.url).searchParams; const id = params.get('orderId'); const key = params.get('key');
    const order = await requireOwnedUsOrder(req, id, env);
    if (!isUsPaid(order) || !ownedAssetKey(key, id)) return Response.json({ error: 'This file is not available.' }, { status: 403 });
    if (!env.nsmusic_media) return Response.json({ error: 'Storage is not configured.' }, { status: 503 });
    const object = await env.nsmusic_media.get(key);
    if (!object) return Response.json({ error: 'File not found.' }, { status: 404 });
    return new Response(object.body, { headers: { 'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch (error) { return Response.json({ error: error.message }, { status: error.status || 503 }); }
}

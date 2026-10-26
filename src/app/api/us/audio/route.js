import { getUsEnv, requireOwnedUsOrder, isUsPaid } from '@/lib/usOrders';
import { fetchUsAudio } from '@/lib/usAssets';
import { usAudioKey } from '@/lib/usArchive';
export const runtime = 'nodejs';
export async function GET(req) {
  try {
    const env = getUsEnv(); const params = new URL(req.url).searchParams; const id = params.get('orderId'); const index = Number(params.get('track') || 0);
    const order = await requireOwnedUsOrder(req, id, env);
    if (!isUsPaid(order)) return Response.json({ error: 'Payment confirmation is required.' }, { status: 403 });
    if (!Number.isInteger(index) || index < 0 || index > 9) return Response.json({ error: 'Invalid audio track.' }, { status: 400 });
    if (env.nsmusic_media) {
      const object = await env.nsmusic_media.get(usAudioKey(id, index));
      if (object) { const headers = new Headers({ 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, no-store' }); if(params.get('download') === '1') headers.set('Content-Disposition','attachment; filename="NS-Music-' + order.orderNumber + '.mp3"'); return new Response(object.body, { headers }); }
    }
    const item = order.audioFiles?.[index] || (index === 0 ? order.audioUrl : null); const url = typeof item === 'string' ? item : item?.audioUrl || item?.audio_url;
    if (!url) return Response.json({ error: 'Your song is still being created.' }, { status: 404 });
    const range = req.headers.get('range'); if (range && !/^bytes=\d*-\d*$/.test(range)) return new Response(null, { status: 416 });
    const upstream = await fetchUsAudio(url, range, env); const headers = new Headers({ 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' });
    for (const name of ['content-length','content-range','accept-ranges']) if (upstream.headers.has(name)) headers.set(name, upstream.headers.get(name));
    if (params.get('download') === '1') headers.set('Content-Disposition', 'attachment; filename="NS-Music-' + order.orderNumber + '.mp3"');
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (error) { return Response.json({ error: error.message || 'Could not load audio.' }, { status: error.status || 503 }); }
}

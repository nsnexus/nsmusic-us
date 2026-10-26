import { NextResponse } from 'next/server';
import { getUsEnv, requireOwnedUsOrder, isUsPaid } from '@/lib/usOrders';
export const runtime = 'nodejs';
export async function POST(req) {
  try {
    const env = getUsEnv(); const params = new URL(req.url).searchParams; const orderId = params.get('orderId');
    const order = await requireOwnedUsOrder(req, orderId, env);
    if (!isUsPaid(order) || !(order.hasVideoAccess || order.hasRetrospectivaAccess)) return NextResponse.json({ error: 'A photo gift package is required.' }, { status: 403 });
    if (!env.nsmusic_media) return NextResponse.json({ error: 'Photo storage is not configured yet.' }, { status: 503 });
    const video = params.get('type') === 'video'; const limit = video ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (Number(req.headers.get('content-length')) > limit + 65536) return NextResponse.json({ error: 'The file is too large.' }, { status: 413 });
    const form = await req.formData(); const file = form.get('file');
    const types = video ? { 'video/webm': 'webm', 'video/mp4': 'mp4' } : { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
    if (!file || typeof file === 'string' || !types[file.type] || file.size < 1 || file.size > limit) return NextResponse.json({ error: video ? 'Choose an MP4 or WebM video smaller than 50 MB.' : 'Choose a JPG, PNG or WebP photo smaller than 5 MB.' }, { status: 400 });
    const key = 'us/orders/' + orderId + '/' + (video ? 'videos/' : 'images/') + crypto.randomUUID() + '.' + types[file.type];
    await env.nsmusic_media.put(key, file, { httpMetadata: { contentType: file.type, cacheControl: 'private, no-store' } });
    return NextResponse.json({ key, url: '/api/us/assets?orderId=' + orderId + '&key=' + encodeURIComponent(key) });
  } catch (error) { return NextResponse.json({ error: error.message || 'Upload failed. Please try again.' }, { status: error.status || 503 }); }
}

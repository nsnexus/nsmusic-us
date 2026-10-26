import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
const removed = /\/(voice|voz|playback|karaoke|credits|efi|gateway|whatsapp|cron|support\/pix|payments|webhooks)(\/|$)/;
export async function middleware(request) {
  const path = request.nextUrl.pathname;
  const aliases = { '/criar': '/create', '/entrega': '/delivery', '/termos-de-uso': '/terms', '/politica-de-privacidade': '/privacy' };
  if (aliases[path]) { const url = request.nextUrl.clone(); url.pathname = aliases[path]; return NextResponse.redirect(url); }
  if (path === '/admin/voz' || (path.startsWith('/api/') && removed.test(path))) return NextResponse.json({ error: 'This product or payment method is not available in the US store.' }, { status: 410 });
  if (path.startsWith('/api/us/')) return NextResponse.next();
  if (path.startsWith('/api/')) {
    const admin = await requireAdmin(request, process.env);
    if (!admin.ok) return NextResponse.json({ error: 'Studio authorization is required.' }, { status: admin.status });
  }
  return NextResponse.next();
}
export const config = { matcher: ['/api/:path*','/admin/voz','/criar','/entrega','/termos-de-uso','/politica-de-privacidade'] };

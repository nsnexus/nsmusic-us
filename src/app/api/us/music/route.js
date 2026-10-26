import { NextResponse } from 'next/server';
import { getUsMusic, startUsMusic, readUsJson } from '@/lib/usGeneration';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function respond(operation) {
  try {
    return NextResponse.json(await operation(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ status: 'ERROR', tracks: [], error: error.status ? error.message : 'We could not process your song. Please try again shortly.' }, { status: error.status || 500, headers: { 'Cache-Control': 'no-store' } });
  }
}

export async function POST(request) {
  return respond(async () => startUsMusic(request, (await readUsJson(request)).orderId));
}

export async function GET(request) {
  return respond(() => getUsMusic(request, new URL(request.url).searchParams.get('orderId')));
}

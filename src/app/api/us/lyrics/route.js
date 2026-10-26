import { NextResponse } from 'next/server';
import { generateUsLyrics, readUsJson } from '@/lib/usGeneration';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const lyrics = await generateUsLyrics(await readUsJson(request));
    return NextResponse.json({ lyrics }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error.status ? error.message : 'We could not create your lyrics. Please try again.' }, { status: error.status || 500 });
  }
}

import { NextResponse } from 'next/server';
import { readUsJson } from '@/lib/usGeneration';
import { suggestUsStory } from '@/lib/usStory';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const suggestion = await suggestUsStory(await readUsJson(request));
    return NextResponse.json({ suggestion }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error.status ? error.message : 'We could not create a suggestion. Please try again.' }, { status: error.status || 500 });
  }
}

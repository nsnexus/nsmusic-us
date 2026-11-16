import { NextResponse } from 'next/server';
import { getUsEnv } from '@/lib/usOrders';
import { getSupabaseEdge } from '@/lib/supabase-edge';
import { loadCountries, publicCountries, detectCountryCode } from '@/lib/usCountries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lista pública de países ativos e seus ritmos (sem os prompts internos), mais o país detectado.
export async function GET(req) {
  const countries = publicCountries(await loadCountries(getSupabaseEdge(getUsEnv())));
  const detected = detectCountryCode(req.headers);
  return NextResponse.json(
    { countries, detected: countries.some((c) => c.code === detected) ? detected : '' },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

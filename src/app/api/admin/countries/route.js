import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getUsEnv } from '@/lib/usOrders';
import { getSupabaseEdge } from '@/lib/supabase-edge';
import { loadCountries, saveCountries, DEFAULT_COUNTRIES } from '@/lib/usCountries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// O painel brasileiro (nsmusic.ia.br/admin → Países EUA) edita esta lista servidor-a-servidor com a
// chave US_PANEL_TOKEN (mesmo valor nos dois Workers). Os bancos continuam separados.
function iguais(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function tokenDoPainelBr(req, env) {
  const esperado = String(env.US_PANEL_TOKEN || '').trim();
  return esperado.length >= 32 && iguais(String(req.headers.get('x-panel-token') || '').trim(), esperado);
}

async function autorizar(req, env) {
  if (tokenDoPainelBr(req, env)) return null;
  const admin = await requireAdmin(req, env);
  return admin.ok ? null : NextResponse.json({ error: admin.error || 'Acesso restrito.' }, { status: admin.status || 401 });
}

export async function GET(req) {
  const env = { ...process.env, ...getUsEnv() };
  const negado = await autorizar(req, env);
  if (negado) return negado;
  return NextResponse.json({ countries: await loadCountries(getSupabaseEdge(env)), defaults: DEFAULT_COUNTRIES });
}

export async function PUT(req) {
  const env = { ...process.env, ...getUsEnv() };
  const negado = await autorizar(req, env);
  if (negado) return negado;
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 }); }
  const db = getSupabaseEdge(env);
  if (!db) return NextResponse.json({ error: 'Banco não configurado.' }, { status: 503 });
  try {
    const countries = await saveCountries(db, body?.countries, '');
    return NextResponse.json({ ok: true, countries });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Não foi possível salvar.' }, { status: 400 });
  }
}

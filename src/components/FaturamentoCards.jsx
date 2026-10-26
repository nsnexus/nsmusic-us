'use client';

import { useState, useEffect } from 'react';
import { getAdminAuthToken } from '@/lib/authClient';

// Totais brutos do período; taxas, líquido e custos são conciliados nos provedores.
export default function FaturamentoCards({ dateFrom, dateTo, reloadTrigger }) {
  const [supaStats, setSupaStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    (async () => {
      setLoading(true);
      setErro('');

      // 1. Tenta buscar direto os totais calculados no Supabase (alta performance)
      try {
        let token = await getAdminAuthToken();
        const params = new URLSearchParams({ tipo: 'faturamento' });
        if (dateFrom) params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);

        let res = await fetch(`/api/admin/reports?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        // Se 401, tenta renovar o token e repetir
        if (res.status === 401) {
          const freshToken = await getAdminAuthToken(true);
          if (freshToken && freshToken !== token) {
            token = freshToken;
            res = await fetch(`/api/admin/reports?${params.toString()}`, {
              headers: { Authorization: `Bearer ${freshToken}` }
            });
          }
        }

        if (res.ok) {
          const json = await res.json().catch(() => null);
          if (json?.ok && typeof json.faturamentoTotal === 'number') {
            if (!ativo) return;
            setSupaStats(json);
            setLoading(false);
            return;
          }
        }
        if (ativo) setErro('Não foi possível carregar os valores do período.');
      } catch (err) {
        console.warn('[FaturamentoCards] Falha ao consultar relatórios:', err.message);
        if (ativo) setErro('Não foi possível carregar os valores do período.');
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => { ativo = false; };
  }, [dateFrom, dateTo, reloadTrigger]);

  if (loading) return <p style={{ color: '#64748b', margin: '16px 0' }}>Carregando valores do período...</p>;
  if (erro || !supaStats) return <p style={{ color: '#dc2626', margin: '16px 0' }}>{erro || 'Não foi possível carregar os valores do período.'}</p>;

  const cards = [
    { label: 'Faturamento bruto (USD)', valor: 'US$ ' + Number(supaStats.faturamentoTotal || 0).toFixed(2).replace('.', ','), cor: '#059669', sub: 'Taxas, líquido e repasses: conciliar no Stripe.' },
    { label: 'Vendas (pagas)', valor: supaStats.vendasCount ?? 0, cor: '#0f172a', sub: null },
    { label: 'Total Gerações', valor: supaStats.geracoesTotal ?? supaStats.geracoes ?? 0, cor: '#d97706', sub: null },
    { label: 'Gerações Kie.ai', valor: supaStats.geracoesKie ?? 0, cor: '#7c3aed', sub: 'Custos exigem conciliação com o provedor.' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
      {cards.map((c) => (
        <div
          key={c.label}
          style={{
            background: '#fff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          }}
        >
          <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: '600', lineHeight: '1.2' }}>{c.label}</span>
          <h2 style={{ margin: 0, fontSize: '1.28rem', fontWeight: '800', color: c.cor, letterSpacing: '-0.02em', lineHeight: '1.2' }}>{c.valor}</h2>
          {c.sub && (
            <span style={{ fontSize: '0.68rem', fontWeight: '700', color: c.sub.includes('Economia') ? '#059669' : '#0284c7', marginTop: '2px' }}>
              {c.sub}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

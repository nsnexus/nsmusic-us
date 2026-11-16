'use client';

// "Como você quer emocionar?" do site brasileiro, com os 4 pacotes em dólar e pagamento só por
// cartão (Stripe). O botão chama `onPay(sku)`; quem abre o Stripe é a página de entrega.

import { Fragment } from 'react';
import { CreditCard, Loader2, ArrowRight } from 'lucide-react';
import { US_PACKAGES, formatUsd } from '@/lib/usCatalog';
import PackageCard from './PackageCard';
import InlinePayButton from './InlinePayButton';

export default function CheckoutCartao({ selected, onSelect, onPay, busy, error, t }) {
  const c = t.checkout;
  const packs = US_PACKAGES.map((p) => ({ ...p, ...c.packages[p.sku] }));
  const pack = packs.find((p) => p.sku === selected) || packs[0];
  const base = packs.find((p) => p.sku === 'audio_only');
  const video = packs.find((p) => p.sku === 'combo');
  const diff = video && base ? video.priceCents - base.priceCents : 0;

  return (
    <section id="pagamento" aria-label={c.title} style={{ marginTop: '32px' }}>
      <div className="nx-section-heading" style={{ marginBottom: '22px' }}>
        <h2 style={{ font: '1.9rem/1.2 var(--nx-display, Georgia, serif)', color: 'var(--nx-ink, #29232d)', margin: '0 0 8px' }}>{c.title}</h2>
        <p style={{ color: 'var(--nx-soft, #6c636f)', fontSize: '0.96rem', margin: 0 }}>{c.sub}</p>
      </div>

      {diff > 0 && (
        <p style={{ margin: '0 0 14px', color: '#29232d', fontSize: '0.96rem', fontWeight: 700 }}>{c.upgrade(formatUsd(diff))}</p>
      )}

      <div className="nx-package-grid" role="radiogroup" aria-label={c.groupLabel}>
        {packs.map((item) => (
          <Fragment key={item.sku}>
            <PackageCard pack={item} isSelected={selected === item.sku} onSelect={() => onSelect(item.sku)} disabled={busy} oneTime={c.oneTime} />
            {selected === item.sku && (
              <InlinePayButton priceCents={item.priceCents} onClick={() => onPay(item.sku)} busy={busy} t={c} />
            )}
          </Fragment>
        ))}
      </div>

      <div className="nx-card nx-checkout-summary" id="checkout-panel" style={{
        display: 'flex', flexDirection: 'column', gap: '16px', background: '#ffffff', border: '1.5px solid var(--nx-line, #e7e0e8)',
        borderRadius: '16px', padding: '22px 20px', margin: '24px 0 16px', boxSizing: 'border-box', width: '100%', maxWidth: '100%', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--nx-purple, #67408b)' }}>{c.yourPack}</span>
            <div style={{ fontSize: '1.25rem', color: 'var(--nx-ink, #29232d)', margin: '4px 0 4px', fontWeight: 800 }}><strong>{pack.label}</strong></div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--nx-muted, #4e4653)' }}>{pack.includes.join(' · ')}</p>
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 900, color: 'var(--nx-ink, #29232d)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{formatUsd(pack.priceCents)}</div>
        </div>

        {error && <p className="nx-message nx-error" role="alert" style={{ margin: 0 }}>{error}</p>}

        <button type="button" className="nx-button nx-primary" disabled={busy} onClick={() => onPay(pack.sku)}
          style={{
            width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '16px 20px', fontSize: '1.05rem', fontWeight: 800, borderRadius: '14px',
            background: 'var(--nx-pay, #059669)', color: '#ffffff', border: 'none', cursor: busy ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '52px',
          }}>
          {busy
            ? (<><Loader2 size={18} aria-hidden="true" /><span>{c.opening}</span></>)
            : (<><CreditCard size={18} aria-hidden="true" /><span>{c.pay(formatUsd(pack.priceCents))}</span><ArrowRight size={18} aria-hidden="true" /></>)}
        </button>
        <p style={{ margin: 0, textAlign: 'center', fontSize: '0.8rem', color: 'var(--nx-soft, #6c636f)' }}>{c.secure}</p>
      </div>
    </section>
  );
}

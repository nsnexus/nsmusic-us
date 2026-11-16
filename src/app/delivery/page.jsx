'use client';

// Página de entrega da loja internacional, copiada do /entrega do site brasileiro: mesmo cabeçalho,
// mesmo cartão da música com prévia de 60s, mesma escolha de pacotes, comparativo e selos. O que
// muda: idioma (do pedido), 4 pacotes em dólar e pagamento só por cartão (Stripe). A liberação
// continua sendo decidida no servidor (payment-status confere a sessão da Stripe).

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { trackFbPurchase } from '@/lib/metaPixel';
import { getUsPackage } from '@/lib/usCatalog';
import EmbeddedCheckout from '@/components/us/EmbeddedCheckout';
import { StudioAudioAnimation } from '@/components/StudioAnimations';
import SongCard from '@/components/us/br/entrega/SongCard';
import CheckoutCartao from '@/components/us/br/entrega/CheckoutCartao';
import MobileValueComparison from '@/components/us/br/entrega/MobileValueComparison';
import MobileTrustBadges from '@/components/us/br/entrega/MobileTrustBadges';
import MobileStickyBar from '@/components/us/br/entrega/MobileStickyBar';
import { textosEntrega } from '@/components/us/br/entrega/textosEntrega';
import { orderLanguage } from '@/lib/usDeliveryI18n';

async function api(url, body, signal) {
  const response = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    signal,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data.error || '');
    err.fromServer = true;
    throw err;
  }
  return data;
}

function tracksFrom(order) {
  if (Array.isArray(order?.audioFiles)) return order.audioFiles.map((x) => (typeof x === 'string' ? x : x?.audioUrl || x?.url)).filter(Boolean);
  return order?.audioUrl ? [order.audioUrl] : [];
}

const isPaidOrder = (o) => o?.paid === true || ['PAID', 'PAGO', 'PAGAMENTO_APROVADO', 'paid'].includes(o?.paymentStatus) || o?.status === 'PAID';

function irParaPagamento() {
  const el = document.getElementById('pagamento') || document.getElementById('checkout-panel');
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function DeliveryPage() {
  const [order, setOrder] = useState(null);
  const [orderId, setOrderId] = useState('');
  const [tracks, setTracks] = useState([]);
  const [phase, setPhase] = useState('loading');
  const [error, setError] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');
  const [notice, setNotice] = useState('');
  const [run, setRun] = useState(0);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [selectedSku, setSelectedSku] = useState('combo');
  const [embedded, setEmbedded] = useState(null);
  const [storedCountry, setStoredCountry] = useState('');
  const checkoutController = useRef(null);
  const mounted = useRef(true);

  // Idioma do pedido; antes de o pedido chegar, vale o país escolhido no pop-up.
  const lang = orderLanguage(order, storedCountry);
  const t = textosEntrega(lang);
  // Em espanhol, a mensagem do servidor (em inglês) dá lugar à genérica do idioma.
  const msg = (e, fallback) => (lang === 'en' && e?.message ? e.message : fallback);

  useEffect(() => {
    mounted.current = true;
    try { setStoredCountry(localStorage.getItem('ns_us_country') || ''); } catch { /* sem armazenamento */ }
    return () => {
      mounted.current = false;
      checkoutController.current?.abort();
    };
  }, []);

  async function startCheckout(sku) {
    if (checkoutBusy || !orderId) return;
    setCheckoutError('');
    setCheckoutBusy(true);
    checkoutController.current = new AbortController();
    try {
      const result = await api('/api/us/checkout', { orderId, sku }, checkoutController.current.signal);
      if (result.embedded && result.clientSecret && result.publishableKey) {
        if (mounted.current) {
          setEmbedded({ clientSecret: result.clientSecret, publishableKey: result.publishableKey });
          setCheckoutBusy(false);
        }
        return;
      }
      const destination = new URL(result.checkoutUrl);
      if (destination.protocol !== 'https:') throw new Error(t.errors.insecure);
      if (mounted.current) window.location.assign(destination.href);
    } catch (e) {
      if (e.name !== 'AbortError' && mounted.current) {
        setCheckoutError(msg(e, t.errors.checkout));
        setCheckoutBusy(false);
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let timer;
    const signal = controller.signal;
    const wait = (ms) => new Promise((resolve, reject) => {
      timer = setTimeout(resolve, ms);
      signal.addEventListener('abort', () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
    });

    const params = new URLSearchParams(window.location.search);
    const id = params.get('orderId');
    const sessionId = params.get('session_id');
    setOrderId(id || '');
    setError(null);
    if (params.get('cancelled') === '1') setNotice('cancelled');
    setPhase('loading');

    async function load() {
      try {
        if (!id) { const e = new Error(''); e.code = 'missingOrder'; throw e; }
        let data = await api('/api/us/orders?orderId=' + encodeURIComponent(id), null, signal);
        let current = data.order;
        if (sessionId) {
          if (active) setPhase('confirming');
          data = await api('/api/us/payment-status', { orderId: id, sessionId }, signal);
          current = data.order || current;
        }
        if (!active) return;
        setOrder(current);
        if (current?.sku && getUsPackage(current.sku)) setSelectedSku(current.sku);

        if (isPaidOrder(current)) {
          try {
            const k = 'fb_purchased_' + id;
            if (!window.sessionStorage.getItem(k)) {
              window.sessionStorage.setItem(k, '1');
              trackFbPurchase({
                orderId: id,
                value: typeof current.total === 'number' && current.total > 0 ? current.total : (getUsPackage(current.sku)?.priceCents || 499) / 100,
                currency: 'USD',
                contentName: current.packageName || current.sku || 'Custom Song',
                eventId: `purchase_${id}_us`,
                email: current.customerEmail || current.customer_email,
                phone: current.customerPhone || current.customer_phone,
              });
            }
          } catch { /* pixel opcional */ }
        }

        const existing = tracksFrom(current);
        if (existing.length) { setTracks(existing); setPhase('ready'); return; }

        setPhase('generating');
        try {
          const startRes = await api('/api/us/music', { orderId: id }, signal);
          if (startRes?.status === 'ERROR') { const e = new Error(startRes.error || ''); e.code = 'start'; throw e; }
        } catch (startErr) {
          if (startErr.name !== 'AbortError' && active) {
            setError({ code: 'start', message: startErr.message });
            setPhase('error');
            return;
          }
        }

        for (let attempt = 0; attempt < 45; attempt++) {
          await wait(attempt === 0 ? 3000 : Math.min(4000 + attempt * 1500, 15000));
          const result = await api('/api/us/music?orderId=' + encodeURIComponent(id), null, signal);
          if (!active) return;
          if (result.status === 'ERROR') { const e = new Error(result.error || ''); e.code = 'song'; throw e; }
          if (result.status === 'COMPLETED') {
            const files = (result.tracks || []).map((x) => (typeof x === 'string' ? x : x?.audioUrl || x?.url)).filter(Boolean);
            if (files.length) { setTracks(files); setPhase('ready'); return; }
          }
        }
        if (active) setPhase('waiting');
      } catch (e) {
        if (e.name !== 'AbortError' && active) {
          setError({ code: e.code || 'load', message: e.message });
          setPhase('error');
        }
      }
    }

    load();
    return () => { active = false; controller.abort(); clearTimeout(timer); };
  }, [run]);

  const paid = isPaidOrder(order);
  const nome = order?.honoreeName || '';
  const errorText = !error ? '' : error.code === 'missingOrder' ? t.errors.missingOrder : msg(error, t.errors[error.code] || t.errors.load);
  const hasGiftExtras = paid && (order?.hasCartaAccess || order?.hasVideoAccess || order?.hasRetrospectivaAccess);

  let cabecalho;
  if (phase === 'ready' && paid) cabecalho = [t.paidEyebrow, t.paidTitle, t.paidSub(nome)];
  else if (phase === 'ready') cabecalho = [t.eyebrow, t.title, t.sub(nome)];
  else if (phase === 'generating' || phase === 'waiting') cabecalho = [t.genEyebrow, t.genTitle, phase === 'waiting' ? t.waitingSub : t.genSub(nome)];
  else if (phase === 'confirming') cabecalho = [t.paidEyebrow, t.genTitle, t.confirming];
  else cabecalho = [t.eyebrow, t.title, phase === 'loading' ? t.loading : ''];

  return (
    <div className="nx-experience" lang={lang === 'es' ? 'es-MX' : 'en'}>
      <header className="nx-header">
        <div className="nx-header-inner">
          <Link href="/" className="nx-brand"><Image src="/logo.png" alt="NS Music" width={44} height={44} /><span>{t.brand}</span></Link>
        </div>
      </header>

      <main className="nx-main nx-delivery-main" style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px 90px', width: '100%', boxSizing: 'border-box' }}>
        <div className="nx-head">
          <span className="nx-eyebrow">{cabecalho[0]}</span>
          <h1>{cabecalho[1]}</h1>
          {cabecalho[2] && <p>{cabecalho[2]}</p>}
        </div>

        {notice === 'cancelled' && phase === 'ready' && !paid && (
          <p className="nx-message" role="status">{t.cancelled}</p>
        )}

        {(phase === 'generating' || phase === 'confirming' || phase === 'loading') && (
          <div className="nx-card" style={{ textAlign: 'center', padding: '28px 20px' }} role="status">
            <StudioAudioAnimation />
          </div>
        )}

        {errorText && <div className="nx-message nx-error" role="alert">{errorText}</div>}

        {['waiting', 'error'].includes(phase) && (
          <button type="button" className="nx-button nx-primary" onClick={() => setRun((x) => x + 1)} style={{ marginTop: '12px' }}>
            {t.checkAgain} ↻
          </button>
        )}

        {phase === 'ready' && !paid && (
          <>
            <div className="nx-preview-layout nx-preview-focused">
              <SongCard order={order} tracks={tracks} paid={false} onPreviewEnded={irParaPagamento} t={t} />
            </div>
            <CheckoutCartao selected={selectedSku} onSelect={setSelectedSku} onPay={startCheckout} busy={checkoutBusy} error={checkoutError} t={t} />
            <MobileValueComparison honoreeName={nome} t={t.compare} />
            <MobileTrustBadges t={t.trust} />
            <MobileStickyBar onScrollToCheckout={irParaPagamento} t={t} />
          </>
        )}

        {phase === 'ready' && paid && (
          <div className="nx-post-layout">
            <SongCard order={order} tracks={tracks} paid t={t} />
            <div style={{ marginTop: '16px', padding: '16px 18px', background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.25)', borderRadius: '14px' }}>
              <strong style={{ color: '#047857', fontSize: '0.92rem' }}>{t.paidBox.title}</strong>
              <p style={{ fontSize: '0.84rem', color: 'var(--nx-muted, #4e4653)', margin: '4px 0 0' }}>{t.paidBox.text}</p>
            </div>
            {hasGiftExtras && (
              <Link className="nx-button nx-primary" href={'/gift?orderId=' + encodeURIComponent(orderId)} style={{ marginTop: '14px', display: 'flex', justifyContent: 'center', textDecoration: 'none' }}>
                {t.paidBox.gift} ↗
              </Link>
            )}
          </div>
        )}
      </main>

      {embedded && (
        <EmbeddedCheckout
          clientSecret={embedded.clientSecret}
          publishableKey={embedded.publishableKey}
          language={lang}
          onClose={() => setEmbedded(null)}
        />
      )}
    </div>
  );
}

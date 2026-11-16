'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Shell, RecordArt } from '@/components/us/Shell';
import { US_PACKAGES, formatUsd } from '@/lib/usCatalog';
import { trackFbPurchase } from '@/lib/metaPixel';
import EmbeddedCheckout from '@/components/us/EmbeddedCheckout';
import { deliveryTexts, packageLabel, orderLanguage } from '@/lib/usDeliveryI18n';

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

function downloadUrl(raw) {
  const url = new URL(raw, window.location.origin);
  if (url.origin === window.location.origin && url.pathname === '/api/us/audio') url.searchParams.set('download', '1');
  return url.href;
}

function tracksFrom(order) {
  if (Array.isArray(order?.audioFiles)) return order.audioFiles.map(x => typeof x === 'string' ? { audioUrl: x } : x).filter(x => x.audioUrl || x.url);
  return order?.audioUrl ? [{ audioUrl: order.audioUrl }] : [];
}

export default function DeliveryPage() {
  const [order, setOrder] = useState(null),
    [orderId, setOrderId] = useState(''),
    [tracks, setTracks] = useState([]),
    [phase, setPhase] = useState('loading'),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [run, setRun] = useState(0),
    [checkoutBusy, setCheckoutBusy] = useState(false),
    [selectedSku, setSelectedSku] = useState('audio_only'),
    [embedded, setEmbedded] = useState(null),
    [storedCountry, setStoredCountry] = useState('');

  // O idioma é o do pedido. Até o pedido chegar, vale o país escolhido no pop-up do /create.
  const lang = orderLanguage(order, storedCountry);
  const t = deliveryTexts(lang);
  // Mensagem de erro: em espanhol, a do servidor (em inglês) é trocada pela genérica do idioma.
  const msg = (e, fallback) => (lang === 'en' && e?.message ? e.message : fallback);

  useEffect(() => {
    try { setStoredCountry(localStorage.getItem('ns_us_country') || ''); } catch { /* sem armazenamento */ }
  }, []);

  const checkoutController = useRef(null), mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      checkoutController.current?.abort();
    };
  }, []);

  async function startCheckout(targetSku) {
    if (checkoutBusy || !orderId) return;
    setError('');
    setCheckoutBusy(true);
    checkoutController.current = new AbortController();
    try {
      const chosenSku = targetSku || selectedSku || order?.sku || 'audio_only';
      const result = await api('/api/us/checkout', { orderId, sku: chosenSku }, checkoutController.current.signal);
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
        setError(msg(e, t.errors.checkout));
        setCheckoutBusy(false);
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    let active = true, timer;
    const signal = controller.signal;
    const wait = ms => new Promise((resolve, reject) => {
      timer = setTimeout(resolve, ms);
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      }, { once: true });
    });

    const params = new URLSearchParams(window.location.search);
    const id = params.get('orderId');
    const sessionId = params.get('session_id');
    const cancelled = params.get('cancelled') === '1';
    setOrderId(id || '');
    setError('');
    if (cancelled) setNotice('cancelled');
    setPhase('loading');

    async function load() {
      try {
        if (!id) {
          const e = new Error('');
          e.code = 'missingOrder';
          throw e;
        }
        let data = await api('/api/us/orders?orderId=' + encodeURIComponent(id), null, signal);
        let current = data.order;
        if (sessionId) {
          if (active) setPhase('confirming');
          data = await api('/api/us/payment-status', { orderId: id, sessionId }, signal);
          current = data.order || current;
        }

        if (!active) return;
        setOrder(current);
        if (current?.sku) setSelectedSku(current.sku);
        const existing = tracksFrom(current);
        const paid = current?.paid === true || ['PAID', 'PAGO', 'PAGAMENTO_APROVADO', 'paid'].includes(current?.paymentStatus) || current?.status === 'PAID';

        if (paid && id) {
          try {
            const k = 'fb_purchased_' + id;
            if (typeof window !== 'undefined' && !window.sessionStorage.getItem(k)) {
              window.sessionStorage.setItem(k, '1');
              trackFbPurchase({
                orderId: id,
                value: typeof current.total === 'number' && current.total > 0 ? current.total : 4.99,
                currency: 'USD',
                contentName: current.packageName || current.extras?.us?.sku || 'Custom Song',
                eventId: `purchase_${id}_us`,
                email: current.customerEmail || current.customer_email,
                phone: current.customerPhone || current.customer_phone,
              });
            }
          } catch (_) {}
        }

        if (existing.length) {
          setTracks(existing);
          setPhase('ready');
          return;
        }

        setPhase('generating');
        try {
          const startRes = await api('/api/us/music', { orderId: id }, signal);
          if (startRes?.status === 'ERROR') {
            const e = new Error(startRes.error || '');
            e.code = 'start';
            throw e;
          }
        } catch (startErr) {
          if (startErr.name !== 'AbortError' && active) {
            console.error('[us-delivery] Music generation start error:', startErr);
            setError({ code: 'start', message: startErr.message });
            setPhase('error');
            return;
          }
        }

        for (let attempt = 0; attempt < 45; attempt++) {
          await wait(attempt === 0 ? 3000 : Math.min(4000 + attempt * 1500, 15000));
          const result = await api('/api/us/music?orderId=' + encodeURIComponent(id), null, signal);
          if (!active) return;
          if (result.status === 'ERROR') {
            const e = new Error(result.error || '');
            e.code = 'song';
            throw e;
          }
          if (result.status === 'COMPLETED') {
            const files = result.tracks || [];
            if (files.length) {
              setTracks(files);
              setPhase('ready');
              return;
            }
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
    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [run]);

  const paid = order?.paid === true || ['PAID', 'PAGO', 'PAGAMENTO_APROVADO', 'paid'].includes(order?.paymentStatus) || order?.status === 'PAID';
  const selectedPackage = US_PACKAGES.find(p => p.sku === selectedSku) || US_PACKAGES[0];
  // Erro do carregamento chega como { code, message }; o do checkout já chega como texto pronto.
  const errorText = !error ? '' : typeof error === 'string'
    ? error
    : (error.code === 'missingOrder' ? t.errors.missingOrder : msg(error, t.errors[error.code] || t.errors.load));
  const [l1, l2] = phase === 'ready'
    ? (paid ? t.titleReadyPaid : t.titleReadyPreview)
    : phase === 'generating' || phase === 'waiting' ? t.titleWaiting : t.titleDefault;

  return (
    <Shell lang={lang}>
      <main className="us-delivery us-wrap" lang={lang}>
        <div className="us-delivery-copy">
          <div className="us-eyebrow">{t.eyebrow}</div>
          <h1>{l1}<br /><i>{l2}</i></h1>
          <p>
            {phase === 'ready'
              ? (paid ? t.textReadyPaid : t.textReadyPreview)
              : phase === 'generating' ? t.textGenerating
              : phase === 'waiting' ? t.textWaiting
              : phase === 'confirming' ? t.textConfirming
              : phase === 'loading' ? t.textLoading
              : t.textDefault}
          </p>

          {order && (
            <div className="us-order-label">
              {t.forLabel} {order.honoreeName || order.recipientName || t.yourPerson} <span>{t.orderLabel} {order.orderNumber || order.id?.slice(-8)}</span>
            </div>
          )}

          {['loading', 'confirming', 'generating'].includes(phase) && (
            <div className="us-generation-progress" role="status">
              <span className="us-spinner" />
              {phase === 'generating' ? t.progressGenerating : phase === 'confirming' ? t.progressConfirming : t.progressLoading}
            </div>
          )}

          {notice && <div className="us-fine" style={{ padding: '10px 14px', background: 'rgba(180,130,40,0.1)', border: '1px solid rgba(180,130,40,0.3)', borderRadius: 2, marginBottom: 16 }}>{notice === 'cancelled' ? t.cancelled : notice}</div>}
          {errorText && <div role="alert" className="us-error">{errorText}</div>}

          {phase === 'ready' && (
            <div className="us-tracks">
              {tracks.map((track, index) => (
                <div className="us-track" key={index}>
                  <div className="us-track-heading">
                    <span>♫</span>
                    <strong>{tracks.length > 1 ? t.version(index + 1) : t.single}</strong>
                    {paid ? (
                      <a href={downloadUrl(track.audioUrl || track.url)} download rel="noopener">{t.download}</a>
                    ) : (
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {t.preview}
                      </span>
                    )}
                  </div>
                  <audio controls preload="metadata" src={track.audioUrl || track.url}>
                    {t.noAudio}
                  </audio>
                </div>
              ))}
            </div>
          )}

          {phase === 'ready' && !paid && (
            <div className="us-checkout-box" style={{ marginTop: 24, padding: '22px 20px', background: 'rgba(255,255,255,0.7)', border: '1px solid var(--line)', borderRadius: 2, marginBottom: 24 }}>
              <div className="us-eyebrow" style={{ marginBottom: 6 }}>{t.unlockEyebrow}</div>
              <h3 style={{ fontSize: 20, marginBottom: 6 }}>{t.unlockTitle}</h3>
              <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 16 }}>
                {t.unlockText}
              </p>
              <fieldset className="us-fieldset" style={{ border: 'none', padding: 0, margin: '0 0 16px 0' }}>
                <div className="us-checkout-packages">
                  {US_PACKAGES.map(pack => {
                    const label = packageLabel(pack, lang);
                    return (
                      <label className={selectedSku === pack.sku ? 'selected' : ''} key={pack.sku}>
                        <input
                          type="radio"
                          name="packageDelivery"
                          checked={selectedSku === pack.sku}
                          onChange={() => setSelectedSku(pack.sku)}
                        />
                        <div>
                          <strong>{label.name}</strong>
                          <span>{label.features.join(' · ')}</span>
                        </div>
                        <b>{formatUsd(pack.priceCents)}</b>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <button
                type="button"
                className="us-button"
                style={{ width: '100%', justifyContent: 'center', gap: 14 }}
                disabled={checkoutBusy}
                onClick={() => startCheckout(selectedSku)}
              >
                {checkoutBusy ? t.opening : t.unlockButton(formatUsd(selectedPackage.priceCents))} <span>💳 ↗</span>
              </button>
              <p className="us-fine" style={{ textAlign: 'center', marginTop: 10 }}>
                {t.unlockFine}
              </p>
            </div>
          )}

          {phase === 'ready' && paid && (
            <div style={{ marginTop: 20, padding: '16px 18px', background: 'rgba(46,125,50,0.08)', border: '1px solid rgba(46,125,50,0.25)', borderRadius: 2, marginBottom: 20 }}>
              <strong style={{ color: '#2e7d32', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                {t.paidTitle}
              </strong>
              <p style={{ fontSize: 11, color: 'var(--muted)', margin: '4px 0 0 0' }}>
                {t.paidText}
              </p>
            </div>
          )}

          {['waiting', 'error'].includes(phase) && (
            <button type="button" className="us-button" disabled={checkoutBusy} onClick={() => setRun(x => x + 1)}>
              {t.checkAgain} <span>↻</span>
            </button>
          )}

          {orderId && order && paid && (
            <Link className="us-button us-delivery-link" href={'/gift?orderId=' + encodeURIComponent(orderId)}>
              {t.giftWorkspace} <span>↗</span>
            </Link>
          )}

          <p className="us-fine">
            {t.keepLink}
          </p>
        </div>
        <RecordArt small />
      </main>
      {embedded && (
        <EmbeddedCheckout
          clientSecret={embedded.clientSecret}
          publishableKey={embedded.publishableKey}
          language={lang}
          onClose={() => setEmbedded(null)}
        />
      )}
    </Shell>
  );
}
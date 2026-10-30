'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Shell, RecordArt } from '@/components/us/Shell';
import { US_PACKAGES, formatUsd } from '@/lib/usCatalog';
import { trackFbPurchase } from '@/lib/metaPixel';

async function api(url, body, signal) {
  const response = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    signal,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'We couldn’t load your song. Please try again.');
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
    [selectedSku, setSelectedSku] = useState('audio_only');

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
      const destination = new URL(result.checkoutUrl);
      if (destination.protocol !== 'https:') throw new Error('Secure checkout is unavailable. Please try again.');
      if (mounted.current) window.location.assign(destination.href);
    } catch (e) {
      if (e.name !== 'AbortError' && mounted.current) {
        setError(e.message);
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
    if (cancelled) setNotice('Checkout was cancelled. Your preview songs are saved below whenever you’re ready.');
    setPhase('loading');

    async function load() {
      try {
        if (!id) throw new Error('This link is missing your order. Open the delivery link from your checkout or start a new gift.');
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
            throw new Error(startRes.error || 'Could not start music generation.');
          }
        } catch (startErr) {
          if (startErr.name !== 'AbortError' && active) {
            console.error('[us-delivery] Music generation start error:', startErr);
            setError(startErr.message || 'Could not start music generation.');
            setPhase('error');
            return;
          }
        }

        for (let attempt = 0; attempt < 45; attempt++) {
          await wait(attempt === 0 ? 3000 : Math.min(4000 + attempt * 1500, 15000));
          const result = await api('/api/us/music?orderId=' + encodeURIComponent(id), null, signal);
          if (!active) return;
          if (result.status === 'ERROR') throw new Error(result.error || 'Your song needs another attempt. Your order is saved; use Retry to check again.');
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
          setError(e.message);
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

  return (
    <Shell>
      <main className="us-delivery us-wrap">
        <div className="us-delivery-copy">
          <div className="us-eyebrow">THE PERSONAL SONG STUDIO</div>
          <h1>
            {phase === 'ready'
              ? (paid ? <>Your story.<br /><i>Now a song.</i></> : <>Listen to your preview.<br /><i>Made from your words.</i></>)
              : phase === 'generating' || phase === 'waiting'
              ? <>A little patience.<br /><i>A lot of feeling.</i></>
              : <>Something<br /><i>worth keeping.</i></>}
          </h1>
          <p>
            {phase === 'ready'
              ? (paid
                ? 'Made from your words, for your person. Play it here, download it, and make their day.'
                : 'Your two custom arrangements are ready. Listen to the preview below and unlock full MP3 downloads.')
              : phase === 'generating'
              ? 'Your original AI song is being created. We generate two unique arrangements for you to hear. You can keep this page open.'
              : phase === 'waiting'
              ? 'Your song is still in the studio. We’ve paused automatic checks. Your order is saved; check again in a moment.'
              : phase === 'confirming'
              ? 'We’re confirming your payment securely with Stripe…'
              : phase === 'loading'
              ? 'Opening your personal song studio…'
              : 'Your gift is saved in your private studio.'}
          </p>

          {order && (
            <div className="us-order-label">
              FOR {order.honoreeName || order.recipientName || 'YOUR PERSON'} <span>ORDER {order.orderNumber || order.id?.slice(-8)}</span>
            </div>
          )}

          {['loading', 'confirming', 'generating'].includes(phase) && (
            <div className="us-generation-progress" role="status">
              <span className="us-spinner" />
              {phase === 'generating' ? 'Creating your music studio tracks…' : phase === 'confirming' ? 'Confirming payment…' : 'Loading your gift…'}
            </div>
          )}

          {notice && <div className="us-fine" style={{ padding: '10px 14px', background: 'rgba(180,130,40,0.1)', border: '1px solid rgba(180,130,40,0.3)', borderRadius: 2, marginBottom: 16 }}>{notice}</div>}
          {error && <div role="alert" className="us-error">{error}</div>}

          {phase === 'ready' && (
            <div className="us-tracks">
              {tracks.map((track, index) => (
                <div className="us-track" key={index}>
                  <div className="us-track-heading">
                    <span>♫</span>
                    <strong>{tracks.length > 1 ? 'Version ' + (index + 1) : 'Your personal song'}</strong>
                    {paid ? (
                      <a href={downloadUrl(track.audioUrl || track.url)} download rel="noopener">Download MP3 ↗</a>
                    ) : (
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        Preview
                      </span>
                    )}
                  </div>
                  <audio controls preload="metadata" src={track.audioUrl || track.url}>
                    Your browser does not support audio.
                  </audio>
                </div>
              ))}
            </div>
          )}

          {phase === 'ready' && !paid && (
            <div className="us-checkout-box" style={{ marginTop: 24, padding: '22px 20px', background: 'rgba(255,255,255,0.7)', border: '1px solid var(--line)', borderRadius: 2, marginBottom: 24 }}>
              <div className="us-eyebrow" style={{ marginBottom: 6 }}>UNLOCK LIFETIME ACCESS</div>
              <h3 style={{ fontSize: 20, marginBottom: 6 }}>Love your song? Choose how they’ll keep it</h3>
              <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 16 }}>
                Select your gift package to unlock full-length MP3 downloads and access your included keepsake extras.
              </p>
              <fieldset className="us-fieldset" style={{ border: 'none', padding: 0, margin: '0 0 16px 0' }}>
                <div className="us-checkout-packages">
                  {US_PACKAGES.map(pack => (
                    <label className={selectedSku === pack.sku ? 'selected' : ''} key={pack.sku}>
                      <input
                        type="radio"
                        name="packageDelivery"
                        checked={selectedSku === pack.sku}
                        onChange={() => setSelectedSku(pack.sku)}
                      />
                      <div>
                        <strong>{pack.name}</strong>
                        <span>{pack.features.join(' · ')}</span>
                      </div>
                      <b>{formatUsd(pack.priceCents)}</b>
                    </label>
                  ))}
                </div>
              </fieldset>
              <button
                type="button"
                className="us-button"
                style={{ width: '100%', justifyContent: 'center', gap: 14 }}
                disabled={checkoutBusy}
                onClick={() => startCheckout(selectedSku)}
              >
                {checkoutBusy ? 'Opening secure checkout…' : `Unlock & Download (${formatUsd(selectedPackage.priceCents)} USD)`} <span>💳 ↗</span>
              </button>
              <p className="us-fine" style={{ textAlign: 'center', marginTop: 10 }}>
                Secure checkout via Stripe. One-time payment with lifetime access.
              </p>
            </div>
          )}

          {phase === 'ready' && paid && (
            <div style={{ marginTop: 20, padding: '16px 18px', background: 'rgba(46,125,50,0.08)', border: '1px solid rgba(46,125,50,0.25)', borderRadius: 2, marginBottom: 20 }}>
              <strong style={{ color: '#2e7d32', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                ✓ Payment confirmed · Full access unlocked
              </strong>
              <p style={{ fontSize: 11, color: 'var(--muted)', margin: '4px 0 0 0' }}>
                Use the download links above to save your MP3 files. You can also explore your personalized extras in the gift workspace.
              </p>
            </div>
          )}

          {['waiting', 'error'].includes(phase) && (
            <button className="us-button" disabled={checkoutBusy} onClick={() => setRun(x => x + 1)}>
              Check again <span>↻</span>
            </button>
          )}

          {orderId && order && paid && (
            <Link className="us-button us-delivery-link" href={'/gift?orderId=' + encodeURIComponent(orderId)}>
              Open your gift workspace <span>↗</span>
            </Link>
          )}

          <p className="us-fine">
            Keep this link and use this browser to return to your private order. Your gift workspace holds the extras included in your collection.
          </p>
        </div>
        <RecordArt small />
      </main>
    </Shell>
  );
}
'use client';

import { useEffect, useRef, useState } from 'react';

// Checkout da Stripe embutido na página (o cartão é digitado num iframe da própria Stripe).
// Ao concluir, a Stripe leva o cliente para a return_url (/delivery?...&session_id=...), onde o servidor
// confere o pagamento. Nada aqui libera produto.
let stripeJs;
function carregarStripeJs() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.Stripe) return Promise.resolve(window.Stripe);
  if (!stripeJs) {
    stripeJs = new Promise((ok, falha) => {
      const s = document.createElement('script');
      s.src = 'https://js.stripe.com/v3/';
      s.async = true;
      s.onload = () => (window.Stripe ? ok(window.Stripe) : falha(new Error('Stripe.js')));
      s.onerror = () => { stripeJs = null; falha(new Error('Stripe.js')); };
      document.head.appendChild(s);
    });
  }
  return stripeJs;
}

const TEXTOS = {
  en: { title: 'Secure checkout', close: 'Close', loading: 'Loading secure checkout…', error: 'We couldn’t load the secure checkout. Please try again.' },
  es: { title: 'Pago seguro', close: 'Cerrar', loading: 'Cargando el pago seguro…', error: 'No pudimos cargar el pago seguro. Inténtalo de nuevo.' },
};

export default function EmbeddedCheckout({ clientSecret, publishableKey, language = 'en', onClose }) {
  const alvo = useRef(null);
  const [estado, setEstado] = useState('loading');
  const t = TEXTOS[language] || TEXTOS.en;

  useEffect(() => {
    let checkout;
    let ativo = true;
    carregarStripeJs()
      .then(async (Stripe) => {
        const stripe = Stripe(publishableKey);
        checkout = await stripe.initEmbeddedCheckout({ fetchClientSecret: async () => clientSecret });
        if (!ativo) { checkout.destroy(); return; }
        checkout.mount(alvo.current);
        setEstado('ready');
      })
      .catch((e) => {
        console.warn('[checkout] falha ao carregar checkout embutido:', e?.message);
        if (ativo) setEstado('error');
      });
    return () => { ativo = false; try { checkout?.destroy(); } catch { /* já desmontado */ } };
  }, [clientSecret, publishableKey]);

  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', esc);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = overflow; };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={t.title} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '520px', maxHeight: '94vh', overflowY: 'auto', background: '#ffffff', borderRadius: '18px 18px 0 0', padding: '14px 14px 24px', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <strong style={{ fontSize: '1rem' }}>🔒 {t.title}</strong>
          <button type="button" onClick={onClose} style={{ border: 'none', background: '#f1f5f9', borderRadius: '999px', padding: '6px 12px', cursor: 'pointer', fontWeight: 700 }}>{t.close}</button>
        </div>
        {estado === 'loading' && <p role="status" style={{ textAlign: 'center', color: '#64748b', padding: '24px 0' }}>{t.loading}</p>}
        {estado === 'error' && <p role="alert" style={{ textAlign: 'center', color: '#b91c1c', padding: '24px 0' }}>{t.error}</p>}
        <div ref={alvo} />
      </div>
    </div>
  );
}

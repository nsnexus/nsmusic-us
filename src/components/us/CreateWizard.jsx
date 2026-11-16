'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { textos, PHONE_PREFIX } from '@/lib/usI18n';
import { trackFbViewContent, trackFbInitiateCheckout } from '@/lib/metaPixel';

// Passo a passo de criação no mesmo formato do site brasileiro, em inglês ou espanhol conforme o país.
// País e ritmos vêm de /api/us/countries; o servidor revalida tudo (país, ritmo, campos) ao gerar a letra
// e ao criar o pedido.
const DRAFT_KEY = 'ns_us_wizard_v2';
const COUNTRY_KEY = 'ns_us_country';
const STORY_MIN = 50;
const TOTAL = 7;
const FAITH = /christian|gospel|cristiana|alabanza|worship/i;

const initial = {
  country: '', relationship: '', relationshipOther: '', recipientName: '', senderName: '',
  occasion: '', occasionOther: '', story: '', requiredNames: '', requiredPhrase: '',
  genre: '', mood: 'Heartfelt', vocals: 'any', faithThemes: false,
  customerEmail: '', customerPhone: '', termsAccepted: false,
};

const roxo = '#6d28d9';
const S = {
  wrap: { maxWidth: '640px', margin: '0 auto', padding: '18px 18px 120px' },
  progress: { display: 'flex', alignItems: 'center', gap: '12px', margin: '6px 0 22px' },
  bar: { flex: 1, height: '7px', borderRadius: '999px', background: '#e5e7eb', overflow: 'hidden' },
  h1: { fontSize: 'clamp(1.7rem, 6vw, 2.3rem)', lineHeight: 1.1, margin: '0 0 6px', fontWeight: 800, letterSpacing: '-0.02em', color: '#1f1a24' },
  sub: { margin: '0 0 18px', color: '#6b6474', fontSize: '0.98rem', lineHeight: 1.5 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' },
  card: (on) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', minHeight: '92px', padding: '12px 8px', borderRadius: '16px', cursor: 'pointer', textAlign: 'center', background: on ? '#f5f3ff' : '#ffffff', border: `2px solid ${on ? roxo : '#e7e2ef'}`, color: '#1f1a24', fontWeight: 700, fontSize: '0.92rem' }),
  chip: (on) => ({ padding: '10px 14px', borderRadius: '999px', cursor: 'pointer', border: `2px solid ${on ? roxo : '#e7e2ef'}`, background: on ? '#f5f3ff' : '#fff', color: on ? roxo : '#1f1a24', fontWeight: 700, fontSize: '0.9rem' }),
  label: { display: 'block', fontWeight: 700, fontSize: '0.9rem', color: '#1f1a24', margin: '14px 0 6px' },
  input: { width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: '14px', border: '1.5px solid #d9d3e3', fontSize: '1rem', background: '#fff', color: '#1f1a24' },
  bottom: { position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50, background: 'rgba(255,255,255,0.96)', borderTop: '1px solid #ece8f2', padding: '12px 16px calc(12px + env(safe-area-inset-bottom))' },
  bottomIn: { maxWidth: '640px', margin: '0 auto', display: 'flex', gap: '10px' },
  back: { flex: '0 0 auto', padding: '14px 18px', borderRadius: '999px', border: '1.5px solid #d9d3e3', background: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', color: '#1f1a24' },
  next: (dis) => ({ flex: 1, padding: '15px 18px', borderRadius: '999px', border: 'none', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', fontWeight: 700, fontSize: '1.02rem', cursor: dis ? 'wait' : 'pointer', opacity: dis ? 0.7 : 1, boxShadow: '0 10px 24px -10px rgba(109,40,217,0.6)' }),
  error: { margin: '14px 0 0', padding: '10px 12px', borderRadius: '12px', background: '#fef2f2', color: '#b91c1c', fontSize: '0.9rem' },
};

async function post(url, body, signal, fallback) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || fallback);
  return data;
}

function CountryPopup({ countries, value, onPick }) {
  const [sel, setSel] = useState(value || countries[0]?.code || '');
  // O texto do pop-up acompanha o idioma do país marcado.
  const t = textos(countries.find((c) => c.code === sel)?.language || 'en');
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="pais-t" style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: '#fff', borderRadius: '20px', padding: '22px' }}>
        <h2 id="pais-t" style={{ margin: '0 0 4px', fontSize: '1.25rem' }}>{t.country.title}</h2>
        <p style={{ margin: '0 0 14px', color: '#6b6474', fontSize: '0.92rem' }}>{t.country.subtitle}</p>
        <div style={{ display: 'grid', gap: '8px' }}>
          {countries.map((c) => (
            <button key={c.code} type="button" onClick={() => setSel(c.code)} aria-pressed={sel === c.code}
              style={{ ...S.chip(sel === c.code), borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
              <span style={{ fontSize: '1.4rem' }} aria-hidden="true">{c.flag}</span>{c.name}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => sel && onPick(sel)} style={{ ...S.next(false), width: '100%', marginTop: '16px' }}>{t.country.confirm}</button>
      </div>
    </div>
  );
}

export default function CreateWizard() {
  const [countries, setCountries] = useState(null);
  const [detected, setDetected] = useState('');
  const [askCountry, setAskCountry] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initial);
  const [lyrics, setLyrics] = useState('');
  const [orderId, setOrderId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [restored, setRestored] = useState(false);
  const [lyricsKey, setLyricsKey] = useState('');
  const controller = useRef(null);
  const heading = useRef(null);

  const country = useMemo(() => countries?.find((c) => c.code === form.country) || null, [countries, form.country]);
  const lang = country?.language || 'en';
  const t = textos(lang);

  // Rascunho + país salvos no aparelho.
  useEffect(() => {
    trackFbViewContent();
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get('new') === '1' || p.get('reset') === '1') localStorage.removeItem(DRAFT_KEY);
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (draft?.form) setForm((f) => ({ ...f, ...draft.form }));
      if (draft?.lyrics) setLyrics(draft.lyrics);
      if (draft?.lyricsKey) setLyricsKey(draft.lyricsKey);
      if (draft?.orderId) setOrderId(draft.orderId);
      if (Number.isInteger(draft?.step) && draft.step >= 1 && draft.step <= TOTAL) setStep(draft.step);
      const salvo = localStorage.getItem(COUNTRY_KEY);
      if (salvo) setForm((f) => ({ ...f, country: f.country || salvo }));
    } catch { /* rascunho inválido: começa do zero */ }
    setRestored(true);
    return () => controller.current?.abort();
  }, []);

  useEffect(() => {
    if (!restored) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, form, lyrics, lyricsKey, orderId })); } catch { /* sem armazenamento */ }
  }, [restored, step, form, lyrics, lyricsKey, orderId]);

  // Países e ritmos.
  useEffect(() => {
    if (!restored) return;
    let ativo = true;
    fetch('/api/us/countries', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (!ativo) return;
        const lista = Array.isArray(d.countries) ? d.countries : [];
        setCountries(lista);
        setDetected(d.detected || '');
        setForm((f) => {
          if (f.country && lista.some((c) => c.code === f.country)) return f;
          return { ...f, country: '' };
        });
        const salvo = (() => { try { return localStorage.getItem(COUNTRY_KEY); } catch { return ''; } })();
        if (!salvo || !lista.some((c) => c.code === salvo)) setAskCountry(true);
      })
      .catch(() => { if (ativo) setError('We could not load the page. Please refresh.'); });
    return () => { ativo = false; };
  }, [restored]);

  useEffect(() => { heading.current?.focus(); }, [step]);

  const set = useCallback((k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (!['customerEmail', 'customerPhone', 'termsAccepted'].includes(k)) setOrderId('');
  }, []);

  const pickCountry = (code) => {
    try { localStorage.setItem(COUNTRY_KEY, code); } catch { /* ok */ }
    setForm((f) => (f.country === code ? f : { ...f, country: code, genre: '', faithThemes: false, occasion: '', relationship: '' }));
    if (form.country && form.country !== code) { setLyrics(''); setOrderId(''); if (step > 1) setStep(1); }
    setAskCountry(false);
  };

  const ir = (n) => { setError(''); setStep(n); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const relationship = form.relationship === '__other' ? form.relationshipOther.trim() : form.relationship;
  const occasion = form.occasion === '__other' ? form.occasionOther.trim() : form.occasion;
  const genreObj = country?.genres?.find((g) => g.id === form.genre) || null;
  const faithAvailable = genreObj && FAITH.test(`${genreObj.id} ${genreObj.name}`);
  const nomesIguais = form.recipientName.trim() && form.recipientName.trim().toLowerCase() === form.senderName.trim().toLowerCase();

  const spec = () => ({
    country: form.country, recipientName: form.recipientName.trim(), senderName: form.senderName.trim(),
    relationship, occasion, story: form.story.trim(), genre: form.genre, mood: form.mood, vocals: form.vocals,
    requiredNames: form.requiredNames.trim(), requiredPhrase: form.requiredPhrase.trim(), faithThemes: Boolean(faithAvailable && form.faithThemes),
  });

  async function gerarLetra() {
    setBusy(true); setError('');
    controller.current?.abort();
    controller.current = new AbortController();
    try {
      const d = await post('/api/us/lyrics', spec(), controller.current.signal, t.errors.generic);
      setLyrics(d.lyrics || ''); setOrderId(''); setLyricsKey(JSON.stringify(spec()));
      ir(6);
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function criarPedido() {
    const digitos = form.customerPhone.replace(/\D/g, '');
    if (digitos.length < 8) { setError(t.contact.phoneError); return; }
    if (!form.termsAccepted) { setError(t.contact.termsError); return; }
    setBusy(true); setError('');
    controller.current?.abort();
    controller.current = new AbortController();
    const telefone = form.customerPhone.trim().startsWith('+') ? form.customerPhone.trim() : `${PHONE_PREFIX[form.country] || '+1'} ${form.customerPhone.trim()}`;
    try {
      let id = orderId;
      if (!id) {
        const d = await post('/api/us/orders', { ...spec(), lyrics, sku: 'audio_only', customerEmail: form.customerEmail.trim(), customerPhone: telefone, termsAccepted: true }, controller.current.signal, t.errors.generic);
        id = d.order.id;
        setOrderId(id);
      }
      try { await post('/api/us/music', { orderId: id }, controller.current.signal, ''); } catch (e) { console.warn('[us-music] início da geração:', e?.message); }
      try { trackFbInitiateCheckout({ orderId: id, value: 4.99, currency: 'USD', contentName: 'Custom Song Preview', email: form.customerEmail, phone: telefone }); } catch { /* pixel opcional */ }
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ok */ }
      window.location.assign('/delivery?orderId=' + encodeURIComponent(id));
    } catch (e) {
      if (e.name !== 'AbortError') { setError(e.message); setBusy(false); }
    }
  }

  const avancar = () => {
    if (step === 1) {
      if (!relationship) return setError(t.errors.who);
      if (!form.recipientName.trim() || !form.senderName.trim()) return setError(t.errors.name);
      return ir(2);
    }
    if (step === 2) return occasion ? ir(3) : setError(t.errors.occasion);
    if (step === 3) return form.story.trim().length >= STORY_MIN ? ir(4) : setError(t.errors.story(STORY_MIN));
    if (step === 4) return form.genre ? ir(5) : setError(t.errors.genre);
    // Só escreve de novo se algo mudou desde a última letra (voltar e avançar não gasta outra geração).
    if (step === 5) return lyrics && lyricsKey === JSON.stringify(spec()) ? ir(6) : gerarLetra();
    if (step === 6) return lyrics.trim().length >= 80 ? ir(7) : setError(t.errors.generic);
    if (step === 7) return criarPedido();
    return null;
  };

  const rotuloAvancar = step === 5 ? (busy ? t.vibe.generating : t.vibe.generate)
    : step === 6 ? t.lyrics.approve
    : step === 7 ? (busy ? t.contact.creating : t.contact.create)
    : t.next;

  if (!countries) {
    return <div style={S.wrap}><p role="status" style={{ color: '#6b6474' }}>{error || 'Loading…'}</p></div>;
  }

  return (
    <div lang={lang === 'es' ? 'es-MX' : 'en'}>
      {askCountry && <CountryPopup countries={countries} value={form.country || detected} onPick={pickCountry} />}

      <div style={S.wrap}>
        <div style={S.progress}>
          <div style={S.bar} role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL} aria-valuenow={step}>
            <div style={{ width: `${(step / TOTAL) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #4f46e5, #7c3aed)', borderRadius: '999px', transition: 'width .3s' }} />
          </div>
          <span style={{ fontWeight: 800, color: '#64748b', fontSize: '0.9rem' }}>{t.stepOf(step, TOTAL)}</span>
          {country && (
            <button type="button" onClick={() => setAskCountry(true)} style={{ border: '1px solid #e7e2ef', background: '#fff', borderRadius: '999px', padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {country.flag} {t.country.change}
            </button>
          )}
        </div>

        {step === 1 && (
          <section>
            <h1 ref={heading} tabIndex={-1} style={S.h1}>{t.who.title}</h1>
            <p style={S.sub}>{t.who.subtitle}</p>
            <div style={S.grid}>
              {t.who.cards.map(([emoji, label, value]) => (
                <button key={value} type="button" style={S.card(form.relationship === value)} aria-pressed={form.relationship === value} onClick={() => set('relationship', value)}>
                  <span style={{ fontSize: '1.8rem' }} aria-hidden="true">{emoji}</span>{label}
                </button>
              ))}
              <button type="button" style={S.card(form.relationship === '__other')} aria-pressed={form.relationship === '__other'} onClick={() => set('relationship', '__other')}>
                <span style={{ fontSize: '1.8rem' }} aria-hidden="true">✨</span>{t.who.other}
              </button>
            </div>
            {form.relationship === '__other' && (
              <input aria-label={t.who.other} style={{ ...S.input, marginTop: '10px' }} maxLength={100} placeholder={t.who.otherPh} value={form.relationshipOther} onChange={(e) => set('relationshipOther', e.target.value)} />
            )}
            <label style={S.label} htmlFor="wz-recipient">{t.who.recipient}</label>
            <input id="wz-recipient" style={S.input} maxLength={100} placeholder={t.who.recipientPh} value={form.recipientName} onChange={(e) => set('recipientName', e.target.value)} autoComplete="off" />
            <label style={S.label} htmlFor="wz-sender">{t.who.sender}</label>
            <input id="wz-sender" style={S.input} maxLength={100} placeholder={t.who.senderPh} value={form.senderName} onChange={(e) => set('senderName', e.target.value)} autoComplete="given-name" />
            {nomesIguais && <p role="alert" style={{ ...S.error, background: '#fffbeb', color: '#92400e' }}>{t.who.swapped}</p>}
          </section>
        )}

        {step === 2 && (
          <section>
            <h1 ref={heading} tabIndex={-1} style={S.h1}>{t.occasion.title}</h1>
            <p style={S.sub}>{t.occasion.subtitle}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {t.occasion.list.map((o) => (
                <button key={o} type="button" style={S.chip(form.occasion === o)} aria-pressed={form.occasion === o} onClick={() => set('occasion', o)}>{o}</button>
              ))}
              <button type="button" style={S.chip(form.occasion === '__other')} aria-pressed={form.occasion === '__other'} onClick={() => set('occasion', '__other')}>{t.occasion.other}</button>
            </div>
            {form.occasion === '__other' && (
              <input aria-label={t.occasion.other} style={{ ...S.input, marginTop: '12px' }} maxLength={100} placeholder={t.occasion.otherPh} value={form.occasionOther} onChange={(e) => set('occasionOther', e.target.value)} />
            )}
          </section>
        )}

        {step === 3 && (
          <section>
            <h1 ref={heading} tabIndex={-1} style={S.h1}>{t.story.title(form.recipientName.trim())}</h1>
            <p style={S.sub}>{t.story.subtitle}</p>
            <textarea aria-label={t.story.title('')} style={{ ...S.input, minHeight: '220px', lineHeight: 1.5 }} maxLength={4000} placeholder={t.story.ph} value={form.story} onChange={(e) => set('story', e.target.value)} />
            <p style={{ margin: '6px 0 0', fontSize: '0.85rem', fontWeight: 700, color: form.story.trim().length >= STORY_MIN ? '#047857' : '#6b6474' }}>{t.story.count(form.story.trim().length, STORY_MIN)}</p>
            <label style={S.label} htmlFor="wz-names">{t.story.names}</label>
            <input id="wz-names" style={S.input} maxLength={300} value={form.requiredNames} onChange={(e) => set('requiredNames', e.target.value)} />
            <label style={S.label} htmlFor="wz-phrase">{t.story.phrase}</label>
            <input id="wz-phrase" style={S.input} maxLength={300} value={form.requiredPhrase} onChange={(e) => set('requiredPhrase', e.target.value)} />
          </section>
        )}

        {step === 4 && (
          <section>
            <h1 ref={heading} tabIndex={-1} style={S.h1}>{t.sound.title}</h1>
            <p style={S.sub}>{t.sound.subtitle}</p>
            <div style={{ ...S.grid, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              {(country?.genres || []).map((g) => (
                <button key={g.id} type="button" style={{ ...S.card(form.genre === g.id), alignItems: 'flex-start', textAlign: 'left', minHeight: '96px' }} aria-pressed={form.genre === g.id}
                  onClick={() => { set('genre', g.id); if (!FAITH.test(`${g.id} ${g.name}`)) set('faithThemes', false); }}>
                  <span>{g.name}</span>
                  {g.description && <span style={{ fontWeight: 500, fontSize: '0.8rem', color: '#6b6474' }}>{g.description}</span>}
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 5 && (
          <section>
            <h1 ref={heading} tabIndex={-1} style={S.h1}>{t.vibe.title}</h1>
            <p style={S.sub}>{t.vibe.subtitle}</p>
            <p style={S.label}>{t.vibe.moodLabel}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {t.vibe.moods.map(([v, l]) => <button key={v} type="button" style={S.chip(form.mood === v)} aria-pressed={form.mood === v} onClick={() => set('mood', v)}>{l}</button>)}
            </div>
            <p style={S.label}>{t.vibe.vocalsLabel}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {t.vibe.vocals.map(([v, l]) => <button key={v} type="button" style={S.chip(form.vocals === v)} aria-pressed={form.vocals === v} onClick={() => set('vocals', v)}>{l}</button>)}
            </div>
            {faithAvailable && (
              <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '16px', fontSize: '0.92rem' }}>
                <input type="checkbox" checked={form.faithThemes} onChange={(e) => set('faithThemes', e.target.checked)} style={{ marginTop: '3px' }} />
                {t.vibe.faith}
              </label>
            )}
          </section>
        )}

        {step === 6 && (
          <section>
            <h1 ref={heading} tabIndex={-1} style={S.h1}>{t.lyrics.title} ✨</h1>
            <p style={S.sub}>{t.lyrics.subtitle(form.recipientName.trim())}</p>
            <label style={S.label} htmlFor="wz-lyrics">{t.lyrics.label}</label>
            <textarea id="wz-lyrics" style={{ ...S.input, minHeight: '380px', lineHeight: 1.7, fontSize: '0.96rem' }} maxLength={4500} value={lyrics} onChange={(e) => { setLyrics(e.target.value); setOrderId(''); }} />
            <button type="button" onClick={gerarLetra} disabled={busy} style={{ marginTop: '10px', background: 'none', border: 'none', color: roxo, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: '6px 0' }}>
              {busy ? t.lyrics.regenerating : `🔄 ${t.lyrics.regenerate}`}
            </button>
          </section>
        )}

        {step === 7 && (
          <section>
            <h1 ref={heading} tabIndex={-1} style={S.h1}>{t.contact.title}</h1>
            <p style={S.sub}>{t.contact.subtitle}</p>
            <label style={S.label} htmlFor="wz-phone">{t.contact.phone}</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ ...S.input, width: 'auto', flex: '0 0 auto', color: '#6b6474' }}>{country?.flag} {PHONE_PREFIX[form.country] || '+1'}</span>
              <input id="wz-phone" type="tel" inputMode="tel" autoComplete="tel-national" style={S.input} maxLength={30} placeholder={t.contact.phonePh} value={form.customerPhone} onChange={(e) => set('customerPhone', e.target.value)} />
            </div>
            <label style={S.label} htmlFor="wz-email">{t.contact.email}</label>
            <input id="wz-email" type="email" autoComplete="email" style={S.input} maxLength={254} placeholder={t.contact.emailPh} value={form.customerEmail} onChange={(e) => set('customerEmail', e.target.value)} />
            <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '16px', fontSize: '0.92rem' }}>
              <input type="checkbox" checked={form.termsAccepted} onChange={(e) => set('termsAccepted', e.target.checked)} style={{ marginTop: '3px' }} />
              <span><Link href="/terms" target="_blank">{t.contact.terms}</Link></span>
            </label>
            <p style={{ marginTop: '14px', fontSize: '0.82rem', color: '#6b6474' }}>{t.contact.fine}</p>
          </section>
        )}

        {error && <p role="alert" style={S.error}>{error}</p>}
      </div>

      <div style={S.bottom}>
        <div style={S.bottomIn}>
          {step > 1 && <button type="button" style={S.back} onClick={() => ir(step - 1)} disabled={busy}>{t.back}</button>}
          <button type="button" style={S.next(busy)} onClick={avancar} disabled={busy}>{rotuloAvancar}</button>
        </div>
      </div>
    </div>
  );
}

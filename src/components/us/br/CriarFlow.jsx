'use client';

// Passo a passo de criação da loja internacional, copiado do /criar do site brasileiro: mesmas
// etapas (1 quem + nomes + ocasião · 2 história · 3 ritmo + clima + voz · 4 resumo + WhatsApp ·
// 5 letra), mesmo cabeçalho, mesmos cards e a mesma barra de baixo. Muda só o idioma (inglês ou
// espanhol, conforme o país) e o que vem depois: o pedido é criado aqui e a música é gerada e paga
// (Stripe, em dólar) na página de entrega.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import { PHONE_PREFIX } from '@/lib/usI18n';
import { iconeDoRitmo } from '@/lib/icones3d';
import { trackFbViewContent, trackFbInitiateCheckout } from '@/lib/metaPixel';
import { StudioLyricsAnimation } from '@/components/StudioAnimations';
import Icone3D from '../Icone3D';
import Bandeira from '../Bandeira';
import { textosBr } from './textosBr';
import '../wizard.css';

const DRAFT_KEY = 'ns_us_criar_v3';
const COUNTRY_KEY = 'ns_us_country';
const TOTAL_JOURNEY = 7;
const STORY_MIN = 50;
const LYRICS_MIN = 80;
const FAITH = /christian|gospel|cristiana|alabanza|worship/i;

const initial = {
  country: '', cardId: '', relationship: '', relationshipOther: '', isSelf: false,
  recipientName: '', senderName: '', occasion: '', occasionOther: false,
  story: '', requiredNames: '', requiredPhrase: '',
  genre: '', mood: '', vocals: '', faithThemes: false,
  customerEmail: '', customerPhone: '', termsAccepted: false,
};

const missingTag = { fontSize: '0.74rem', fontWeight: 700, color: '#dc2626', backgroundColor: '#fee2e2', padding: '2px 8px', borderRadius: '6px' };
const labelStyle = { display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#1E1418', marginBottom: '6px' };
const errorLine = { fontSize: '0.72rem', color: '#dc2626', fontWeight: 700, marginTop: '4px', display: 'block' };
const cardBox = { backgroundColor: '#ffffff', borderRadius: '20px', border: '1.5px solid #e2e8f0', padding: '20px', boxShadow: '0 4px 18px rgba(0,0,0,0.03)' };

async function post(url, body, signal, fallback) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || fallback);
  return data;
}

function Titulo({ as: Tag = 'div', children, missing, missingText }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', gap: '8px' }}>
      <Tag className="wz-t" style={{ margin: 0 }}>{children}</Tag>
      {missing && <span style={missingTag}>● {missingText}</span>}
    </div>
  );
}

function CountryPopup({ countries, value, onPick }) {
  const [sel, setSel] = useState(value || countries[0]?.code || '');
  const t = textosBr(countries.find((c) => c.code === sel)?.language || 'en');
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="pais-t" style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: '#fff', borderRadius: '20px', padding: '22px', boxShadow: '0 24px 60px -20px rgba(15,23,42,0.45)' }}>
        <h2 id="pais-t" className="wz-t" style={{ fontSize: '1.2rem' }}>{t.country.title}</h2>
        <p className="wz-s">{t.country.subtitle}</p>
        <div style={{ display: 'grid', gap: '8px' }}>
          {countries.map((c) => (
            <button key={c.code} type="button" onClick={() => setSel(c.code)} aria-pressed={sel === c.code}
              className={`usw-chip ${sel === c.code ? 'on' : ''}`} style={{ borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
              <Bandeira code={c.code} size={20} />{c.name}
            </button>
          ))}
        </div>
        <button type="button" className="btn-wz-primary" onClick={() => sel && onPick(sel)} style={{ width: '100%', marginTop: '16px' }}>{t.country.confirm}</button>
      </div>
    </div>
  );
}

function LetraFormatada({ texto }) {
  return (
    <div style={{ lineHeight: 1.75, color: '#1E1418', fontSize: '0.94rem' }}>
      {String(texto || '').split('\n').map((linha, i) => {
        const l = linha.trim();
        if (/^\[[^\]]+\]$/.test(l)) {
          return <div key={i} style={{ marginTop: i === 0 ? 0 : '18px', marginBottom: '4px', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6366f1' }}>{l.slice(1, -1)}</div>;
        }
        return l ? <div key={i}>{linha}</div> : null;
      })}
    </div>
  );
}

export default function CriarFlow() {
  const [countries, setCountries] = useState(null);
  const [detected, setDetected] = useState('');
  const [askCountry, setAskCountry] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initial);
  const [lyrics, setLyrics] = useState('');
  const [lyricsKey, setLyricsKey] = useState('');
  const [lyricsStatus, setLyricsStatus] = useState('idle');
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [savedMsg, setSavedMsg] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const [restored, setRestored] = useState(false);
  const controller = useRef(null);

  const country = useMemo(() => countries?.find((c) => c.code === form.country) || null, [countries, form.country]);
  const lang = country?.language || 'en';
  const t = textosBr(lang);

  useEffect(() => {
    trackFbViewContent();
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get('new') === '1' || p.get('reset') === '1') localStorage.removeItem(DRAFT_KEY);
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (d?.form) setForm((f) => ({ ...f, ...d.form }));
      if (d?.lyrics) { setLyrics(d.lyrics); setLyricsStatus('ready'); }
      if (d?.lyricsKey) setLyricsKey(d.lyricsKey);
      if (d?.orderId) setOrderId(d.orderId);
      if (Number.isInteger(d?.step) && d.step >= 1 && d.step <= 5) setStep(d.step);
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

  useEffect(() => {
    if (!restored) return undefined;
    let ativo = true;
    fetch('/api/us/countries', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (!ativo) return;
        const lista = Array.isArray(d.countries) ? d.countries : [];
        setCountries(lista);
        setDetected(d.detected || '');
        setForm((f) => (f.country && lista.some((c) => c.code === f.country) ? f : { ...f, country: '' }));
        const salvo = (() => { try { return localStorage.getItem(COUNTRY_KEY); } catch { return ''; } })();
        if (!salvo || !lista.some((c) => c.code === salvo)) setAskCountry(true);
      })
      .catch(() => { if (ativo) setError(textosBr('en').errors.load); });
    return () => { ativo = false; };
  }, [restored]);

  const [storyBusy, setStoryBusy] = useState(false);
  const [storyError, setStoryError] = useState('');

  const set = useCallback((k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (!['customerEmail', 'customerPhone', 'termsAccepted'].includes(k)) setOrderId('');
  }, []);

  const pickCountry = (code) => {
    try { localStorage.setItem(COUNTRY_KEY, code); } catch { /* ok */ }
    if (form.country && form.country !== code) {
      setForm((f) => ({ ...f, country: code, genre: '', faithThemes: false, occasion: '', occasionOther: false, cardId: '', relationship: '' }));
      setLyrics(''); setLyricsStatus('idle'); setOrderId('');
      if (step > 1) setStep(1);
    } else {
      setForm((f) => ({ ...f, country: code }));
    }
    setAskCountry(false);
  };

  const ir = (n) => { setError(''); setShowValidation(false); setStep(n); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const card = t.recipients.find((c) => c.id === form.cardId) || null;
  const relationship = form.cardId === 'other' ? form.relationshipOther.trim() : form.relationship;
  const recipientName = form.isSelf ? form.senderName : form.recipientName;
  const genreObj = country?.genres?.find((g) => g.id === form.genre) || null;
  const faithAvailable = Boolean(genreObj && FAITH.test(`${genreObj.id} ${genreObj.name}`));
  const moodObj = t.moods.find((m) => m[3] === form.mood);
  const voiceObj = t.s3.voices.find((v) => v[0] === form.vocals);
  const occasionKnown = t.occasions.some(([o]) => o === form.occasion);
  const norm = (v) => String(v || '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
  const namesSwapped = !form.isSelf && Boolean(norm(form.recipientName)) && norm(form.recipientName) === norm(form.senderName);

  const spec = () => ({
    country: form.country, recipientName: recipientName.trim(), senderName: form.senderName.trim(),
    relationship, occasion: form.occasion.trim(), story: form.story.trim(), genre: form.genre,
    mood: form.mood || 'heartfelt', vocals: form.vocals || 'any',
    requiredNames: form.requiredNames.trim(), requiredPhrase: form.requiredPhrase.trim(),
    faithThemes: Boolean(faithAvailable && form.faithThemes),
  });

  const faltando = () => {
    if (step === 1) return !relationship || !recipientName.trim() || !form.senderName.trim() || !form.occasion.trim();
    if (step === 2) return form.story.trim().length < STORY_MIN;
    if (step === 3) return !form.genre || !form.mood || !form.vocals;
    if (step === 4) return form.customerPhone.replace(/\D/g, '').length < 8;
    if (step === 5) return lyricsStatus !== 'ready' || lyrics.trim().length < LYRICS_MIN;
    return false;
  };

  async function gerarLetra() {
    setLyricsStatus('generating'); setError(''); setEditing(false); setSavedMsg(false);
    if (step !== 5) ir(5);
    controller.current?.abort();
    controller.current = new AbortController();
    try {
      const d = await post('/api/us/lyrics', spec(), controller.current.signal, t.errors.generic);
      setLyrics(d.lyrics || ''); setLyricsKey(JSON.stringify(spec())); setOrderId('');
      setLyricsStatus('ready');
    } catch (e) {
      if (e.name !== 'AbortError') { setError(e.message); setLyricsStatus('error'); }
    }
  }

  async function aprovarLetra() {
    setBusy(true); setError('');
    controller.current?.abort();
    controller.current = new AbortController();
    // Reino Unido e Austrália: o zero inicial do número nacional some com o código do país.
    const telefone = form.customerPhone.trim().startsWith('+')
      ? form.customerPhone.trim()
      : `${PHONE_PREFIX[form.country] || '+1'} ${form.customerPhone.trim().replace(/^0+/, '')}`;
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
    if (faltando()) {
      setShowValidation(true);
      setTimeout(() => {
        const el = document.querySelector('[data-missing="true"]');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.querySelector('input, select, textarea')?.focus();
        }
      }, 50);
      return;
    }
    if (step < 4) return ir(step + 1);
    // Só escreve de novo se algo mudou desde a última letra (voltar e avançar não gasta outra geração).
    if (step === 4) return lyrics && lyricsKey === JSON.stringify(spec()) ? ir(5) : gerarLetra();
    return aprovarLetra();
  };

  const escolherCard = (c) => {
    setForm((f) => {
      const n = { ...f, cardId: c.id, isSelf: c.id === 'self' };
      if (c.value) n.relationship = c.value;
      else if (c.relations) n.relationship = c.relations.some(([, v]) => v === f.relationship) ? f.relationship : (c.relations.length === 1 ? c.relations[0][1] : '');
      else n.relationship = '';
      return n;
    });
    setOrderId('');
  };

  if (!countries) {
    return (
      <div className="nx-experience nx-creation" style={{ minHeight: '100vh', backgroundColor: '#faf8f5' }}>
        <p role="status" style={{ padding: '40px 16px', textAlign: 'center', color: '#64748b' }}>{error || t.loading}</p>
      </div>
    );
  }

  const v = showValidation;

  const etapa1 = (
    <section className="nx-form-column" style={{ width: '100%', maxWidth: '34rem', margin: '0 auto' }}>
      <div data-missing={v && !relationship ? 'true' : undefined}>
        <Titulo as="h1" missing={v && !form.cardId} missingText={t.s1.pick}>{t.s1.title}</Titulo>
        <div className="wz-s">{t.s1.subtitle}</div>
        <div className="cards2" role="group" aria-label={t.s1.title}>
          {t.recipients.map((c) => (
            <button key={c.id} type="button" aria-pressed={form.cardId === c.id} onClick={() => escolherCard(c)} className={`card2 ${form.cardId === c.id ? 'on' : ''}`}>
              <Icone3D emoji={c.icon} className="c2-ic" prioridade />
              <span className="c2-lb">{c.label}</span>
              {c.sub && <span className="c2-sub">{c.sub}</span>}
            </button>
          ))}
        </div>

        {card?.relations?.length > 1 && (
          <div style={{
            margin: '-4px 0 16px', padding: '10px 14px', borderRadius: '14px',
            background: !form.relationship ? '#fffbeb' : '#f8fafc',
            border: !form.relationship ? (v ? '1.5px solid #dc2626' : '1.5px solid #f59e0b') : '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px',
          }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: !form.relationship ? (v ? '#dc2626' : '#b45309') : '#4f46e5' }}>
              {!form.relationship ? t.s1.pickPair(card.relations.map(([l]) => l)) : t.s1.whoIs}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {card.relations.map(([rotulo, valor]) => {
                const on = form.relationship === valor;
                return (
                  <button key={valor} type="button" onClick={() => set('relationship', valor)} aria-pressed={on}
                    style={{ padding: '8px 18px', borderRadius: '100px', fontSize: '0.88rem', fontWeight: 700, border: on ? '1px solid #4f46e5' : '1px solid #cbd5e1', backgroundColor: on ? '#4f46e5' : '#ffffff', color: on ? '#ffffff' : '#1e293b', cursor: 'pointer', transition: 'all 0.15s ease' }}>
                    {rotulo}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {form.cardId === 'other' && (
          <div style={{ margin: '-4px 0 16px' }}>
            <input aria-label={t.s1.otherPh} className={`wz-inp ${v && !form.relationshipOther.trim() ? 'erro' : ''}`} value={form.relationshipOther} onChange={(e) => set('relationshipOther', e.target.value)} placeholder={t.s1.otherPh} maxLength={100} />
          </div>
        )}
      </div>

      <div style={{ marginTop: '1.4rem' }}>
        {!form.isSelf ? (
          <>
            <div className="wz-t">{t.s1.nameTitle}</div>
            <div className="wz-s">{t.s1.nameSub}</div>
            <div data-missing={v && !form.recipientName.trim() ? 'true' : undefined} style={{ marginBottom: '14px' }}>
              <label htmlFor="wz-nome-homenageado" style={labelStyle}>{t.s1.nameLabel}</label>
              <input id="wz-nome-homenageado" className={`wz-inp ${v && !form.recipientName.trim() ? 'erro' : ''}`} value={form.recipientName} onChange={(e) => set('recipientName', e.target.value)} placeholder={t.s1.namePh} autoComplete="off" maxLength={100} />
              {v && !form.recipientName.trim() && <span style={errorLine}>● {t.s1.nameMissing}</span>}
            </div>
          </>
        ) : (
          <>
            <div className="wz-t">{t.s1.selfTitle}</div>
            <div className="wz-s">{t.s1.selfSub}</div>
          </>
        )}

        <div data-missing={v && !form.senderName.trim() ? 'true' : undefined} style={{ marginBottom: '16px' }}>
          <label htmlFor="wz-nome-cliente" style={labelStyle}>{form.isSelf ? t.s1.senderSelf : t.s1.senderLabel}</label>
          <input id="wz-nome-cliente" className={`wz-inp ${v && !form.senderName.trim() ? 'erro' : ''}`} value={form.senderName} onChange={(e) => set('senderName', e.target.value)} placeholder={t.s1.senderPh} autoComplete="given-name" maxLength={100} />
          {v && !form.senderName.trim() && <span style={errorLine}>● {t.s1.senderMissing}</span>}
          {namesSwapped && (
            <div role="alert" style={{ marginTop: '8px', padding: '10px 12px', borderRadius: '10px', background: '#fffbeb', border: '1px solid #f59e0b', color: '#92400e', fontSize: '0.84rem', lineHeight: 1.4 }}>
              {t.s1.swapped}
            </div>
          )}
        </div>
      </div>

      <div data-missing={v && !form.occasion.trim() ? 'true' : undefined} style={{ marginTop: '1.4rem' }}>
        <Titulo missing={v && !form.occasion.trim()} missingText={t.s1.occPick}>{t.s1.occTitle}</Titulo>
        <div className="wz-s">{t.s1.occSub}</div>
        <div className="cards2" role="group" aria-label={t.s1.occTitle}>
          {t.occasions.map(([rotulo, icone]) => {
            const on = !form.occasionOther && form.occasion === rotulo;
            return (
              <button key={rotulo} type="button" aria-pressed={on} onClick={() => setForm((f) => ({ ...f, occasion: rotulo, occasionOther: false }))} className={`card2 ${on ? 'on' : ''}`}>
                <Icone3D emoji={icone} className="c2-ic" />
                <span className="c2-lb">{rotulo}</span>
              </button>
            );
          })}
          <button type="button" aria-pressed={form.occasionOther || (!occasionKnown && Boolean(form.occasion))}
            onClick={() => setForm((f) => ({ ...f, occasionOther: true, occasion: occasionKnown ? '' : f.occasion }))}
            className={`card2 ${form.occasionOther || (!occasionKnown && form.occasion) ? 'on' : ''}`}>
            <Icone3D emoji="✨" className="c2-ic" />
            <span className="c2-lb">{t.s1.occOther}</span>
          </button>
        </div>
        {(form.occasionOther || (!occasionKnown && form.occasion)) && (
          <div style={{ marginTop: '10px' }}>
            <label htmlFor="wz-ocasiao-outra" className="wz-s" style={{ display: 'block', marginBottom: '6px' }}>{t.s1.occOtherLabel}</label>
            <input id="wz-ocasiao-outra" type="text" className="wz-inp" maxLength={60} value={occasionKnown ? '' : form.occasion} onChange={(e) => set('occasion', e.target.value)} placeholder={t.s1.occOtherPh} />
          </div>
        )}
      </div>
    </section>
  );

  const storyLen = form.story.trim().length;
  const sugerirHistoria = async () => {
    setStoryBusy(true); setStoryError('');
    try {
      const d = await post('/api/us/story-suggestion', { country: form.country, language: lang, recipientName: recipientName.trim(), senderName: form.senderName.trim(), relationship, occasion: form.occasion.trim() }, undefined, t.s2.aiError);
      if (d.suggestion) set('story', d.suggestion); else setStoryError(t.s2.aiError);
    } catch { setStoryError(t.s2.aiError); } finally { setStoryBusy(false); }
  };
  const etapa2 = (
    <section className="nx-form-column" style={{ width: '100%', maxWidth: '34rem', margin: '0 auto' }}>
      <h1 className="wz-t" style={{ margin: 0 }}>{t.s2.title}</h1>
      <div className="wz-s">{t.s2.subtitle(recipientName.trim())}</div>
      <div data-missing={v && storyLen < STORY_MIN ? 'true' : undefined}>
        <textarea aria-label={t.s2.title} className={`wz-inp ${v && storyLen < STORY_MIN ? 'erro' : ''}`} value={form.story} onChange={(e) => set('story', e.target.value)} placeholder={t.s2.ph} rows={8} maxLength={4000} style={{ minHeight: '8.5rem', lineHeight: 1.6 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', color: storyLen >= STORY_MIN ? '#16a34a' : '#857D80', fontWeight: 600 }}>{t.s2.count(storyLen)}</span>
          {v && storyLen < STORY_MIN && <span style={missingTag}>● {t.s2.missing}</span>}
        </div>
      </div>
      <div style={{ marginTop: '14px' }}>
        <button type="button" onClick={sugerirHistoria} disabled={storyBusy} style={{ width: '100%', minHeight: '48px', padding: '12px 18px', borderRadius: '100px', border: '1.5px solid #c7d2fe', background: 'linear-gradient(135deg, #eef2ff 0%, #ede9fe 100%)', color: '#4338ca', fontSize: '0.92rem', fontWeight: 700, cursor: storyBusy ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 2px 10px rgba(79, 70, 229, 0.08)', opacity: storyBusy ? 0.75 : 1 }}>
          <Sparkles size={18} style={{ color: '#6366f1', flexShrink: 0 }} />
          <span>{storyBusy ? t.s2.aiBusy : t.s2.ai}</span>
        </button>
        {storyError && <div role="alert" style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '6px', textAlign: 'center' }}>{storyError}</div>}
      </div>
      <div style={{ marginTop: '1.2rem' }}>
        <label htmlFor="wz-nomes" style={labelStyle}>{t.s2.names}</label>
        <input id="wz-nomes" className="wz-inp" value={form.requiredNames} onChange={(e) => set('requiredNames', e.target.value)} placeholder={t.s2.namesPh} maxLength={300} />
      </div>
      <div style={{ marginTop: '0.9rem' }}>
        <label htmlFor="wz-frase" style={labelStyle}>{t.s2.phrase}</label>
        <input id="wz-frase" className="wz-inp" value={form.requiredPhrase} onChange={(e) => set('requiredPhrase', e.target.value)} placeholder={t.s2.phrasePh} maxLength={300} />
      </div>
    </section>
  );

  const etapa3 = (
    <section className="nx-form-column" style={{ width: '100%', maxWidth: '34rem', margin: '0 auto' }}>
      <div data-missing={v && !form.genre ? 'true' : undefined}>
        <Titulo as="h1" missing={v && !form.genre} missingText={t.s3.genrePick}>{t.s3.genreTitle}</Titulo>
        <div className="wz-s">{t.s3.genreSub}</div>
        <div className="cards2" role="group" aria-label={t.s3.genreTitle}>
          {(country?.genres || []).map((g) => (
            <button key={g.id} type="button" aria-pressed={form.genre === g.id} className={`card2 ${form.genre === g.id ? 'on' : ''}`}
              onClick={() => setForm((f) => ({ ...f, genre: g.id, faithThemes: FAITH.test(`${g.id} ${g.name}`) ? f.faithThemes : false }))}>
              <Icone3D src={iconeDoRitmo(g.id)} className="c2-ic" />
              <span className="c2-lb">{g.name}</span>
              {g.description && <span className="c2-sub">{g.description}</span>}
            </button>
          ))}
        </div>
        {faithAvailable && (
          <label style={{ display: 'flex', gap: '10px', alignItems: 'center', margin: '0 0 12px', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.faithThemes} onChange={(e) => set('faithThemes', e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#4f46e5' }} />
            {t.s3.faith}
          </label>
        )}
      </div>

      <div data-missing={v && !form.mood ? 'true' : undefined} style={{ marginTop: '1.1rem' }}>
        <Titulo missing={v && !form.mood} missingText={t.s3.moodPick}>{t.s3.moodTitle}</Titulo>
        <div className="wz-s">{t.s3.moodSub}</div>
        <div className="cards2" role="group" aria-label={t.s3.moodTitle}>
          {t.moods.map(([rotulo, icone, sub, valor]) => (
            <button key={rotulo} type="button" aria-pressed={form.mood === valor} onClick={() => set('mood', valor)}
              className={`card2 ${form.mood === valor ? 'on' : ''}`}>
              <Icone3D emoji={icone} className="c2-ic" />
              <span className="c2-lb">{rotulo}</span>
              <span className="c2-sub">{sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div data-missing={v && !form.vocals ? 'true' : undefined} style={{ marginTop: '1.1rem' }}>
        <Titulo missing={v && !form.vocals} missingText={t.s3.voicePick}>{t.s3.voiceTitle}</Titulo>
        <div className="wz-s">{t.s3.voiceSub}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
          {t.s3.voices.map(([valor, rotulo, icone, sub]) => (
            <button key={valor} type="button" aria-pressed={form.vocals === valor} onClick={() => set('vocals', valor)} className={`card2 ${form.vocals === valor ? 'on' : ''}`} style={{ minHeight: '5.2rem' }}>
              <Icone3D emoji={icone} className="c2-ic" />
              <span className="c2-lb">{rotulo}</span>
              <span className="c2-sub">{sub}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );

  const phoneMissing = v && form.customerPhone.replace(/\D/g, '').length < 8;
  const etapa4 = (
    <section className="nx-form-column" style={{ width: '100%', maxWidth: '34rem', margin: '0 auto' }}>
      <h1 className="wz-t">{t.s4.title}</h1>
      <div className="wz-s">{t.s4.subtitle}</div>

      <article className="nx-card nx-review" style={{ padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '16px', backgroundColor: '#ffffff', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', gap: '8px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>{t.s4.for(recipientName.trim())}</h2>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#4338ca', backgroundColor: '#eef2ff', padding: '2px 8px', borderRadius: '6px' }}>{form.occasion}</span>
        </div>
        <p style={{ fontSize: '0.84rem', margin: '0 0 10px', color: '#64748b' }}>
          {t.s4.from} {form.senderName} · {genreObj?.name} · {moodObj?.[0]}{voiceObj && <span> · {t.s4.voice}: {voiceObj[1]}</span>}
        </p>
        <p className="nx-story-review" style={{ fontSize: '0.84rem', lineHeight: 1.5, maxHeight: '130px', overflowY: 'auto', color: '#334155', margin: 0 }}>{form.story}</p>
      </article>

      <div data-missing={phoneMissing ? 'true' : undefined} style={{ marginBottom: '14px' }}>
        <label htmlFor="wz-phone" style={{ ...labelStyle, marginBottom: '4px' }}>{t.s4.phoneLabel}</label>
        <span style={{ display: 'block', fontSize: '0.78rem', color: '#857D80', marginBottom: '8px' }}>{t.s4.phoneSub}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="wz-inp" style={{ width: 'auto', flex: '0 0 auto', color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Bandeira code={country?.code} size={15} /> {PHONE_PREFIX[form.country] || '+1'}
          </span>
          <input id="wz-phone" type="tel" inputMode="tel" autoComplete="tel-national" className={`wz-inp ${phoneMissing ? 'erro' : ''}`} value={form.customerPhone} onChange={(e) => set('customerPhone', e.target.value)} placeholder={t.s4.phonePh} maxLength={30} />
        </div>
        {phoneMissing && <span style={errorLine}>● {t.s4.phoneMissing}</span>}
      </div>

      <div style={{ marginBottom: '14px' }}>
        <label htmlFor="wz-email" style={labelStyle}>{t.s4.emailLabel}</label>
        <input id="wz-email" type="email" autoComplete="email" className="wz-inp" value={form.customerEmail} onChange={(e) => set('customerEmail', e.target.value)} placeholder={t.s4.emailPh} maxLength={200} />
      </div>

      {/* Aceite implícito: continuar já vale como aceite (sem caixinha para marcar). */}
      <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>{t.s4.terms}</p>
    </section>
  );

  const etapa5 = (
    <div style={{ maxWidth: '34rem', margin: '0 auto' }}>
      {lyricsStatus === 'generating' ? (
        <div style={{ ...cardBox, padding: '36px 20px', textAlign: 'center' }}>
          <StudioLyricsAnimation />
          <h1 className="wz-t" style={{ fontSize: '1.18rem', marginTop: '14px' }}>{t.s5.generating}</h1>
          <p className="wz-s" style={{ margin: '8px auto 0', maxWidth: '420px' }}>{t.s5.generatingSub(recipientName.trim())}</p>
        </div>
      ) : lyricsStatus === 'error' ? (
        <div style={{ ...cardBox, border: '1.5px solid #fecdd3', padding: '32px 20px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#dc2626', margin: '8px 0' }}>{t.s5.error}</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 auto 16px', maxWidth: '420px' }}>{error || t.errors.generic}</p>
          <button type="button" className="btn-wz-primary" style={{ flex: 'none', padding: '12px 24px' }} onClick={gerarLetra}>{t.s5.tryAgain}</button>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '14px' }}>
            <h1 className="wz-t" style={{ margin: 0 }}>{t.s5.title}</h1>
            <p className="wz-s" style={{ margin: '4px 0 0' }}>{t.s5.subtitle(recipientName.trim())}</p>
          </div>
          <div style={{ ...cardBox, marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4f46e5', letterSpacing: '0.05em' }}>{t.s5.label}</span>
              <button type="button" onClick={() => { if (editing) setEditing(false); else { setEditText(lyrics); setEditing(true); setSavedMsg(false); } }}
                style={{ background: editing ? '#f1f5f9' : '#eef2ff', border: '1px solid #c7d2fe', color: '#4f46e5', padding: '5px 12px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {editing ? t.s5.cancel : t.s5.edit}
              </button>
            </div>
            {savedMsg && <div role="status" style={{ padding: '10px 14px', borderRadius: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: '0.84rem', fontWeight: 700, marginBottom: '12px' }}>{t.s5.saved}</div>}
            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <textarea aria-label={t.s5.label} value={editText} onChange={(e) => setEditText(e.target.value)} className="wz-inp" maxLength={4500} style={{ minHeight: '320px', lineHeight: 1.7, resize: 'vertical' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn-wz-primary" style={{ padding: '10px' }}
                    onClick={() => {
                      if (editText.trim().length < LYRICS_MIN) { setError(t.s5.tooShort); return; }
                      setLyrics(editText.trim()); setOrderId(''); setEditing(false); setSavedMsg(true); setError('');
                    }}>
                    {t.s5.save}
                  </button>
                  <button type="button" className="btn-wz-back" style={{ padding: '10px 16px' }} onClick={() => setEditing(false)}>{t.s5.cancel}</button>
                </div>
              </div>
            ) : (
              <LetraFormatada texto={lyrics} />
            )}
          </div>
          <div style={{ marginTop: '6px', textAlign: 'center' }}>
            <button type="button" onClick={gerarLetra} disabled={busy}
              style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: '6px' }}>
              {t.s5.regenerate}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const etapas = { 1: etapa1, 2: etapa2, 3: etapa3, 4: etapa4, 5: etapa5 };
  const rotulo = step <= 4
    ? (step === 4 && lyricsStatus === 'generating' ? t.writing : t.dock[step - 1])
    : (busy ? t.creating : t.approve);
  const dockDisabled = busy || lyricsStatus === 'generating';

  return (
    <div className="nx-experience nx-creation" lang={lang === 'es' ? 'es-MX' : 'en'} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#faf8f5' }}>
      {askCountry && <CountryPopup countries={countries} value={form.country || detected} onPick={pickCountry} />}

      <header className="nx-header">
        <div className="nx-header-inner">
          <Link href="/" className="nx-brand"><Image src="/logo.png" alt="NS Music" width={44} height={44} priority /><span>{t.brand}</span></Link>
          {country && (
            <button type="button" onClick={() => setAskCountry(true)} className="nx-account-link" style={{ background: 'none', border: '1px solid #e7e2ef', borderRadius: '999px', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <Bandeira code={country.code} size={13} /> {t.country.change}
            </button>
          )}
        </div>
      </header>

      <div className="criar-ambiente" aria-hidden="true"><span /></div>
      <main className="criar-main" style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <div className="container criar-container" style={{ maxWidth: '1120px' }}>
          <div className="wz-top" style={{ maxWidth: '34rem', margin: '0 auto 0.85rem', padding: '0 4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="wz-track" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL_JOURNEY} aria-valuenow={step} style={{ flex: 1, height: '6px', background: 'rgba(30, 27, 75, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
              <div className="wz-fill" style={{ width: `${(step / TOTAL_JOURNEY) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #8b7cf6 0%, #5a46e0 100%)', borderRadius: '999px', transition: 'width 0.5s cubic-bezier(0.22, 1, 0.36, 1)', boxShadow: '0 0 10px rgba(90, 70, 224, 0.45)' }} />
            </div>
            <span className="wz-count" style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748b', whiteSpace: 'nowrap' }}>{step}/{TOTAL_JOURNEY}</span>
          </div>

          {error && step !== 5 && <div className="nx-message nx-error" role="alert" style={{ maxWidth: '34rem', margin: '0 auto 12px' }}>{error}</div>}
          {error && step === 5 && lyricsStatus === 'ready' && <div className="nx-message nx-error" role="alert" style={{ maxWidth: '34rem', margin: '0 auto 12px' }}>{error}</div>}

          <div key={`etapa-${step}`} style={{ marginTop: '8px' }} className="criar-step-content">
            {etapas[step]}
          </div>
        </div>
      </main>

      <div className="criar-navigation-dock" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
        backgroundColor: 'rgba(255, 255, 255, 0.82)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(30, 27, 75, 0.08)', boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.06)',
        padding: '10px 16px calc(10px + env(safe-area-inset-bottom, 0px)) 16px',
      }}>
        <div style={{ width: '100%', maxWidth: '34rem', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {step > 1 && (
            <button type="button" className="btn-wz-back" onClick={() => ir(step - 1)} disabled={busy}>{t.back}</button>
          )}
          <button type="button" className="btn-wz-primary" onClick={avancar} disabled={dockDisabled}
            style={{ padding: '0.78rem 1rem', fontSize: 'clamp(0.84rem, 3.8vw, 0.96rem)', whiteSpace: 'nowrap' }}>
            {rotulo}
          </button>
        </div>
      </div>
    </div>
  );
}

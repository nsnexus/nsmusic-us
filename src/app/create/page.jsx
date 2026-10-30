'use client';
import { useEffect, useRef, useState } from 'react';
import { Shell } from '@/components/us/Shell';
import { US_GENRES } from '@/lib/usCatalog';
import { trackFbViewContent, trackFbInitiateCheckout } from '@/lib/metaPixel';

const STEPS = ['Your story', 'Their sound', 'The lyrics', 'Your preview'];
const initial = {
  recipientName: '',
  senderName: '',
  relationship: '',
  occasion: 'Birthday',
  story: '',
  genre: '',
  mood: 'Heartfelt',
  vocals: 'any',
  customerEmail: '',
  customerPhone: '',
  countryCode: '+1',
  termsAccepted: false,
  requiredNames: '',
  requiredPhrase: '',
  faithThemes: false,
};

async function request(url, body, signal) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

export default function CreatePage() {
  const [step, setStep] = useState(0),
    [form, setForm] = useState(initial),
    [lyrics, setLyrics] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [orderId, setOrderId] = useState('');

  const heading = useRef(null),
    mounted = useRef(true),
    controller = useRef(null);

  useEffect(() => {
    mounted.current = true;
    trackFbViewContent();
    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, []);

  useEffect(() => {
    heading.current?.focus();
  }, [step]);

  const update = (key, value) => {
    setForm((f) => ({
      ...f,
      [key]: value,
      ...(key === 'genre' && !['christian', 'gospel'].includes(value) ? { faithThemes: false } : {}),
    }));
    setOrderId('');
  };

  const go = (value) => {
    setError('');
    setStep(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  async function generate(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    controller.current = new AbortController();
    try {
      const data = await request('/api/us/lyrics', form, controller.current.signal);
      if (mounted.current) {
        setLyrics(data.lyrics || '');
        setOrderId('');
        go(2);
      }
    } catch (e) {
      if (e.name !== 'AbortError' && mounted.current) setError(e.message);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  async function checkout(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    controller.current = new AbortController();
    try {
      let id = orderId;
      const formattedPhone =
        form.customerPhone && form.customerPhone.trim()
          ? form.customerPhone.trim().startsWith('+')
            ? form.customerPhone.trim()
            : `${(form.countryCode || '+1').split('_')[0]} ${form.customerPhone.trim()}`
          : '';
      if (!id) {
        const data = await request(
          '/api/us/orders',
          { ...form, customerPhone: formattedPhone, lyrics, sku: 'audio_only' },
          controller.current.signal
        );
        id = data.order.id;
        if (mounted.current) setOrderId(id);
      }
      try {
        await request('/api/us/music', { orderId: id }, controller.current.signal);
      } catch (mErr) {
        console.warn('[us-music] Generation trigger:', mErr.message);
      }
      try {
        trackFbInitiateCheckout({
          orderId: id,
          value: 4.99,
          currency: 'USD',
          contentName: 'Custom Song Preview',
          email: form.customerEmail,
          phone: formattedPhone,
        });
      } catch (_) {}
      if (mounted.current) window.location.assign('/delivery?orderId=' + encodeURIComponent(id));
    } catch (e) {
      if (e.name !== 'AbortError' && mounted.current) setError(e.message);
      if (mounted.current) setBusy(false);
    }
  }

  const field = (key, label, placeholder, required = true) => (
    <label className="us-field">
      {label}
      <input
        required={required}
        maxLength={['requiredPhrase', 'requiredNames'].includes(key) ? 300 : 100}
        value={form[key]}
        placeholder={placeholder}
        onChange={(e) => update(key, e.target.value)}
      />
    </label>
  );

  return (
    <Shell>
      <main className="us-create us-wrap">
        <div className="us-creation-heading">
          <div className="us-eyebrow">A SONG THAT COULD ONLY BE THEIRS</div>
          <h1 ref={heading} tabIndex={-1}>
            {[
              'Every great song starts\nwith a little story.',
              'Let’s find\ntheir kind of sound.',
              'Your story,\nline by lovely line.',
              'Listen to your song\npreview for free.',
            ][step]
              .split('\n')
              .map((line, i) => (
                <span key={line}>
                  {i === 1 ? <i>{line}</i> : line}
                  <br />
                </span>
              ))}
          </h1>
          <p>
            {[
              'Tell us the things that make them, them. The more personal, the better.',
              'Choose a style and a feeling. We’ll make something original.',
              'Read your AI-written lyrics, change anything, and make sure every detail feels right.',
              'We compose two unique arrangements from your words. Listen to your preview first, completely free.',
            ][step]}
          </p>
        </div>
        <div className="us-wizard-layout">
          <aside className="us-wizard-aside">
            <ol className="us-steps">
              {STEPS.map((name, index) => (
                <li className={step === index ? 'active' : step > index ? 'done' : ''} key={name}>
                  <span>{step > index ? '✓' : String(index + 1).padStart(2, '0')}</span>
                  {name}
                </li>
              ))}
            </ol>
            <div className="us-aside-note">
              <span>♪</span>
              <h3>Listen before you pay.</h3>
              <p>
                We generate your music preview first. Once ready, you’ll listen to both versions before deciding to unlock
                downloads. No upfront charge.
              </p>
            </div>
          </aside>
          <div className="us-form-panel">
            {error && (
              <div role="alert" className="us-error">
                {error}
              </div>
            )}
            {step === 0 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  go(1);
                }}
              >
                <div className="us-field-row">
                  {field('recipientName', 'Who is it for?', 'Their first name')}
                  {field('senderName', 'And who is it from?', 'Your name')}
                </div>
                <div className="us-field-row">
                  {field('relationship', 'They’re my…', 'Partner, mom, best friend…')}
                  <label className="us-field">
                    The occasion
                    <select value={form.occasion} onChange={(e) => update('occasion', e.target.value)}>
                      {['Birthday', 'Anniversary', 'Wedding', 'Thank you', 'Just because', 'Family tribute', 'Remembrance', 'Other'].map(
                        (x) => (
                          <option key={x}>{x}</option>
                        )
                      )}
                    </select>
                  </label>
                </div>
                <label className="us-field">
                  Tell us your story{' '}
                  <span className="us-field-hint">A memory, a habit, an inside joke. What would only you know?</span>
                  <textarea
                    required
                    minLength={40}
                    maxLength={4000}
                    rows={7}
                    value={form.story}
                    onChange={(e) => update('story', e.target.value)}
                    placeholder="We met in a tiny coffee shop in Nashville. He was reading my favorite book. Ten years later, he still leaves me coffee on the nightstand every morning…"
                  />
                </label>
                <div className="us-field-row">
                  {field('requiredNames', 'Names to include (optional)', 'Emma, Jack, our dog Milo', false)}
                  {field('requiredPhrase', 'A line that matters (optional)', '“Always take the scenic route”', false)}
                </div>
                <p className="us-fine">
                  Share only details you’re comfortable including in your gift. Don’t include private contact or financial
                  information.
                </p>
                <div className="us-form-actions">
                  <span>01 / 04</span>
                  <button className="us-button" type="submit">
                    Find their sound <span>→</span>
                  </button>
                </div>
              </form>
            )}
            {step === 1 && (
              <form onSubmit={generate}>
                <fieldset className="us-fieldset">
                  <legend>The musical direction</legend>
                  <div className="us-sound-options">
                    {US_GENRES.map((g) => (
                      <label className={form.genre === g.id ? 'selected' : ''} key={g.id}>
                        <input
                          type="radio"
                          required
                          name="genre"
                          value={g.id}
                          checked={form.genre === g.id}
                          onChange={() => update('genre', g.id)}
                        />
                        <strong>{g.name}</strong>
                        <span>{g.description}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="us-field-row">
                  <label className="us-field">
                    The feeling
                    <select value={form.mood} onChange={(e) => update('mood', e.target.value)}>
                      {['Heartfelt', 'Joyful', 'Nostalgic', 'Romantic', 'Uplifting', 'Gentle', 'Playful', 'Reflective'].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                  <label className="us-field">
                    Vocal preference
                    <select value={form.vocals} onChange={(e) => update('vocals', e.target.value)}>
                      {[
                        ['any', 'No preference'],
                        ['female', 'Female'],
                        ['male', 'Male'],
                        ['duet', 'Duet'],
                      ].map(([value, label]) => (
                        <option value={value} key={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="us-check">
                  <input
                    type="checkbox"
                    disabled={!['christian', 'gospel'].includes(form.genre)}
                    checked={form.faithThemes}
                    onChange={(e) => update('faithThemes', e.target.checked)}
                  />
                  <span>
                    <strong>Include Christian faith or worship themes.</strong>
                    <small>
                      Optional. Gospel is a musical style; selecting it does not add religious lyrics. Choose Christian / Worship or
                      Gospel / Soul and check this box to include Christian faith in the words.
                    </small>
                  </span>
                </label>
                <p className="us-fine">
                  We create original AI music. We don’t clone voices or promise the sound of a specific artist. Vocal preferences
                  guide generation and may vary.
                </p>
                <div className="us-form-actions">
                  <button type="button" className="us-text-button" disabled={busy} onClick={() => go(0)}>
                    ← Your story
                  </button>
                  <button className="us-button" type="submit" disabled={busy}>
                    {busy ? 'Finding your words…' : 'Write my lyrics'} <span>→</span>
                  </button>
                </div>
                {busy && (
                  <p className="us-fine" role="status">
                    Your lyrics are being written. This may take a moment.
                  </p>
                )}
              </form>
            )}
            {step === 2 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (lyrics.trim().length < 80 || lyrics.length > 4500) {
                    setError('Please keep your lyrics between 80 and 4,500 characters.');
                    return;
                  }
                  go(3);
                }}
              >
                <div className="us-lyrics-label">
                  <span>THE FIRST DRAFT</span>
                  <span>For {form.recipientName}</span>
                </div>
                <label className="us-field">
                  Your editable lyrics
                  <textarea
                    className="us-lyrics-editor"
                    aria-describedby="us-lyrics-help"
                    required
                    minLength={80}
                    maxLength={4500}
                    rows={19}
                    value={lyrics}
                    onChange={(e) => {
                      setLyrics(e.target.value);
                      setOrderId('');
                    }}
                  />
                </label>
                <p id="us-lyrics-help" className="us-fine">
                  {lyrics.length.toLocaleString('en-US')} / 4,500 characters. Keep your lyrics between 80 and 4,500 characters.
                  Check names, pronunciation hints, and personal details. The final audio may interpret phrasing and structure
                  creatively.
                </p>
                <div className="us-form-actions">
                  <button type="button" className="us-text-button" onClick={() => go(1)}>
                    ← Their sound
                  </button>
                  <button className="us-button" type="submit">
                    Hear My Preview <span>→</span>
                  </button>
                </div>
              </form>
            )}
            {step === 3 && (
              <form onSubmit={checkout}>
                <div
                  style={{
                    background: 'var(--card-bg)',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-md)',
                    padding: '24px',
                    marginBottom: '24px',
                    boxShadow: 'var(--card-shadow)',
                  }}
                >
                  <div className="us-eyebrow" style={{ marginBottom: '8px' }}>
                    <span></span> 100% FREE STUDIO PREVIEW
                  </div>
                  <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>
                    Two custom song arrangements for {form.recipientName || 'your person'}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7', margin: 0 }}>
                    We’ll create two unique AI studio arrangements from your words. You will listen to your full preview first
                    before choosing whether to unlock downloads or keepsake extras. No upfront payment required.
                  </p>
                </div>

                <label className="us-field">
                  Your email (optional)
                  <input
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    value={form.customerEmail}
                    onChange={(e) => update('customerEmail', e.target.value)}
                    placeholder="you@example.com (optional)"
                  />
                  <span className="us-field-hint">Optional. Used to send a backup access link for your song studio.</span>
                </label>
                <div className="us-field">
                  <label htmlFor="us-phone-input">
                    WhatsApp (optional){' '}
                    <span className="us-field-hint" style={{ display: 'inline', marginLeft: 4 }}>
                      Receive your song preview link directly on WhatsApp
                    </span>
                  </label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
                    <select
                      aria-label="Country Code"
                      value={form.countryCode || '+1'}
                      onChange={(e) => update('countryCode', e.target.value)}
                      style={{ width: 'auto', minWidth: 125, cursor: 'pointer' }}
                    >
                      <option value="+1">🇺🇸 +1 (US)</option>
                      <option value="+55">🇧🇷 +55 (BR)</option>
                      <option value="+1_CA">🇨🇦 +1 (CA)</option>
                      <option value="+44">🇬🇧 +44 (UK)</option>
                      <option value="+61">🇦🇺 +61 (AU)</option>
                      <option value="+351">🇵🇹 +351 (PT)</option>
                      <option value="+34">🇪🇸 +34 (ES)</option>
                      <option value="+49">🇩🇪 +49 (DE)</option>
                      <option value="+33">🇫🇷 +33 (FR)</option>
                      <option value="+52">🇲🇽 +52 (MX)</option>
                      <option value="+54">🇦🇷 +54 (AR)</option>
                    </select>
                    <input
                      id="us-phone-input"
                      type="tel"
                      autoComplete="tel"
                      placeholder={(form.countryCode || '+1').startsWith('+1') ? '(555) 000-0000' : 'Mobile number'}
                      value={form.customerPhone || ''}
                      onChange={(e) => update('customerPhone', e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>
                  <span className="us-field-hint">
                    United States flag selected by default. You can change your country code at any time.
                  </span>
                </div>
                <label className="us-check">
                  <input
                    required
                    type="checkbox"
                    checked={form.termsAccepted}
                    onChange={(e) => update('termsAccepted', e.target.checked)}
                  />
                  <span>
                    I agree to the{' '}
                    <a href="/terms" target="_blank" rel="noopener noreferrer">
                      Terms
                    </a>{' '}
                    and acknowledge the{' '}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer">
                      Privacy Policy
                    </a>
                    , including AI generation and preview delivery.
                  </span>
                </label>
                <p className="us-fine">
                  We’ll compose two unique arrangements of your song. Once ready, you’ll listen to your full preview and can
                  choose your package to unlock downloads and extras. By continuing, you agree to our{' '}
                  <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.
                </p>
                <div className="us-form-actions">
                  <button type="button" className="us-text-button" disabled={busy} onClick={() => go(2)}>
                    ← Your lyrics
                  </button>
                  <button type="submit" className="us-button" disabled={busy}>
                    {busy ? 'Creating your song studio…' : 'Generate Free Song Preview ♫'} <span>→</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </Shell>
  );
}

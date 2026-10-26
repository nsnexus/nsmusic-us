'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { draftGiftLetter } from '@/lib/usGifts';
import MediaGift from '@/components/us-gifts/MediaGift';
import { Shell } from '@/components/us/Shell';

export default function GiftPage() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [letter, setLetter] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [active, setActive] = useState('letter');

  useEffect(() => {
    const controller = new AbortController();
    const id = new URLSearchParams(window.location.search).get('orderId');
    if (!id) { setError('Open your gift from your order page to get started.'); setLoading(false); return () => controller.abort(); }
    fetch(`/api/us/orders?orderId=${encodeURIComponent(id)}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.order) throw new Error(data.error || 'Your order could not be loaded.');
        setOrder({ ...data.order, id });
        setLetter(data.order.usLetter || draftGiftLetter(data.order));
      })
      .catch((err) => { if (err.name !== 'AbortError') setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  async function saveLetter() {
    setSaving(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/us/gifts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, action: 'save_letter', letter }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Your letter could not be saved.');
      setLetter(result.usLetter);
      setOrder((previous) => ({ ...previous, usLetter: result.usLetter }));
      setMessage('Your letter is saved. Print it or download a copy below.');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  function downloadLetter() {
    const page = document.implementation.createHTMLDocument('A letter for you · NSMusic');
    page.documentElement.lang = 'en';
    const meta = page.createElement('meta'); meta.setAttribute('charset', 'utf-8'); page.head.prepend(meta);
    const style = page.createElement('style');
    style.textContent = 'body{margin:0;padding:48px 24px;background:#f7f3eb;color:#292a24}article{max-width:620px;margin:auto;background:#fffcf7;padding:48px;font:20px/1.8 Georgia,serif;white-space:pre-wrap;overflow-wrap:anywhere}footer{max-width:620px;margin:24px auto;font:12px Arial,sans-serif;color:#726f66}@media print{body,article{padding:20px;background:white}}';
    page.head.appendChild(style);
    const article = page.createElement('article'); article.textContent = letter; page.body.appendChild(article);
    const footer = page.createElement('footer'); footer.textContent = 'NSMusic · Your story, in a song'; page.body.appendChild(footer);
    const url = URL.createObjectURL(new Blob(['<!doctype html>\n', page.documentElement.outerHTML], { type: 'text/html;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'a-letter-for-you.html'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const rights = order?.paid === true;
  const available = rights && order.hasCartaAccess;
  return <Shell><main className="gift-workspace">
    <div className="gift-top">{order && <Link href={`/listen?orderId=${encodeURIComponent(order.id)}`} className="gift-link">← Back to your song</Link>}</div>
    <header className="gift-heading"><p className="gift-eyebrow">THE FINISHING TOUCHES</p><h1>Make it a gift<br /><em>they can hold onto.</em></h1><p>A few words. A favorite photograph. A whole story brought back to life.</p></header>
    {loading ? <section className="gift-card" role="status">Opening your gift studio…</section> : !order ? <section className="gift-card"><p role="alert">{error}</p><Link className="gift-button" href="/create">Create a song</Link></section> : !available ? <section className="gift-card"><p className="gift-eyebrow">A LITTLE MORE TO GIVE</p><h2>Your gift extras are waiting.</h2><p>Letters are included from $5.99, photo videos from $7.99, and the complete retrospective from $9.99. Your package unlocks after verified payment.</p><Link className="gift-button" href={`/listen?orderId=${encodeURIComponent(order.id)}`}>View your order</Link></section> : <>
      <nav className="gift-tabs" aria-label="Gift extras"><button aria-pressed={active === 'letter'} onClick={() => { setActive('letter'); setError(''); }}>01 · Your letter</button>{order.hasVideoAccess && <button aria-pressed={active === 'video'} onClick={() => { setActive('video'); setError(''); }}>02 · Photo film</button>}{order.hasRetrospectivaAccess && <button aria-pressed={active === 'retrospective'} onClick={() => { setActive('retrospective'); setError(''); }}>03 · Retrospective</button>}</nav>
      {active === 'letter' && <section className="gift-card"><div className="gift-letter-grid"><div><p className="gift-eyebrow">FROM THE HEART</p><h2>Some things deserve<br />to be written down.</h2><p className="gift-muted">We have started a letter with the story you shared. Make it your own before you print or send it.</p><p className="gift-help">This is an editable keepsake draft, based on your words. Check the details and add a personal sign-off.</p><label className="gift-field">Your letter<textarea rows={16} maxLength={12000} value={letter} onChange={(event) => { setLetter(event.target.value); setMessage(''); }} /></label>
        {error && <p className="gift-error" role="alert">{error}</p>}{message && <p role="status" className="gift-success">{message}</p>}
        <div className="gift-actions"><button className="gift-button" onClick={saveLetter} disabled={saving || letter.trim().length < 20}>{saving ? 'Saving…' : 'Save letter'}</button><button className="gift-secondary" onClick={() => window.print()}>Print letter</button><button className="gift-link" onClick={downloadLetter}>Download letter</button></div></div>
        <article className="gift-paper gift-printable"><span className="gift-eyebrow">A NOTE, JUST FOR YOU</span><div>{letter}</div><span className="gift-paper-footer">NSMusic · Your story, in a song</span></article></div></section>}
      {active === 'video' && order.hasVideoAccess && <MediaGift key="video" order={order} onSaved={(updates) => setOrder((previous) => ({ ...previous, ...updates }))} />}
      {active === 'retrospective' && order.hasRetrospectivaAccess && <MediaGift key="retrospective" order={order} retrospective onSaved={(updates) => setOrder((previous) => ({ ...previous, ...updates }))} />}
    </>}
    <footer className="gift-footer">Made from your memories. Kept for a lifetime.</footer>
    <style jsx global>{`
      .gift-workspace { background:#f7f3eb; color:#292a24; min-height:100vh; padding:30px clamp(20px,5vw,80px); font-family:Arial,sans-serif; }
      .gift-workspace * { box-sizing:border-box; }
      .gift-top { display:flex; justify-content:space-between; align-items:center; gap:20px; max-width:1200px; margin:auto; }
      .gift-brand { font:700 28px Georgia,serif; color:#292a24; text-decoration:none; }.gift-brand span { display:block; font:11px Arial,sans-serif; margin-top:5px; color:#726f66; }
      .gift-heading { max-width:1200px; margin:80px auto 48px; }.gift-heading h1 { font:normal clamp(40px,6vw,72px)/1.06 Georgia,serif; letter-spacing:-2px; margin:18px 0 24px; }.gift-heading em { font-weight:normal; color:#ac573b; }.gift-heading>p:last-child { color:#6b6b60; line-height:1.7; }
      .gift-eyebrow { font:600 10px/1.5 Arial,sans-serif; letter-spacing:2px; color:#a35940; }
      .gift-card { max-width:1200px; padding:clamp(22px,4vw,48px); margin:0 auto; background:#fffcf7; border:1px solid #e5ddcf; border-radius:4px; }.gift-card h2 { font:normal clamp(27px,3vw,37px)/1.18 Georgia,serif; margin:14px 0 20px; }.gift-muted { color:#6b6b60; line-height:1.75; max-width:690px; }.gift-help { font-size:12px; line-height:1.6; color:#777468; }
      .gift-tabs { display:flex; gap:4px; max-width:1200px; margin:0 auto 22px; overflow:auto; }.gift-tabs button { background:transparent; white-space:nowrap; border:0; border-bottom:2px solid transparent; padding:16px 20px; font:14px Arial,sans-serif; color:#746f63; cursor:pointer; }.gift-tabs button[aria-pressed=true] { border-bottom-color:#b15b3d; color:#292a24; }
      .gift-letter-grid { display:grid; grid-template-columns:1fr 1fr; gap:48px; }.gift-field { display:block; font-size:13px; font-weight:600; margin-top:25px; }.gift-workspace textarea,.gift-workspace input[type=date] { width:100%; background:#fffefb; border:1px solid #d6cfc0; border-radius:3px; padding:13px; color:#292a24; font:14px/1.65 Arial,sans-serif; margin-top:8px; }.gift-workspace textarea { resize:vertical; }.gift-workspace button:focus-visible,.gift-workspace a:focus-visible,.gift-workspace input:focus-visible,.gift-workspace textarea:focus-visible { outline:3px solid #547466; outline-offset:3px; }
      .gift-actions { display:flex; flex-wrap:wrap; gap:12px; align-items:center; margin-top:24px; }.gift-button,.gift-secondary { display:inline-block; font:600 13px/1.4 Arial,sans-serif; padding:14px 21px; border-radius:4px; text-decoration:none; cursor:pointer; }.gift-button { background:#af583b; color:white; border:1px solid #af583b; }.gift-secondary { background:transparent; color:#34372f; border:1px solid #c9c3b5; }.gift-link { color:#4b574a; background:none; border:0; font:13px Arial,sans-serif; text-decoration:underline; cursor:pointer; padding:6px 0; }.gift-workspace button:disabled { opacity:.5; cursor:not-allowed; }
      .gift-paper { background:#f2eddf; padding:clamp(25px,3vw,48px); box-shadow:0 12px 32px #3a342514; font:19px/1.85 Georgia,serif; align-self:start; }.gift-paper>div { white-space:pre-wrap; overflow-wrap:anywhere; margin:35px 0 48px; }.gift-paper-footer { display:block; font:10px Arial,sans-serif; color:#898275; border-top:1px solid #d8d0bd; padding-top:16px; }
      .gift-upload { display:block; border:1px dashed #bcae97; padding:24px; margin:25px 0; text-align:center; background:#f8f4eb; font-size:14px; }.gift-upload input { display:block; margin:16px auto 0; max-width:100%; }.gift-photos { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:20px; }.gift-photo { border:1px solid #e2dacb; }.gift-photo img { width:100%; height:180px; object-fit:cover; }.gift-photo-fields { padding:16px; }.gift-photo-fields label { display:block; font-size:12px; margin:14px 0; }.gift-checkbox { display:flex; align-items:flex-start; gap:10px; font-size:13px; line-height:1.65; margin:25px 0; }.gift-checkbox input { margin-top:4px; }.gift-error { color:#a33129; font-size:14px; line-height:1.6; }.gift-success { color:#3b694a; font-size:14px; line-height:1.6; }.gift-result { margin-top:30px; border-top:1px solid #e2dacb; padding-top:30px; }.gift-result video { width:100%; max-height:580px; background:#252820; }.gift-workspace progress { width:100%; accent-color:#af583b; }
      .gift-memorybook { margin-top:50px; padding-top:30px; border-top:1px solid #e2dacb; }.gift-memorybook figure { display:grid; grid-template-columns:1fr 1fr; gap:35px; padding:30px 0; border-top:1px solid #e2dacb; margin:0; break-inside:avoid; }.gift-memorybook img { width:100%; max-height:400px; object-fit:contain; background:#f2eddf; }.gift-memorybook figcaption { align-self:center; font:23px/1.65 Georgia,serif; overflow-wrap:anywhere; }.gift-footer { text-align:center; font:14px Georgia,serif; color:#8b8375; margin:60px 0 20px; }
      @media(max-width:760px) { .gift-heading { margin-top:55px; }.gift-letter-grid { grid-template-columns:1fr; gap:35px; }.gift-memorybook figure { grid-template-columns:1fr; gap:15px; }.gift-top { align-items:flex-start; }.gift-top>.gift-link { max-width:120px; text-align:right; } }
      @media print { body * { visibility:hidden; }.us-header,.us-footer,.gift-top,.gift-heading,.gift-tabs,.gift-footer,.gift-letter-grid>div,.gift-card>:not(.gift-letter-grid):not(.gift-printable) { display:none!important; }.gift-printable,.gift-printable * { visibility:visible; }.gift-printable { position:absolute; top:0; left:0; width:100%; box-shadow:none; margin:0; border:0; padding:25px; background:white; color:black; }.gift-workspace { padding:0; background:white; }.gift-memorybook figure { break-inside:avoid; }.gift-memorybook img { max-height:450px; } }
    `}</style>
  </main></Shell>;
}

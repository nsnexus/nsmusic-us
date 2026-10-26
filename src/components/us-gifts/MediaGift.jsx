'use client';

import { useEffect, useRef, useState } from 'react';
import { renderGiftVideo } from './renderGiftVideo';

async function upload(orderId, file, video = false, signal) {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch(`/api/us/upload?orderId=${encodeURIComponent(orderId)}${video ? '&type=video' : ''}`, { method: 'POST', body, signal });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Your file could not be uploaded.');
  return result.url;
}

export default function MediaGift({ order, retrospective = false, onSaved }) {
  const saved = retrospective ? order.usRetrospective : order.usVideo;
  const [photos, setPhotos] = useState(saved?.photos || []);
  const [videoUrl, setVideoUrl] = useState(saved?.videoUrl || (!retrospective ? order.usVideoUrl : '') || '');
  const [rights, setRights] = useState(false);
  const [busy, setBusy] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const operation = useRef(null);
  const mounted = useRef(true);
  const orderId = order.id || order.orderId;
  const title = order.extras?.us?.spec?.recipientName || order.honoreeName || 'Our story';
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; operation.current?.abort(); };
  }, []);

  async function addPhotos(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    setError(''); setMessage('');
    if (!files.length) return;
    if (files.length + photos.length > 12) { setError('You can add up to 12 photos.'); return; }
    if (files.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) {
      setError('Choose JPG, PNG, or WebP photos under 5 MB each.'); return;
    }
    const controller = new AbortController(); operation.current = controller;
    setBusy('Uploading your photos…');
    try {
      // Keep each completed upload so a later failure does not lose earlier photos.
      for (const file of files) {
        const url = await upload(orderId, file, false, controller.signal);
        if (mounted.current) setPhotos((previous) => [...previous, { url, caption: '', date: '' }]);
      }
      setVideoUrl('');
    } catch (err) { if (mounted.current && err.name !== 'AbortError') setError(err.message); }
    finally { if (mounted.current) setBusy(''); }
  }

  async function createVideo() {
    setError(''); setMessage('');
    if (!rights || !photos.length) { setError('Add at least one photo and confirm your photo permissions.'); return; }
    const controller = new AbortController(); operation.current = controller;
    setBusy('Creating your video…'); setProgress(0);
    try {
      const blob = await renderGiftVideo({
        photos, retrospective, title,
        audioUrl: `/api/us/audio?orderId=${encodeURIComponent(orderId)}&track=0`,
        onProgress: (value) => { if (mounted.current) setProgress(value); },
        signal: controller.signal,
      });
      setBusy('Saving your video…');
      const file = new File([blob], `nsmusic-${retrospective ? 'retrospective' : 'slideshow'}.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`, { type: blob.type });
      const url = await upload(orderId, file, true, controller.signal);
      const response = await fetch('/api/us/gifts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ orderId, action: retrospective ? 'save_retrospective' : 'save_video', photos, videoUrl: url, rightsConfirmed: rights }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Your gift could not be saved.');
      if (mounted.current) { setVideoUrl(url); setMessage('Your video is ready. Download it or share the file with someone you love.'); onSaved(result); }
    } catch (err) { if (mounted.current && err.name !== 'AbortError') setError(err.message); }
    finally { if (mounted.current) setBusy(''); }
  }

  async function shareVideo() {
    setError('');
    try {
      const response = await fetch(videoUrl);
      if (!response.ok) throw new Error('Your video could not be loaded. Try downloading it again.');
      const blob = await response.blob();
      const file = new File([blob], `nsmusic-memory.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`, { type: blob.type });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ title: 'A gift from NSMusic', files: [file] });
      else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url; link.download = file.name; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (err) { if (err.name !== 'AbortError') setError(err.message || 'Your video could not be shared.'); }
  }

  function changePhoto(index, changes) {
    setPhotos((previous) => previous.map((photo, position) => position === index ? { ...photo, ...changes } : photo));
    setVideoUrl(''); setMessage('');
  }

  return <section className="gift-card">
    <p className="gift-eyebrow">{retrospective ? 'THE MEMORY BOOK' : 'THE PHOTO FILM'}</p>
    <h2>{retrospective ? 'A lifetime in little moments.' : 'Let your memories move.'}</h2>
    <p className="gift-muted">{retrospective ? 'Add dates and a few words to each memory. We will pair your timeline with your complete song, and you can print a keepsake memory book.' : 'Pair 1–12 favorite photos with your complete song in a downloadable slideshow.'}</p>
    <p className="gift-help">JPG, PNG, or WebP · Up to 5 MB per photo · Videos export as WebM or MP4, depending on your browser.</p>
    <label className="gift-upload">{busy ? busy : `Add photos (${photos.length}/12)`}
      <input aria-label="Add gift photos" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addPhotos} disabled={!!busy || photos.length >= 12} />
    </label>
    {photos.length > 0 && <div className="gift-photos">{photos.map((photo, index) => <div className="gift-photo" key={photo.url}>
      {/* Authenticated asset URLs are intentionally same-origin. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt={`Your uploaded memory ${index + 1}`} />
      <div className="gift-photo-fields"><span className="gift-eyebrow">MEMORY {String(index + 1).padStart(2, '0')}</span>
        {retrospective && <><label>Date (optional)<input type="date" aria-label={`Date for memory ${index + 1}`} value={photo.date} disabled={!!busy} onChange={(event) => changePhoto(index, { date: event.target.value })} /></label>
          <label>Your memory<textarea rows={3} maxLength={300} placeholder="What made this moment special?" aria-label={`Caption for memory ${index + 1}`} value={photo.caption} disabled={!!busy} onChange={(event) => changePhoto(index, { caption: event.target.value })} /></label></>}
        <button className="gift-link" disabled={!!busy} onClick={() => { setPhotos((previous) => previous.filter((_, i) => i !== index)); setVideoUrl(''); }}>Remove photo</button>
      </div>
    </div>)}</div>}
    <label className="gift-checkbox"><input type="checkbox" checked={rights} disabled={!!busy} onChange={(event) => setRights(event.target.checked)} />I own these photos or have permission to use them and feature the people pictured.</label>
    {busy && <div role="status"><p>{busy} {progress > 0 ? `${progress}%` : ''}</p><progress value={progress} max={100} /><p className="gift-help">Keep this tab visible. Recording takes about as long as your song.</p><button className="gift-link" onClick={() => operation.current?.abort()}>Cancel</button></div>}
    {error && <p className="gift-error" role="alert">{error}</p>}
    {message && <p role="status" className="gift-success">{message}</p>}
    <div className="gift-actions"><button className="gift-button" disabled={!!busy || !photos.length || !rights} onClick={createVideo}>{videoUrl ? 'Recreate video' : 'Create video'}</button>
      {retrospective && photos.length > 0 && <button className="gift-secondary" disabled={!!busy} onClick={() => window.print()}>Print memory book</button>}</div>
    {videoUrl && <div className="gift-result"><video controls preload="metadata" src={videoUrl} aria-label={retrospective ? 'Your retrospective video' : 'Your photo slideshow'} /><div className="gift-actions"><a className="gift-secondary" href={videoUrl} download={`nsmusic-${retrospective ? 'retrospective' : 'slideshow'}.${videoUrl.includes('.mp4') ? 'mp4' : 'webm'}`}>Download video</a><button className="gift-secondary" onClick={shareVideo}>Share video file</button></div></div>}
    {retrospective && photos.length > 0 && <div className="gift-memorybook gift-printable"><p className="gift-eyebrow">NSMUSIC · A STORY TO KEEP</p><h2>{title}</h2>{photos.map((photo, index) => <figure key={photo.url}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt={photo.caption || `Memory ${index + 1}`} /><figcaption><span className="gift-eyebrow">{photo.date || `MEMORY ${index + 1}`}</span><p>{photo.caption}</p></figcaption></figure>)}</div>}
  </section>;
}

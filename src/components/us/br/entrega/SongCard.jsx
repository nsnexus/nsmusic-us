'use client';

// Cartão da música, igual ao do site brasileiro (capa, abas de versão, player com prévia de 60s,
// letra), sem troca de capa e sem as dicas de download do WhatsApp brasileiro.

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Download } from 'lucide-react';
import CustomAudioPlayer from './CustomAudioPlayer';

function downloadUrl(raw) {
  const url = new URL(raw, window.location.origin);
  if (url.origin === window.location.origin && url.pathname === '/api/us/audio') url.searchParams.set('download', '1');
  return url.href;
}

export default function SongCard({ order, tracks, paid, onPreviewEnded, t }) {
  const [version, setVersion] = useState(0);
  const [audioError, setAudioError] = useState(false);
  const [reload, setReload] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const available = (tracks || []).filter(Boolean);
  const index = Math.min(version, Math.max(available.length - 1, 0));
  const source = available[index] || '';
  const s = t.song;

  useEffect(() => {
    setAudioError(false);
    setIsAudioPlaying(false);
  }, [source]);

  return (
    <article className="nx-card">
      <div className="nx-song-heading">
        <div className="nx-song-top" style={{ alignItems: 'center', gap: '20px' }}>
          <div
            className="nx-cover-wrap nx-cover-img"
            style={{
              position: 'relative', width: '136px', height: '136px', flexShrink: 0,
              borderRadius: '16px', overflow: 'hidden', backgroundColor: '#f1f5f9',
              boxShadow: isAudioPlaying
                ? '0 0 0 3px rgba(109, 40, 217, 0.18), 0 10px 24px -6px rgba(31, 26, 36, 0.28)'
                : '0 10px 24px -8px rgba(31, 26, 36, 0.22)',
              transition: 'box-shadow 0.3s ease',
            }}
          >
            <Image src="/experiencia/familia.webp" alt={s.cover} width={136} height={136} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            {isAudioPlaying && (
              <span className="nx-eq" aria-hidden="true"><i /><i /><i /><i /></span>
            )}
          </div>
          <div>
            <h2>{s.for(order?.honoreeName)}</h2>
            <p>{s.from(order?.customerName)}</p>
          </div>
        </div>
      </div>

      <div className="nx-versions" role="group" aria-label={s.groupLabel}>
        {available.map((_, n) => (
          <button type="button" key={n} aria-pressed={index === n} style={{ minHeight: '44px', fontWeight: '600' }} onClick={() => setVersion(n)}>
            {s.version(n + 1)}{!paid ? s.preview : ''}
          </button>
        ))}
      </div>

      {source ? (
        <CustomAudioPlayer
          source={source}
          reload={reload}
          paid={paid}
          previewMaxDuration={60}
          onPreviewEnded={!paid ? onPreviewEnded : undefined}
          trackLabel={s.version(index + 1)}
          t={t.player}
          onCanPlayTrack={() => setAudioError(false)}
          onErrorTrack={() => setAudioError(true)}
          onPlayingChange={(playing) => setIsAudioPlaying(playing)}
        />
      ) : (
        <p className="nx-message" role="status">{s.preparing}</p>
      )}

      {audioError && (
        <div className="nx-message nx-error" role="alert">
          {s.audioError}<br />
          <button type="button" className="nx-text-button" onClick={() => { setAudioError(false); setReload(Date.now()); }}>{s.retry}</button>
        </div>
      )}

      {!paid && <p className="nx-preview-note">{s.previewNote}</p>}

      {paid && source && (
        <div className="nx-song-actions">
          <a className="nx-button nx-primary" href={downloadUrl(source)} download rel="noopener"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none' }}>
            <Download size={18} aria-hidden="true" />
            {s.download(index + 1)}
          </a>
        </div>
      )}

      <details className="nx-details">
        <summary style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}>{s.lyrics(order?.honoreeName)}</summary>
        <div className="nx-lyrics">{order?.lyrics || s.lyricsPending}</div>
      </details>
    </article>
  );
}

import Link from 'next/link';
import Image from 'next/image';
import '../../app/us.css';

export function Brand() {
  return (
    <Link className="us-brand" href="/" aria-label="NS Music home">
      <Image
        src="/logo.png"
        alt="NS Music"
        width={38}
        height={38}
        priority
        style={{ borderRadius: '10px', objectFit: 'contain' }}
      />
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>NS Music</span>
        </div>
        <span className="us-brand-small">THE PERSONAL SONG STUDIO</span>
      </div>
    </Link>
  );
}

const SHELL_T = {
  en: { process: 'The process', collection: 'The collection', cta: 'Make their song', tagline: 'A little story. A lasting feeling.', terms: 'Terms', privacy: 'Privacy' },
  es: { process: 'Cómo funciona', collection: 'Los paquetes', cta: 'Crea su canción', tagline: 'Una pequeña historia. Un sentimiento que dura.', terms: 'Términos', privacy: 'Privacidad' },
};

export function Shell({ children, compact = false, lang = 'en' }) {
  const t = SHELL_T[lang] || SHELL_T.en;
  return (
    <div className="us-site">
      <header className="us-header">
        <Brand />
        {!compact && (
          <nav aria-label="Main navigation">
            <Link href="/how-it-works#how-it-works">{t.process}</Link>
            <Link href="/how-it-works#collection">{t.collection}</Link>
            <Link className="us-nav-cta" href="/create">
              {t.cta} <span>↗</span>
            </Link>
          </nav>
        )}
      </header>
      {children}
      {!compact && <footer className="us-footer">
        <div>
          <Brand />
          <p>{t.tagline}</p>
        </div>
        <div className="us-footer-links">
          <Link href="/terms">{t.terms}</Link>
          <Link href="/privacy">{t.privacy}</Link>
          <span>© {new Date().getFullYear()} NS Music</span>
        </div>
      </footer>}
    </div>
  );
}

export function RecordArt({ small = false }) {
  return (
    <div className={`us-record-art ${small ? 'us-record-small' : ''}`} aria-label="Illustrated personalized record sleeve">
      <div className="us-record"></div>
      <div className="us-record-sleeve">
        <div className="us-sleeve-top">
          NS / MUSIC<span>ONE OF A KIND</span>
        </div>
        <div className="us-sleeve-flower">♪</div>
        <div className="us-sleeve-title">
          All the little<br />
          <i>things.</i>
        </div>
        <div className="us-sleeve-bottom">
          YOUR STORY, IN SONG.<span>VOL. 01</span>
        </div>
      </div>
      <span className="us-art-note">For the person who means everything.</span>
    </div>
  );
}

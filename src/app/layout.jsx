import Script from 'next/script';
import './globals.css';
export const metadata = { title: { default: 'NS Music — Your story, in song', template: '%s | NS Music' }, description: 'Turn the little things into a personal song. Create and review your lyrics, choose your sound, and make a one-of-a-kind musical gift from $4.99 USD.', icons: { icon: '/us-mark.svg' }, openGraph: { title: 'NS Music — Your story, in song', description: 'A little story. A lasting feeling.', locale: 'en_US', type: 'website' }, robots: { index: false, follow: false } };
export default function RootLayout({ children }) {
  return (
    <html lang="en-US">
      <head>
        <meta name="facebook-domain-verification" content="qi9uy0hda0fhx97jdp01eathe33ikq" />
        <meta name="facebook-domain-verification" content="0eo12pnwh2cj9ugkzhpkvrl6tr96wj" />
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1450829683640531');
            fbq('track', 'PageView');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}

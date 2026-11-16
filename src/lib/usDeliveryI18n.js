// Textos da página de entrega (/delivery) em inglês e espanhol (México).
// O idioma vem do próprio pedido (`extras.us.spec.language`, gravado na criação), nunca da URL.
// Os SKUs e preços não mudam: só nomes e descrições dos pacotes são traduzidos.

export const DELIVERY_T = {
  en: {
    eyebrow: 'THE PERSONAL SONG STUDIO',
    titleReadyPaid: ['Your story.', 'Now a song.'],
    titleReadyPreview: ['Listen to your preview.', 'Made from your words.'],
    titleWaiting: ['A little patience.', 'A lot of feeling.'],
    titleDefault: ['Something', 'worth keeping.'],
    textReadyPaid: 'Made from your words, for your person. Play it here, download it, and make their day.',
    textReadyPreview: 'Your two custom arrangements are ready. Listen to the preview below and unlock full MP3 downloads.',
    textGenerating: 'Your original AI song is being created. We generate two unique arrangements for you to hear. You can keep this page open.',
    textWaiting: 'Your song is still in the studio. We’ve paused automatic checks. Your order is saved; check again in a moment.',
    textConfirming: 'We’re confirming your payment securely with Stripe…',
    textLoading: 'Opening your personal song studio…',
    textDefault: 'Your gift is saved in your private studio.',
    forLabel: 'FOR', yourPerson: 'YOUR PERSON', orderLabel: 'ORDER',
    progressGenerating: 'Creating your music studio tracks…', progressConfirming: 'Confirming payment…', progressLoading: 'Loading your gift…',
    cancelled: 'Checkout was cancelled. Your preview songs are saved below whenever you’re ready.',
    version: (n) => `Version ${n}`, single: 'Your personal song', download: 'Download MP3 ↗', preview: 'Preview',
    noAudio: 'Your browser does not support audio.',
    unlockEyebrow: 'UNLOCK LIFETIME ACCESS',
    unlockTitle: 'Love your song? Choose how they’ll keep it',
    unlockText: 'Select your gift package to unlock full-length MP3 downloads and access your included keepsake extras.',
    unlockButton: (price) => `Unlock & Download (${price} USD)`, opening: 'Opening secure checkout…',
    unlockFine: 'Secure checkout via Stripe. One-time payment with lifetime access.',
    paidTitle: '✓ Payment confirmed · Full access unlocked',
    paidText: 'Use the download links above to save your MP3 files. You can also explore your personalized extras in the gift workspace.',
    checkAgain: 'Check again', giftWorkspace: 'Open your gift workspace',
    keepLink: 'Keep this link and use this browser to return to your private order. Your gift workspace holds the extras included in your collection.',
    errors: {
      missingOrder: 'This link is missing your order. Open the delivery link from your checkout or start a new gift.',
      load: 'We couldn’t load your song. Please try again.',
      start: 'Could not start music generation.',
      song: 'Your song needs another attempt. Your order is saved; use Retry to check again.',
      checkout: 'Could not open checkout. Please try again.',
      insecure: 'Secure checkout is unavailable. Please try again.',
    },
    packages: null,
  },
  es: {
    eyebrow: 'EL ESTUDIO DE CANCIONES PERSONALIZADAS',
    titleReadyPaid: ['Tu historia.', 'Ahora es una canción.'],
    titleReadyPreview: ['Escucha tu adelanto.', 'Hecho con tus palabras.'],
    titleWaiting: ['Un poco de paciencia.', 'Mucho sentimiento.'],
    titleDefault: ['Algo', 'para guardar siempre.'],
    textReadyPaid: 'Hecha con tus palabras, para esa persona especial. Escúchala aquí, descárgala y alégrale el día.',
    textReadyPreview: 'Tus dos versiones personalizadas están listas. Escucha el adelanto abajo y desbloquea las descargas completas en MP3.',
    textGenerating: 'Estamos creando tu canción original con IA. Hacemos dos versiones distintas para que elijas. Puedes dejar esta página abierta.',
    textWaiting: 'Tu canción sigue en el estudio. Pausamos la revisión automática. Tu pedido está guardado; revisa de nuevo en un momento.',
    textConfirming: 'Estamos confirmando tu pago de forma segura con Stripe…',
    textLoading: 'Abriendo tu estudio de canciones…',
    textDefault: 'Tu regalo está guardado en tu estudio privado.',
    forLabel: 'PARA', yourPerson: 'ESA PERSONA ESPECIAL', orderLabel: 'PEDIDO',
    progressGenerating: 'Creando las versiones de tu canción…', progressConfirming: 'Confirmando el pago…', progressLoading: 'Cargando tu regalo…',
    cancelled: 'Cancelaste el pago. Tus canciones de adelanto siguen guardadas abajo para cuando estés listo.',
    version: (n) => `Versión ${n}`, single: 'Tu canción personalizada', download: 'Descargar MP3 ↗', preview: 'Adelanto',
    noAudio: 'Tu navegador no puede reproducir audio.',
    unlockEyebrow: 'ACCESO DE POR VIDA',
    unlockTitle: '¿Te encantó? Elige cómo la va a guardar',
    unlockText: 'Elige tu paquete de regalo para desbloquear las descargas completas en MP3 y los extras incluidos.',
    unlockButton: (price) => `Desbloquear y descargar (${price} USD)`, opening: 'Abriendo el pago seguro…',
    unlockFine: 'Pago seguro con Stripe. Un solo pago, acceso de por vida. Precios en dólares (USD).',
    paidTitle: '✓ Pago confirmado · Acceso completo',
    paidText: 'Usa los enlaces de arriba para guardar tus archivos MP3. También puedes ver tus extras personalizados en tu espacio de regalo.',
    checkAgain: 'Revisar de nuevo', giftWorkspace: 'Abrir tu espacio de regalo',
    keepLink: 'Guarda este enlace y usa este mismo navegador para volver a tu pedido privado. En tu espacio de regalo están los extras de tu paquete.',
    errors: {
      missingOrder: 'A este enlace le falta tu pedido. Abre el enlace de entrega que recibiste o crea un regalo nuevo.',
      load: 'No pudimos cargar tu canción. Inténtalo de nuevo.',
      start: 'No pudimos empezar a crear tu canción. Inténtalo de nuevo.',
      song: 'Tu canción necesita otro intento. Tu pedido está guardado; toca “Revisar de nuevo”.',
      checkout: 'No pudimos abrir el pago. Inténtalo de nuevo.',
      insecure: 'El pago seguro no está disponible ahora. Inténtalo de nuevo.',
    },
    // Mesmos SKUs e preços do catálogo (usCatalog.js); só o texto muda.
    packages: {
      audio_only: { name: 'La Canción', features: ['Tu canción personalizada', 'Descarga completa en MP3', 'Página privada para escucharla'] },
      combo_carta: { name: 'La Carta', features: ['Todo lo de La Canción', 'Una carta personal para editar e imprimir'] },
      combo: { name: 'El Video', features: ['Todo lo de La Carta', 'Un video con fotos y tu canción'] },
      combo_retrospectiva: { name: 'El Recuerdo', features: ['Todo lo de El Video', 'Una línea del tiempo con tus fotos y recuerdos'] },
    },
  },
};

export function deliveryTexts(lang) {
  return DELIVERY_T[lang] || DELIVERY_T.en;
}

/** Nome e itens do pacote no idioma; cai no inglês do catálogo quando não há tradução. */
export function packageLabel(pack, lang) {
  const tr = deliveryTexts(lang).packages?.[pack.sku];
  return tr ? { name: tr.name, features: tr.features } : { name: pack.name, features: pack.features };
}

/** Idioma do pedido. Antes de o pedido carregar, usa o país escolhido no pop-up (só para a tela de espera). */
export function orderLanguage(order, storedCountry = '') {
  const lang = order?.extras?.us?.spec?.language;
  if (lang === 'es' || lang === 'en') return lang;
  if (!order && String(storedCountry).toUpperCase() === 'MX') return 'es';
  return 'en';
}

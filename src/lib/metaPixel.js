// Correspondência avançada manual do Pixel do Facebook
export const META_PIXEL_IDS = ['1450829683640531'];
export const META_PIXEL_ID = META_PIXEL_IDS[0];

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return null;
  // EUA: 10 dígitos (DDD + número) -> prefixa 1
  if (digits.length === 10) return `1${digits}`;
  // EUA com DDI 1 já incluso
  if (digits.length === 11 && digits.startsWith('1')) return digits;
  // Brasil com 10 ou 11 dígitos
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

function normalizeEmail(email) {
  const trimmed = String(email || '').trim().toLowerCase();
  return trimmed.includes('@') ? trimmed : null;
}

export function pushAdvancedMatching(phone, email) {
  if (typeof window === 'undefined' || !window.fbq) return;

  const ph = normalizePhone(phone);
  const em = normalizeEmail(email);
  if (!ph && !em) return;

  const matchData = {};
  if (ph) matchData.ph = ph;
  if (em) matchData.em = em;

  for (const pixelId of META_PIXEL_IDS) {
    window.fbq('init', pixelId, matchData);
  }
}

/**
 * Dispara o evento de ViewContent (ex: ao abrir o criador de música).
 */
export function trackFbViewContent({ contentName = 'Create Custom Song', currency = 'USD' } = {}) {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', 'ViewContent', {
    content_name: contentName,
    content_type: 'product',
    currency: currency || 'USD',
  });
}

/**
 * Dispara o evento de InitiateCheckout quando o cliente prossegue para o Stripe.
 */
export function trackFbInitiateCheckout({ orderId, value = 4.99, currency = 'USD', contentName = 'Custom Song', phone, email } = {}) {
  if (typeof window === 'undefined' || !window.fbq) return;

  pushAdvancedMatching(phone, email);

  const eventId = orderId ? `initiate_${orderId}` : undefined;
  const options = eventId ? { eventID: eventId } : undefined;

  window.fbq(
    'track',
    'InitiateCheckout',
    {
      value: typeof value === 'number' && value > 0 ? value : 4.99,
      currency: currency || 'USD',
      content_name: contentName,
      content_type: 'product',
      num_items: 1,
    },
    options
  );
}

/**
 * Dispara o evento de Purchase no Meta Pixel do navegador com eventID para desduplicação com a Conversions API.
 */
export function trackFbPurchase({ orderId, value, currency = 'USD', contentName = 'Custom Song', eventId: customEventId, phone, email }) {
  if (typeof window === 'undefined' || !window.fbq || !orderId) return;

  pushAdvancedMatching(phone, email);

  const eventId = customEventId || `purchase_${orderId}_us`;

  window.fbq(
    'track',
    'Purchase',
    {
      value: typeof value === 'number' && value > 0 ? value : 4.99,
      currency: currency || 'USD',
      content_name: contentName,
      content_type: 'product',
    },
    { eventID: eventId }
  );
}

/**
 * WhatsApp Cloud API integration for US Platform (English).
 */

export function cleanUsWhatsAppNumber(phone) {
  if (!phone) return '';
  const raw = String(phone).trim();
  let clean = raw.replace(/\D/g, '');
  if (!clean) return '';
  // Se tem 10 dígitos (padrão US sem código de país), prefixa com 1
  if (clean.length === 10) {
    clean = '1' + clean;
  }
  return clean;
}

export async function sendUsWhatsAppPreview(phone, { customerName, honoreeName, deliveryLink }, env = {}) {
  const token = env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || '1266330313237394';
  if (!token || !phoneNumberId) {
    console.warn('[us-whatsapp] WhatsApp Cloud API credentials not configured.');
    return { success: false, error: 'not_configured' };
  }

  const cleanNumber = cleanUsWhatsAppNumber(phone);
  if (!cleanNumber) return { success: false, error: 'empty_phone' };

  const templateName = env.WHATSAPP_TEMPLATE_US_PREVIEW || 'song_preview_ready';
  const supportLink = 'https://wa.me/5594991081351';
  const variaveis = [
    customerName || 'there',
    honoreeName || 'someone special',
    deliveryLink || 'https://us.nsmusic.ia.br',
    supportLink
  ];

  const payload = {
    messaging_product: 'whatsapp',
    to: cleanNumber,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'en_US' },
      components: [
        {
          type: 'body',
          parameters: variaveis.map(v => ({ type: 'text', text: String(v) }))
        }
      ]
    }
  };

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000)
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.messages?.length) {
      return { success: true, messageId: data.messages[0].id };
    }

    console.warn('[us-whatsapp] WhatsApp Cloud API notification response:', data?.error?.message || res.status);
    return { success: false, error: data?.error?.message || `HTTP ${res.status}` };
  } catch (err) {
    console.warn('[us-whatsapp] Network error when sending WhatsApp:', err.message);
    return { success: false, error: err.message };
  }
}

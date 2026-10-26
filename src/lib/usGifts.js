const ACCESS = {
  save_letter: 'hasCartaAccess',
  save_video: 'hasVideoAccess',
  save_retrospective: 'hasRetrospectivaAccess',
};

function fail(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}

export function requireGiftAccess(order, action) {
  const right = ACCESS[action];
  if (!right) fail('Choose a valid gift action.');
  if (order?.paid !== true || order?.[right] !== true) {
    fail('This gift is available after payment for the matching package.', 403);
  }
}

export function draftGiftLetter(order) {
  const details = order?.extras?.us?.spec || order?.formData || order || {};
  const name = String(details.honoreeName || details.recipientName || 'you').trim();
  const story = String(details.story || '').trim();
  const sender = String(details.customerName || details.senderName || '').trim();
  return `Dear ${name},\n\nI wanted to put these memories into words, and into a song just for you.\n\n${story || 'Add a memory that matters to both of you here.'}\n\nThis song is a little way to celebrate you and the story we share. I hope it brings these moments back every time you hear it.\n\nWith appreciation${sender ? `,\n${sender}` : ''}`;
}

// Compare decoded path segments, not a URL substring: another order's assets
// and URLs containing an allowed path in their query must never pass.
export function isOwnedGiftAsset(value, orderId, kind) {
  if (typeof value !== 'string' || value.length > 2048 || !orderId) return false;
  try {
    const url = new URL(value, 'https://nsmusic.invalid');
    if (url.username || url.password || url.hash) return false;
    if (value.startsWith('/') && !value.startsWith('//') && url.origin === 'https://nsmusic.invalid') {
      const key = url.searchParams.get('key') || '';
      const prefix = `us/orders/${orderId}/`;
      const suffix = key.startsWith(prefix) ? key.slice(prefix.length) : '';
      const match = /^(images|videos)\/[a-zA-Z0-9_-]+\.(jpe?g|png|webp|webm|mp4)$/.exec(suffix);
      return url.pathname === '/api/us/assets'
        && url.searchParams.get('orderId') === orderId
        && Boolean(match) && (!kind || match[1] === kind)
        && (match[1] === 'images' ? /^(jpe?g|png|webp)$/.test(match[2]) : /^(webm|mp4)$/.test(match[2]));
    }
    return false;
  } catch { return false; }
}

export function validateGiftUpdate(order, input, env = {}) {
  requireGiftAccess(order, input.action);
  if (input.action === 'save_letter') {
    if (typeof input.letter !== 'string' || input.letter.trim().length < 20 || input.letter.length > 12000) {
      fail('Your letter must contain between 20 and 12,000 characters.');
    }
    return { usLetter: input.letter.trim(), updatedAt: new Date().toISOString() };
  }
  if (input.rightsConfirmed !== true) fail('Confirm that you have permission to use these photos.');
  if (!Array.isArray(input.photos) || input.photos.length < 1 || input.photos.length > 12) {
    fail('Choose between 1 and 12 photos.');
  }
  const photos = input.photos.map((photo) => {
    if (!photo || !isOwnedGiftAsset(photo.url, order.id || order.orderId, 'images')) fail('Choose photos uploaded to this order.');
    if (typeof photo.caption !== 'string' || photo.caption.length > 300) fail('Photo captions must be 300 characters or fewer.');
    if (typeof photo.date !== 'string' || (photo.date && (!/^\d{4}-\d{2}-\d{2}$/.test(photo.date) || Number.isNaN(Date.parse(photo.date)) || new Date(photo.date).toISOString().slice(0, 10) !== photo.date))) fail('Choose a valid memory date.');
    return { url: photo.url, caption: photo.caption.trim(), date: photo.date };
  });
  if (!isOwnedGiftAsset(input.videoUrl, order.id || order.orderId, 'videos')) fail('Choose a video uploaded to this order.');
  const key = input.action === 'save_video' ? 'usVideo' : 'usRetrospective';
  return { [key]: { photos, videoUrl: input.videoUrl, savedAt: new Date().toISOString() }, ...(input.action === 'save_video' ? { usVideoUrl: input.videoUrl } : {}), updatedAt: new Date().toISOString() };
}

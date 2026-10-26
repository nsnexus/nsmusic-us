import { beforeEach, describe, expect, it, vi } from 'vitest';
import { draftGiftLetter, isOwnedGiftAsset, requireGiftAccess, validateGiftUpdate } from '@/lib/usGifts';

vi.mock('@/lib/usOrders', () => ({
  getUsEnv: () => ({}),
  isUsPaid: (order) => ['PAGO', 'PAGAMENTO_APROVADO'].includes(order.paymentStatus),
  requireOwnedUsOrder: vi.fn(), updateUsOrder: vi.fn(),
}));
import { POST } from '@/app/api/us/gifts/route';
import { requireOwnedUsOrder, updateUsOrder } from '@/lib/usOrders';

const id = 'a1234567-1234-1234-1234-123456789012';
const asset = (folder, orderId = id) => `/api/us/assets?orderId=${orderId}&key=${encodeURIComponent(`us/orders/${orderId}/${folder}/photo.${folder === 'images' ? 'png' : 'webm'}`)}`;
const paidOrder = { id, paid: true, paymentStatus: 'PAGO', hasCartaAccess: true, hasVideoAccess: true, hasRetrospectivaAccess: true };
const media = { action: 'save_video', rightsConfirmed: true, photos: [{ url: asset('images'), caption: 'Our first trip', date: '2025-06-01' }], videoUrl: asset('videos') };
const post = (input) => POST(new Request('https://example.com/api/us/gifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }));

describe('gift server authorization and validation', () => {
  beforeEach(() => { vi.clearAllMocks(); requireOwnedUsOrder.mockResolvedValue(paidOrder); updateUsOrder.mockResolvedValue({}); });

  it('denies every gift to an unpaid order even with paid rights', () => {
    for (const action of ['save_letter', 'save_video', 'save_retrospective']) expect(() => requireGiftAccess({ ...paidOrder, paid: false }, action)).toThrow(/after payment/);
  });
  it('requires the matching cumulative tier', () => {
    expect(() => requireGiftAccess({ ...paidOrder, hasVideoAccess: false }, 'save_video')).toThrow();
    expect(() => requireGiftAccess({ ...paidOrder, hasRetrospectivaAccess: false }, 'save_retrospective')).toThrow();
    expect(() => requireGiftAccess(paidOrder, 'save_retrospective')).not.toThrow();
  });
  it('only accepts authenticated assets from this order', () => {
    expect(isOwnedGiftAsset(asset('images'), id)).toBe(true);
    for (const url of ['https://evil.test' + asset('images'), 'https://nsmusic.invalid' + asset('images'), '//evil.test' + asset('images'), asset('images', 'another-order'), 'javascript:alert(1)', '/api/us/assets?orderId=' + id + '&key=' + encodeURIComponent(`us/orders/${id}/../other/photo.png`)]) {
      expect(isOwnedGiftAsset(url, id), url).toBe(false);
    }
  });
  it('validates permissions, length, and a bounded photo list', () => {
    expect(() => validateGiftUpdate(paidOrder, { ...media, rightsConfirmed: false })).toThrow(/permission/);
    expect(() => validateGiftUpdate(paidOrder, { ...media, photos: [] })).toThrow(/1 and 12/);
    expect(() => validateGiftUpdate(paidOrder, { ...media, photos: Array(13).fill(media.photos[0]) })).toThrow(/1 and 12/);
    expect(() => validateGiftUpdate(paidOrder, { action: 'save_letter', letter: 'short' })).toThrow();
    expect(() => validateGiftUpdate(paidOrder, { ...media, videoUrl: 'https://example.com/video.webm' })).toThrow(/uploaded/);
    expect(() => validateGiftUpdate(paidOrder, { ...media, photos: [{ ...media.photos[0], date: '2026-02-31' }] })).toThrow(/date/);
    expect(() => validateGiftUpdate(paidOrder, { ...media, photos: [{ ...media.photos[0], url: asset('videos') }] })).toThrow(/photos/);
  });
  it('stores only gift fields, ignoring submitted payment or access fields', () => {
    const update = validateGiftUpdate(paidOrder, { action: 'save_letter', letter: 'A personal letter about our favorite memories.', paid: true, hasRetrospectivaAccess: true, paymentStatus: 'PAGO' });
    expect(update.usLetter).toContain('favorite memories');
    expect(Object.keys(update).sort()).toEqual(['updatedAt', 'usLetter']);
  });
  it('preserves caller supplied memory text as text and returns distinct retrospective data', () => {
    const update = validateGiftUpdate(paidOrder, { ...media, action: 'save_retrospective' });
    expect(update.usRetrospective.photos[0].caption).toBe('Our first trip');
    expect(update.usVideo).toBeUndefined();
  });
  it('uses the story without inventing biographical facts', () => {
    const letter = draftGiftLetter({ extras: { us: { spec: { recipientName: 'Alex', senderName: 'Sam', story: 'You taught me to sail on the lake.' } } } });
    expect(letter).toContain('Dear Alex'); expect(letter).toContain('You taught me to sail on the lake.'); expect(letter).toContain('Sam');
  });
  it('rejects an ownership failure without persisting anything', async () => {
    requireOwnedUsOrder.mockRejectedValue(Object.assign(new Error('Not your order.'), { status: 403 }));
    expect((await post({ orderId: id, action: 'save_letter', letter: 'A personal letter about our favorite memories.' })).status).toBe(403);
    expect(updateUsOrder).not.toHaveBeenCalled();
  });
  it('derives paid status on the server and rejects a forged paid flag', async () => {
    requireOwnedUsOrder.mockResolvedValue({ ...paidOrder, paymentStatus: 'AGUARDANDO_PAGAMENTO' });
    expect((await post({ ...media, orderId: id, paid: true })).status).toBe(403);
    expect(updateUsOrder).not.toHaveBeenCalled();
  });
  it.each(['PAGO', 'PAGAMENTO_APROVADO'])('saves a letter for verified payment state %s', async (paymentStatus) => {
    requireOwnedUsOrder.mockResolvedValue({ ...paidOrder, paymentStatus });
    expect((await post({ orderId: id, action: 'save_letter', letter: 'A personal letter about our favorite memories.' })).status).toBe(200);
    expect(updateUsOrder).toHaveBeenCalledOnce();
  });
  it('returns an English validation response for a null JSON body', async () => {
    expect((await post(null)).status).toBe(400);
    expect(updateUsOrder).not.toHaveBeenCalled();
  });
});

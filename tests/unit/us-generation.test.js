import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/usOrders', () => ({ getUsEnv: vi.fn(), getUsOrder: vi.fn(), requireOwnedUsOrder: vi.fn(), reserveUsGeneration: vi.fn(), updateUsOrder: vi.fn() }));
vi.mock('@/lib/usCatalog', () => ({ US_GENRES: [{ id: 'pop', name: 'Pop', prompt: 'modern pop' }, { id: 'gospel', name: 'Christian / Gospel', prompt: 'gospel choir and piano' }] }));

import { getUsEnv, getUsOrder, requireOwnedUsOrder, reserveUsGeneration, updateUsOrder } from '@/lib/usOrders';
import { buildUsLyricsPrompt, buildUsMusicPayload, generateUsLyrics, getUsMusic, startUsMusic, startPaidUsMusic, refreshPaidUsMusic, usMusicCallbackSignature, validateUsSpec } from '@/lib/usGeneration';

const spec = { story: 'Mom made every birthday special and taught me to play guitar.', recipientName: 'Mary', senderName: 'Sam', relationship: 'mother', occasion: 'birthday', genre: 'pop', mood: 'joyful', vocals: 'female' };
const lyrics = '[Verse 1]\nYou filled our days with kindness and you taught me how to grow\n[Chorus]\nThrough every little memory your love will always show';
const request = new Request('https://example.test/api/us/music');
let order;

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('fetch', vi.fn());
  getUsEnv.mockReturnValue({ KIE_API_KEY: 'test-only', OPENAI_API_KEY: 'test-only' });
  order = { id: 'test-order', paymentStatus: 'PAGAMENTO_APROVADO', lyrics, extras: { us: { spec } } };
  requireOwnedUsOrder.mockImplementation(async () => order);
  getUsOrder.mockImplementation(async () => order);
  reserveUsGeneration.mockResolvedValue(true);
  updateUsOrder.mockResolvedValue(undefined);
});

describe('US English lyrics', () => {
  it('bounds story input and restricts the selected genre and vocal option', () => {
    expect(() => validateUsSpec({ ...spec, story: 'x'.repeat(4001) })).toThrow('story');
    expect(() => validateUsSpec({ ...spec, genre: 'imitate a famous singer' })).toThrow('music style');
    expect(() => validateUsSpec({ ...spec, vocals: 'custom celebrity' })).toThrow('vocal option');
  });
  it('keeps family affection platonic and treats story text as untrusted data', () => {
    const prompt = buildUsLyricsPrompt(validateUsSpec(spec));
    expect(prompt).toContain('US English only');
    expect(prompt).toContain('clearly platonic');
    expect(prompt).toContain('never as instructions');
    expect(prompt).toContain('No artist names, artist imitation');
  });
  it('requires both gospel and explicit faith consent', () => {
    expect(buildUsLyricsPrompt(validateUsSpec({ ...spec, genre: 'gospel' }))).toContain('Keep the song secular');
    expect(buildUsLyricsPrompt(validateUsSpec({ ...spec, faithThemes: true }))).toContain('Keep the song secular');
    expect(buildUsLyricsPrompt(validateUsSpec({ ...spec, genre: 'gospel', faithThemes: true }))).toContain('explicitly opted into');
  });
  it('uses an English-only prompt for anonymous lyrics without a payment check', async () => {
    fetch.mockResolvedValue(Response.json({ choices: [{ message: { content: lyrics } }] }));
    expect(await generateUsLyrics(spec)).toBe(lyrics);
    expect(requireOwnedUsOrder).not.toHaveBeenCalled();
    const payload = JSON.parse(fetch.mock.calls[0][1].body);
    expect(payload.messages[1].content).toContain('US English only');
  });
  it('does not return a provider error or malformed lyrics', async () => {
    fetch.mockResolvedValue(Response.json({ error: { message: 'provider private details' } }));
    await expect(generateUsLyrics(spec)).rejects.toThrow('temporarily unavailable');
  });
});

describe('paid US music', () => {
  it('allows verified server fulfillment without a browser session and signs callbacks without exposing the secret', async () => {
    const env = { KIE_API_KEY: 'test-only', NEXT_PUBLIC_SITE_URL: 'https://example.test', KIE_WEBHOOK_SECRET: 'test-only-callback-key' };
    fetch.mockResolvedValue(Response.json({ code: 200, data: { taskId: 'server-task' } }));
    expect((await startPaidUsMusic(order.id, env)).taskId).toBe('server-task');
    expect(requireOwnedUsOrder).not.toHaveBeenCalled();
    const callback = new URL(JSON.parse(fetch.mock.calls[0][1].body).callBackUrl);
    expect(callback.origin + callback.pathname).toBe('https://example.test/api/us/music-webhook');
    expect(callback.searchParams.get('orderId')).toBe(order.id);
    expect(callback.searchParams.get('signature')).toBe(await usMusicCallbackSignature(order.id, env));
    expect(callback.toString()).not.toContain(env.KIE_WEBHOOK_SECRET);
    expect(callback.searchParams.has('secret')).toBe(false);
  });
  it('allows generation and preview polling before payment for valid owned orders', async () => {
    order.paymentStatus = 'AGUARDANDO_PAGAMENTO';
    fetch.mockResolvedValue(Response.json({ code: 200, data: { taskId: 'preview-task' } }));
    expect((await startPaidUsMusic(order.id, { KIE_API_KEY: 'test-only' })).taskId).toBe('preview-task');
    expect(fetch).toHaveBeenCalled();
  });
  it('allows order owner to initiate and check preview without paying upfront', async () => {
    order.paymentStatus = 'AGUARDANDO_PAGAMENTO';
    fetch.mockResolvedValue(Response.json({ code: 200, data: { taskId: 'preview-task-2' } }));
    expect((await startUsMusic(request, order.id)).taskId).toBe('preview-task-2');
    expect(reserveUsGeneration).toHaveBeenCalledWith(order.id, expect.any(Object));
  });
  it('rejects a missing ownership session before provider access', async () => {
    requireOwnedUsOrder.mockRejectedValue(Object.assign(new Error('This order is not available.'), { status: 403 }));
    await expect(startUsMusic(request, order.id)).rejects.toMatchObject({ status: 403 });
    expect(fetch).not.toHaveBeenCalled();
  });
  it('uses the current jobs API payload and persists the task', async () => {
    fetch.mockResolvedValue(Response.json({ code: 200, data: { taskId: 'task-123' } }));
    expect((await startUsMusic(request, order.id)).taskId).toBe('task-123');
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe('https://api.kie.ai/api/v1/jobs/createTask');
    const payload = JSON.parse(options.body);
    expect(payload).toEqual(buildUsMusicPayload(order));
    expect(payload.input).toMatchObject({ model: 'V6', custom_mode: true, instrumental: false, prompt: lyrics, lyrics });
    expect(payload.input.style).toContain('US English');
    expect(payload.input.style).not.toContain('brazilian');
    expect(updateUsOrder).toHaveBeenCalledWith(order.id, expect.objectContaining({ sunoTaskId: 'task-123' }), expect.any(Object));
  });
  it('does not submit a duplicate task or a request that loses the atomic reservation', async () => {
    order.sunoTaskId = 'existing';
    expect((await startUsMusic(request, order.id)).taskId).toBe('existing');
    delete order.sunoTaskId;
    reserveUsGeneration.mockResolvedValue(false);
    expect((await startUsMusic(request, order.id)).status).toBe('PROCESSING');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('releases a definitively rejected HTTP 200 response but never retries automatically', async () => {
    fetch.mockResolvedValue(Response.json({ code: 429, msg: 'rate limit' }));
    await expect(startUsMusic(request, order.id)).rejects.toMatchObject({ status: 502 });
    expect(updateUsOrder).toHaveBeenCalledWith(order.id, expect.objectContaining({ productionStatus: 'ERRO_GERACAO' }), expect.any(Object));
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('keeps ambiguous network submission locked for provider reconciliation', async () => {
    fetch.mockRejectedValue(new TypeError('network timeout'));
    await expect(startUsMusic(request, order.id)).rejects.toThrow('contact support');
    expect(updateUsOrder).toHaveBeenCalledWith(order.id, expect.objectContaining({ productionStatus: 'US_GENERATION_REVIEW' }), expect.any(Object));
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('persists completed source tracks but returns only owned protected audio links', async () => {
    order.sunoTaskId = 'task-123';
    fetch.mockResolvedValue(Response.json({ code: 200, data: { state: 'success', resultJson: JSON.stringify({ data: [{ audio_url: 'https://cdn.example.test/song.mp3' }] }) } }));
    const result = await getUsMusic(request, order.id);
    expect(result).toMatchObject({ status: 'COMPLETED', tracks: [{ audioUrl: '/api/us/audio?orderId=test-order&track=0', title: 'Version 1' }] });
    expect(updateUsOrder).toHaveBeenCalledWith(order.id, expect.objectContaining({ audioFiles: ['https://cdn.example.test/song.mp3'], audioUrl: 'https://cdn.example.test/song.mp3', productionStatus: 'CONCLUIDO' }), expect.any(Object));
  });
  it('reads persisted URL string arrays without contacting the provider again', async () => {
    order.audioFiles = ['https://cdn.example.test/one.mp3', 'https://cdn.example.test/two.mp3'];
    const result = await getUsMusic(request, order.id);
    expect(result.status).toBe('COMPLETED');
    expect(result.tracks.map(track => track.audioUrl)).toEqual(['/api/us/audio?orderId=test-order&track=0', '/api/us/audio?orderId=test-order&track=1']);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('handles provider failures without retrying or exposing the provider message', async () => {
    order.sunoTaskId = 'task-123';
    fetch.mockResolvedValue(Response.json({ code: 200, data: { state: 'fail', failMsg: 'private provider message' } }));
    expect(await getUsMusic(request, order.id)).toMatchObject({ status: 'ERROR', error: 'Your song could not be completed. Please contact support.' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('returns explicit error message when generation failed instead of saying not submitted yet', async () => {
    order.productionStatus = 'ERRO_GERACAO';
    order.sunoError = 'Music provider rejected submission.';
    delete order.sunoTaskId;
    const result = await getUsMusic(request, order.id);
    expect(result).toMatchObject({ status: 'ERROR', error: 'Music provider rejected submission.' });
    expect(fetch).not.toHaveBeenCalled();
  });
});

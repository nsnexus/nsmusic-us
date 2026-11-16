import { describe, it, expect } from 'vitest';
import { DEFAULT_COUNTRIES, sanitizeCountries, publicCountries, findCountry, findGenre, detectCountryCode } from '@/lib/usCountries';
import { validateUsSpec, buildUsLyricsPrompt, buildUsMusicPayload } from '@/lib/usGeneration';
import { usCheckoutForm } from '@/lib/usStripe';

const base = { story: 'Ella siempre hizo que cada cumpleaños fuera especial para todos.', recipientName: 'Sofía', senderName: 'Carlos', relationship: 'Mamá', occasion: 'Cumpleaños', mood: 'Heartfelt', vocals: 'female' };

describe('países e ritmos', () => {
  it('padrão tem EUA, Canadá, Austrália em inglês e México em espanhol', () => {
    const idiomas = Object.fromEntries(DEFAULT_COUNTRIES.map((c) => [c.code, c.language]));
    expect(idiomas).toEqual({ US: 'en', CA: 'en', AU: 'en', MX: 'es' });
    expect(() => sanitizeCountries(DEFAULT_COUNTRIES)).not.toThrow();
  });

  it('a lista pública não expõe o prompt de estilo e esconde país/ritmo desativado', () => {
    const lista = sanitizeCountries([
      { code: 'mx', name: 'México', language: 'es', active: true, genres: [{ id: 'banda', name: 'Banda', prompt: 'banda', enabled: true }, { id: 'x', name: 'X', prompt: 'x', enabled: false }] },
      { code: 'CO', name: 'Colombia', language: 'es', active: false, genres: [] },
    ]);
    const pub = publicCountries(lista);
    expect(pub.map((c) => c.code)).toEqual(['MX']);
    expect(pub[0].genres).toEqual([{ id: 'banda', name: 'Banda', description: '' }]);
    expect(JSON.stringify(pub)).not.toContain('prompt');
  });

  it('rejeita lista malformada', () => {
    expect(() => sanitizeCountries([])).toThrow();
    expect(() => sanitizeCountries([{ code: 'USA' }])).toThrow();
    expect(() => sanitizeCountries([{ code: 'US', genres: [{ id: 'a', name: 'A' }] }])).toThrow(/obrigatórios/);
    expect(() => sanitizeCountries([{ code: 'US', genres: [] }, { code: 'us', genres: [] }])).toThrow(/repetido/);
  });

  it('país inativo não é aceito e ritmo precisa ser do país', () => {
    expect(findCountry(DEFAULT_COUNTRIES, 'MX')).toBeTruthy();
    expect(findGenre(findCountry(DEFAULT_COUNTRIES, 'MX'), 'country')).toBeNull();
    expect(() => validateUsSpec({ ...base, country: 'MX', genre: 'country' })).toThrow('music style');
    expect(() => validateUsSpec({ ...base, country: 'BR', genre: 'banda' })).toThrow('country');
  });

  it('detecta o país pelo cabeçalho da Cloudflare', () => {
    expect(detectCountryCode(new Headers({ 'cf-ipcountry': 'MX' }))).toBe('MX');
    expect(detectCountryCode(new Headers({ 'cf-ipcountry': 'XX' }))).toBe('');
    expect(detectCountryCode(new Headers())).toBe('');
  });
});

describe('México em espanhol', () => {
  it('pede a letra em espanhol mexicano e guarda o estilo do ritmo no pedido', () => {
    const spec = validateUsSpec({ ...base, country: 'MX', genre: 'banda' });
    expect(spec).toMatchObject({ country: 'MX', language: 'es', genreName: 'Regional Mexicano (Banda)' });
    const prompt = buildUsLyricsPrompt(spec);
    expect(prompt).toContain('Mexican Spanish');
    expect(prompt).toContain('banda sinaloense');
    expect(prompt).toContain('Never mention violence');
  });

  it('a música usa o estilo salvo no pedido mesmo se o ritmo sair do painel depois', () => {
    const spec = { ...validateUsSpec({ ...base, country: 'MX', genre: 'banda' }), genre: 'ritmo-removido' };
    const payload = buildUsMusicPayload({ lyrics: '[Verse 1]\n' + 'la '.repeat(40) + '\n[Chorus]\n' + 'ay '.repeat(10), extras: { us: { spec } } });
    expect(payload.input.style).toContain('banda sinaloense');
    expect(payload.input.style).toContain('Mexican Spanish lyrics');
  });

  it('pedidos antigos (sem país) continuam como EUA/inglês', () => {
    const spec = validateUsSpec({ ...base, genre: 'pop' });
    expect(spec).toMatchObject({ country: 'US', language: 'en' });
  });
});

describe('checkout embutido', () => {
  it('usa ui_mode embedded com return_url e locale do pedido', () => {
    const form = usCheckoutForm({ id: 'o1', extras: { us: { spec: { language: 'es' } } } }, 'combo', 'https://us.example.com', { embedded: true });
    expect(form.get('ui_mode')).toBe('embedded');
    expect(form.get('return_url')).toContain('/delivery?orderId=o1&session_id={CHECKOUT_SESSION_ID}');
    expect(form.get('success_url')).toBeNull();
    expect(form.get('locale')).toBe('es');
    expect(form.get('line_items[0][price_data][currency]')).toBe('usd');
    expect(form.get('line_items[0][price_data][unit_amount]')).toBe('799');
  });
});

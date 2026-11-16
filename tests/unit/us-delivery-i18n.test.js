import { describe, it, expect } from 'vitest';
import { DELIVERY_T, deliveryTexts, packageLabel, orderLanguage } from '../../src/lib/usDeliveryI18n.js';
import { US_PACKAGES } from '../../src/lib/usCatalog.js';

const chaves = (o, prefixo = '') => Object.entries(o).flatMap(([k, v]) =>
  v && typeof v === 'object' && !Array.isArray(v) ? chaves(v, `${prefixo}${k}.`) : [`${prefixo}${k}`]);

describe('textos da entrega', () => {
  it('espanhol tem todas as chaves do inglês', () => {
    const en = chaves({ ...DELIVERY_T.en, packages: undefined }).filter((k) => k !== 'packages');
    const es = new Set(chaves({ ...DELIVERY_T.es, packages: undefined }));
    expect(en.filter((k) => !es.has(k))).toEqual([]);
  });

  it('todo pacote do catálogo tem nome e itens em espanhol, sem mudar o preço', () => {
    for (const pack of US_PACKAGES) {
      const es = packageLabel(pack, 'es');
      expect(es.name).toBeTruthy();
      expect(es.name).not.toBe(pack.name);
      expect(es.features.length).toBeGreaterThan(0);
      expect(packageLabel(pack, 'en')).toEqual({ name: pack.name, features: pack.features });
    }
  });

  it('idioma vem do pedido; o país salvo só vale antes do pedido carregar', () => {
    expect(orderLanguage({ extras: { us: { spec: { language: 'es' } } } })).toBe('es');
    expect(orderLanguage({ extras: { us: { spec: { language: 'en' } } } }, 'MX')).toBe('en');
    expect(orderLanguage({ extras: {} }, 'MX')).toBe('en');
    expect(orderLanguage(null, 'mx')).toBe('es');
    expect(orderLanguage(null, 'US')).toBe('en');
    expect(deliveryTexts('fr')).toBe(DELIVERY_T.en);
  });
});

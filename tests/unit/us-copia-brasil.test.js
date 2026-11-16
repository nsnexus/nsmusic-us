import { describe, it, expect } from 'vitest';
import { TEXTOS_BR } from '../../src/components/us/br/textosBr.jsx';
import { TEXTOS_ENTREGA } from '../../src/components/us/br/entrega/textosEntrega.jsx';
import { US_PACKAGES } from '../../src/lib/usCatalog.js';
import { icone3dDe } from '../../src/lib/icones3d.js';

const chaves = (o, p = '') => Object.entries(o).flatMap(([k, v]) =>
  v && typeof v === 'object' && !Array.isArray(v) && !v.$$typeof ? chaves(v, `${p}${k}.`) : [`${p}${k}`]);

// Valores que o servidor aceita (src/lib/usGeneration.js).
const MOODS_OK = ['joyful', 'heartfelt', 'romantic', 'uplifting', 'nostalgic', 'calm', 'celebratory', 'emotional', 'energetic', 'hopeful'];

describe('cópia do site brasileiro', () => {
  it('espanhol tem todos os textos do inglês, na criação e na entrega', () => {
    for (const T of [TEXTOS_BR, TEXTOS_ENTREGA]) {
      const es = new Set(chaves(T.es));
      expect(chaves(T.en).filter((k) => !es.has(k))).toEqual([]);
    }
  });

  it('humor e voz mandam ao servidor só valores aceitos, e cada humor é único', () => {
    for (const lang of ['en', 'es']) {
      const valores = TEXTOS_BR[lang].moods.map((m) => m[3]);
      expect(valores.filter((v) => !MOODS_OK.includes(v))).toEqual([]);
      expect(new Set(valores).size).toBe(valores.length);
      expect(TEXTOS_BR[lang].s3.voices.map((v) => v[0])).toEqual(['male', 'female', 'duet']);
    }
  });

  it('relações mandam o mesmo valor em inglês nos dois idiomas', () => {
    const valores = (lang) => TEXTOS_BR[lang].recipients.flatMap((c) => (c.relations ? c.relations.map(([, v]) => v) : [c.value || '']));
    expect(valores('es')).toEqual(valores('en'));
  });

  it('todo pacote do catálogo tem texto nos dois idiomas e todo cartão tem ícone 3D', () => {
    for (const lang of ['en', 'es']) {
      for (const p of US_PACKAGES) expect(TEXTOS_ENTREGA[lang].checkout.packages[p.sku]?.label).toBeTruthy();
      const emojis = [...TEXTOS_BR[lang].recipients.map((c) => c.icon), ...TEXTOS_BR[lang].occasions.map((o) => o[1]), ...TEXTOS_BR[lang].moods.map((m) => m[1])];
      expect(emojis.filter((e) => !icone3dDe(e))).toEqual([]);
    }
  });
});

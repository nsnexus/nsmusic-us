import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ICONES_3D, ICONES_RITMO, icone3dDe, iconeDoRitmo } from '../../src/lib/icones3d.js';
import { T } from '../../src/lib/usI18n.js';
import { DEFAULT_COUNTRIES } from '../../src/lib/usCountries.js';

const existe = (rel) => existsSync(path.resolve(__dirname, `../../public${rel}`));

describe('ícones 3D (loja internacional)', () => {
  it('todos os arquivos mapeados existem', () => {
    const slugs = [...new Set([...Object.values(ICONES_3D), ...Object.values(ICONES_RITMO), 'musical-note'])];
    expect(slugs.filter((s) => !existe(`/icons/3d/${s}.webp`))).toEqual([]);
  });

  it('todo cartão de "para quem" nos dois idiomas tem ícone 3D', () => {
    const emojis = [...T.en.who.cards, ...T.es.who.cards].map(([e]) => e);
    expect(emojis.filter((e) => !icone3dDe(e))).toEqual([]);
  });

  it('todo ritmo padrão tem ícone próprio e ritmo novo cai na nota musical', () => {
    const ids = DEFAULT_COUNTRIES.flatMap((c) => c.genres.map((g) => g.id));
    expect(ids.filter((id) => !ICONES_RITMO[id])).toEqual([]);
    expect(iconeDoRitmo('ritmo-que-nao-existe')).toBe('/icons/3d/musical-note.webp');
  });
});

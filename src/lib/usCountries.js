// Países atendidos pela loja internacional e os ritmos de cada um.
// Os valores abaixo são o padrão; o painel (/admin/paises) grava a versão editada na tabela `us_settings`
// (chave `us_countries`, ver supabase/us_settings.sql). O servidor sempre lê daqui — nunca confia na lista enviada pelo navegador.

export const COUNTRIES_CONFIG_KEY = 'us_countries';
export const SUPPORTED_LANGUAGES = ['en', 'es'];

const g = (id, name, description, prompt) => ({ id, name, description, prompt, enabled: true });
// Cópia dos ritmos originais do site americano (src/lib/usCatalog.js), para este módulo não depender dele.
const US_BASE = [
  { id: 'country', name: 'Country', description: 'Honest storytelling, warm guitars, a chorus that stays.', prompt: 'Modern American country, warm acoustic guitar, tasteful steel guitar, intimate storytelling and a memorable melodic chorus' },
  { id: 'pop', name: 'Pop', description: 'Bright melodies for the moments worth celebrating.', prompt: 'Contemporary American pop, clean melodic hooks, warm polished production, clear expressive vocals' },
  { id: 'rnb', name: 'R&B / Soul', description: 'Smooth grooves and a little more soul.', prompt: 'Contemporary R&B and soul, warm keys, restrained groove, expressive soulful vocals' },
  { id: 'rock', name: 'Rock', description: 'Big-hearted guitars and an anthemic lift.', prompt: 'Melodic American rock, organic electric guitars, live drums, anthemic heartfelt chorus' },
  { id: 'folk', name: 'Folk / Acoustic', description: 'Stripped back, personal, beautifully imperfect.', prompt: 'Intimate American folk and acoustic singer-songwriter music, fingerpicked guitar, natural understated vocals' },
  { id: 'christian', name: 'Christian / Worship', description: 'A gentle, uplifting contemporary sound.', prompt: 'Contemporary Christian music instrumentation, atmospheric piano, acoustic guitars, uplifting melodic arrangement' },
  { id: 'gospel', name: 'Gospel / Soul', description: 'Piano, rich harmonies, and a powerful lift.', prompt: 'American gospel and soul instrumentation, expressive piano, rich choral harmonies, uplifting dynamic arrangement' },
  { id: 'hiphop', name: 'Hip-Hop', description: 'Your story, with rhythm and personality.', prompt: 'Clean American melodic hip-hop, crisp drums, warm instrumental texture, thoughtful rhythmic delivery, no explicit language' },
  { id: 'jazz', name: 'Jazz', description: 'Timeless piano, soft swing, and warm vocals.', prompt: 'Vocal jazz, warm piano trio, brushed drums, gentle swing, intimate natural vocals' },
  { id: 'latin', name: 'Latin Pop', description: 'Sunlit rhythm with an English-language melody.', prompt: 'English-language Latin pop, warm acoustic guitar, light Latin percussion, bright melodic chorus' },
];
const fromUs = (id) => { const x = US_BASE.find((item) => item.id === id); return g(x.id, x.name, x.description, x.prompt); };

export const DEFAULT_COUNTRIES = [
  {
    code: 'US', name: 'United States', flag: '🇺🇸', language: 'en', active: true,
    genres: ['pop', 'country', 'rnb', 'hiphop', 'rock', 'folk', 'christian', 'gospel', 'latin', 'jazz'].map(fromUs),
  },
  {
    code: 'CA', name: 'Canada', flag: '🇨🇦', language: 'en', active: true,
    genres: [
      fromUs('pop'),
      fromUs('country'),
      g('classic-rock', 'Classic Rock', 'Big guitars and a singalong chorus.', 'Classic rock inspired original song, warm overdriven electric guitars, live drums, big singalong chorus, heartfelt vocals'),
      g('hiphop-rnb', 'Hip-Hop / R&B', 'Smooth beats with a personal touch.', 'Modern Canadian R&B and melodic hip-hop, atmospheric keys, smooth groove, clean lyrics, expressive vocals'),
      fromUs('folk'),
      g('indie', 'Indie / Alternative', 'Warm, honest and a little dreamy.', 'Indie alternative pop-rock, jangly guitars, warm synth pads, honest heartfelt vocals, uplifting chorus'),
    ],
  },
  {
    code: 'AU', name: 'Australia', flag: '🇦🇺', language: 'en', active: true,
    genres: [
      fromUs('pop'),
      g('aussie-rock', 'Rock', 'Sunny pub-rock energy and a big chorus.', 'Australian pub rock, driving electric guitars, punchy live drums, anthemic chorus, warm heartfelt vocals'),
      g('aussie-country', 'Country', 'Outback storytelling with acoustic warmth.', 'Contemporary Australian country, acoustic and electric guitars, warm storytelling vocals, singalong chorus'),
      g('hiphop-rnb', 'Hip-Hop / R&B', 'Smooth grooves and rhythm.', 'Modern R&B and melodic hip-hop, smooth groove, warm keys, clean lyrics, expressive vocals'),
      g('indie', 'Indie', 'Breezy guitars and an easygoing feel.', 'Breezy Australian indie pop, bright clean guitars, relaxed groove, warm vocals, catchy chorus'),
      fromUs('folk'),
      g('dance', 'Dance / Electronic', 'Feel-good beats for a celebration.', 'Feel-good melodic dance pop, warm synths, four-on-the-floor beat, uplifting euphoric chorus, clear vocals'),
    ],
  },
  {
    code: 'MX', name: 'México', flag: '🇲🇽', language: 'es', active: true,
    genres: [
      g('banda', 'Regional Mexicano (Banda)', 'Metales, tambora y mucho sentimiento.', 'Regional Mexican banda sinaloense, brass section, tuba, tambora, heartfelt romantic Spanish vocals, festive emotional chorus'),
      g('norteno', 'Norteño romántico', 'Acordeón y bajo sexto, puro corazón.', 'Romantic norteño, button accordion, bajo sexto, warm heartfelt Spanish vocals, story-driven love song, no violent themes'),
      g('mariachi', 'Mariachi / Ranchera', 'Trompetas, violines y voz con alma.', 'Traditional mariachi ranchera, trumpets, violins, vihuela, guitarrón, powerful emotional Spanish vocals'),
      g('balada', 'Balada Romántica', 'Piano y una voz que llega al alma.', 'Spanish-language romantic ballad, piano and strings, intimate then soaring emotional vocals'),
      g('pop-latino', 'Pop Latino', 'Alegre, moderno y para cantar.', 'Modern Latin pop in Spanish, acoustic guitar, light Latin percussion, bright catchy chorus'),
      g('cumbia', 'Cumbia', 'Para bailar y celebrar.', 'Mexican cumbia, accordion, güiro, tropical percussion, joyful danceable groove, Spanish vocals'),
      g('bachata', 'Bachata', 'Guitarras románticas y ritmo suave.', 'Romantic bachata, requinto guitar, bongos, güira, smooth sensual groove, tender Spanish vocals'),
      g('reggaeton', 'Reggaetón romántico', 'Ritmo urbano, letra limpia y bonita.', 'Romantic reggaeton, dembow rhythm, smooth melodic hooks, clean Spanish lyrics, warm vocals'),
      g('bolero', 'Bolero', 'Clásico, elegante y eterno.', 'Classic romantic bolero, nylon guitars, soft percussion, elegant intimate Spanish vocals'),
      g('cristiana', 'Cristiana / Alabanza', 'Inspiradora y llena de esperanza.', 'Contemporary Spanish Christian worship, piano, acoustic guitar, atmospheric uplifting arrangement'),
    ],
  },
];

const LIMITES = { name: 60, description: 120, prompt: 400, id: 40 };

function limpa(texto, max) {
  return typeof texto === 'string' ? texto.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max) : '';
}

// Normaliza e valida o que vem do painel (ou do banco). Rejeita lista inválida inteira.
export function sanitizeCountries(input) {
  if (!Array.isArray(input) || input.length === 0 || input.length > 60) throw new Error('Lista de países inválida.');
  const vistos = new Set();
  return input.map((raw) => {
    const code = limpa(raw?.code, 10).toUpperCase();
    if (!/^[A-Z]{2}$/.test(code) || vistos.has(code)) throw new Error(`Código de país inválido ou repetido: ${raw?.code}`);
    vistos.add(code);
    const language = SUPPORTED_LANGUAGES.includes(raw?.language) ? raw.language : 'en';
    const ids = new Set();
    const genres = (Array.isArray(raw?.genres) ? raw.genres : []).slice(0, 30).map((genre) => {
      const id = limpa(genre?.id, LIMITES.id).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
      const name = limpa(genre?.name, LIMITES.name);
      const prompt = limpa(genre?.prompt, LIMITES.prompt);
      if (!id || !name || !prompt) throw new Error(`Ritmo incompleto em ${code}: id, nome e estilo são obrigatórios.`);
      if (ids.has(id)) throw new Error(`Ritmo repetido em ${code}: ${id}`);
      ids.add(id);
      return { id, name, description: limpa(genre?.description, LIMITES.description), prompt, enabled: genre?.enabled !== false };
    });
    return { code, name: limpa(raw?.name, 60) || code, flag: limpa(raw?.flag, 8), language, active: raw?.active !== false, genres };
  });
}

// Lê a configuração do banco; se não existir ou estiver inválida, usa o padrão.
export async function loadCountries(db) {
  try {
    if (!db) return DEFAULT_COUNTRIES;
    const { data, error } = await db.from('us_settings').select('value').eq('key', COUNTRIES_CONFIG_KEY).maybeSingle();
    if (error || !data?.value) return DEFAULT_COUNTRIES;
    return sanitizeCountries(data.value?.countries || data.value);
  } catch (e) {
    console.warn('[usCountries] configuração inválida, usando padrão:', e?.message);
    return DEFAULT_COUNTRIES;
  }
}

export function findCountry(countries, code) {
  const c = String(code || '').toUpperCase();
  return countries.find((item) => item.code === c && item.active) || null;
}

export function findGenre(country, genreId) {
  return country?.genres?.find((item) => item.id === genreId && item.enabled) || null;
}

export async function saveCountries(db, countries, updatedBy = '') {
  const clean = sanitizeCountries(countries);
  const { error } = await db.from('us_settings').upsert({ key: COUNTRIES_CONFIG_KEY, value: { countries: clean }, updated_at: new Date().toISOString(), updated_by: updatedBy || null }, { onConflict: 'key' });
  if (error) {
    const semTabela = /us_settings|does not exist|relation/i.test(error.message || '');
    throw new Error(semTabela ? 'A tabela us_settings ainda não existe. Rode supabase/us_settings.sql no Supabase dos EUA.' : 'Não foi possível salvar os países.');
  }
  return clean;
}

// O que o navegador pode ver: sem o prompt de estilo (detalhe interno da produção).
export function publicCountries(countries) {
  return countries.filter((c) => c.active).map((c) => ({
    code: c.code, name: c.name, flag: c.flag, language: c.language,
    genres: c.genres.filter((x) => x.enabled).map(({ id, name, description }) => ({ id, name, description })),
  }));
}

// País do visitante pelo cabeçalho que a Cloudflare acrescenta. Só usado como sugestão.
export function detectCountryCode(headers) {
  const raw = headers?.get?.('cf-ipcountry') || '';
  return /^[A-Z]{2}$/.test(raw) && raw !== 'XX' && raw !== 'T1' ? raw : '';
}

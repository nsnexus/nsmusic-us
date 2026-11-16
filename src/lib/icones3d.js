// Ícones 3D (Microsoft Fluent Emoji, licença MIT — ver public/icons/3d/LICENSE) no lugar dos
// emojis do sistema, que mudam de cara em cada celular. Os dados continuam usando o emoji como
// chave; quem desenha troca pelo arquivo. Emoji sem ícone aqui continua aparecendo como emoji.

export const ICONES_3D = {
  '🪗': 'accordion',
  '👶': 'baby',
  '🪕': 'banjo',
  '🎂': 'birthday-cake',
  '👦': 'boy',
  '👰': 'bride',
  '💼': 'briefcase',
  '🌸': 'cherry-blossom',
  '🧒': 'child',
  '⛪': 'church',
  '🎛️': 'control-knobs',
  '🤠': 'cowboy',
  '🕊️': 'dove',
  '🥁': 'drum',
  '🍂': 'fallen-leaf',
  '👨‍👩‍👧': 'family',
  '🔥': 'fire',
  '💎': 'gem',
  '🎁': 'gift',
  '👧': 'girl',
  '🌟': 'glowing-star',
  '🎓': 'graduation-cap',
  '😄': 'grinning',
  '💗': 'growing-heart',
  '🎸': 'guitar',
  '🤝': 'handshake',
  '🎧': 'headphone',
  '💝': 'heart-ribbon',
  '⚡': 'high-voltage',
  '🥹': 'holding-tears',
  '☕': 'hot-beverage',
  '🍃': 'leaf-wind',
  '🪘': 'long-drum',
  '💌': 'love-letter',
  '👨': 'man',
  '🤵': 'man-in-tuxedo',
  '🎤': 'microphone',
  '🪩': 'mirror-ball',
  '🎹': 'musical-keyboard',
  '🎵': 'musical-note',
  '👔': 'necktie',
  '👴': 'old-man',
  '👵': 'old-woman',
  '🌴': 'palm-tree',
  '🎉': 'party-popper',
  '👯': 'hugging',
  '🫂': 'hugging',
  '👬': 'hugging',
  '👭': 'hugging',
  '🥺': 'pleading',
  '❤️': 'red-heart',
  '💞': 'revolving-hearts',
  '💍': 'ring',
  '🎷': 'saxophone',
  '👫': 'hugging',
  '✨': 'sparkles',
  '💖': 'sparkling-heart',
  '🔊': 'speaker',
  '🎙️': 'studio-microphone',
  '☀️': 'sun',
  '🧸': 'teddy-bear',
  '🌷': 'tulip',
  '💑': 'two-hearts',
  '🌊': 'water-wave',
  '💒': 'wedding',
  '👩': 'woman',
  '🪵': 'wood',
  '✍️': 'writing-hand',
  '💛': 'yellow-heart',
};

/** Caminho do ícone 3D de um emoji, ou null se não houver. Ignora o seletor de variação (U+FE0F). */
export function icone3dDe(emoji) {
  if (!emoji) return null;
  const slug = ICONES_3D[emoji] || ICONES_3D[String(emoji).replace(/\uFE0F/g, '')] || ICONES_3D[`${String(emoji).replace(/\uFE0F/g, '')}\uFE0F`];
  return slug ? `/icons/3d/${slug}.webp` : null;
}

// Ritmo (id do painel de países) → ícone. Ritmo novo criado no painel cai na nota musical.
export const ICONES_RITMO = {
  pop: 'microphone', country: 'cowboy', rnb: 'saxophone', hiphop: 'studio-microphone', rock: 'guitar',
  folk: 'banjo', christian: 'dove', gospel: 'church', latin: 'maracas', jazz: 'musical-keyboard',
  'classic-rock': 'guitar', 'hiphop-rnb': 'headphone', indie: 'cherry-blossom', 'aussie-rock': 'guitar',
  'aussie-country': 'cowboy', dance: 'mirror-ball',
  'uk-pop': 'microphone', britpop: 'guitar', 'uk-ballad': 'musical-keyboard', 'uk-soul': 'saxophone',
  'uk-rock': 'guitar', 'uk-dance': 'mirror-ball', 'uk-rap': 'headphone',
  banda: 'trumpet', norteno: 'accordion', mariachi: 'violin', balada: 'musical-keyboard', 'pop-latino': 'microphone',
  cumbia: 'maracas', bachata: 'guitar', reggaeton: 'headphone', bolero: 'red-heart', cristiana: 'dove',
};

export function iconeDoRitmo(id) {
  return `/icons/3d/${ICONES_RITMO[id] || 'musical-note'}.webp`;
}


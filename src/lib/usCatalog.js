export const US_PACKAGES = [
  { sku: 'audio_only', name: 'The Song', rank: 1, priceCents: 499, features: ['Your personalized song', 'Full-length MP3 download', 'Private listening page'] },
  { sku: 'combo_carta', name: 'The Letter', rank: 2, priceCents: 599, features: ['Everything in The Song', 'A personal letter to edit and print'] },
  { sku: 'combo', name: 'The Film', rank: 3, priceCents: 799, features: ['Everything in The Letter', 'A photo video set to your song'] },
  { sku: 'combo_retrospectiva', name: 'The Keepsake', rank: 4, priceCents: 999, features: ['Everything in The Film', 'A photo timeline with your memories'] },
];
export const US_GENRES = [
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
export const formatUsd = cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
export const getUsPackage = sku => US_PACKAGES.find(item => item.sku === sku) || null;
export const usRights = sku => { const rank = getUsPackage(sku)?.rank || 0; return { hasCartaAccess: rank >= 2, hasVideoAccess: rank >= 3, hasRetrospectivaAccess: rank >= 4 }; };

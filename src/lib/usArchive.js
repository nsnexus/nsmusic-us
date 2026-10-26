import { fetchUsAudio } from './usAssets';
export const usAudioKey = (id, index) => 'us/orders/' + id + '/audio/track-' + index + '.mp3';
export async function archiveUsTracks(id, tracks, env) {
  if (!env.nsmusic_media) return false;
  let archived = true;
  for (let index = 0; index < tracks.length; index++) {
    try {
      const key = usAudioKey(id, index);
      if (await env.nsmusic_media.head(key)) continue;
      const res = await fetchUsAudio(tracks[index].audioUrl, null, env);
      const max = 25 * 1024 * 1024;
      if (Number(res.headers.get('content-length')) > max) throw new Error('Audio exceeds archive limit.');
      const reader = res.body.getReader(); const chunks = []; let size = 0;
      try { while (true) { const chunk = await reader.read(); if (chunk.done) break; size += chunk.value.byteLength; if (size > max) throw new Error('Audio exceeds archive limit.'); chunks.push(chunk.value); } }
      finally { await reader.cancel().catch(() => {}); }
      if (!size) throw new Error('Empty audio.');
      const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      await env.nsmusic_media.put(key, bytes, { httpMetadata: { contentType: 'audio/mpeg', cacheControl: 'private, no-store' } });
    } catch { archived = false; }
  }
  return archived;
}

import { isAllowedMediaUrl } from './proxyAllowlist';
import { usFailure } from './usOrders';
export function ownedAssetKey(key, id) { return typeof key === 'string' && key.startsWith('us/orders/' + id + '/') && /^[a-zA-Z0-9/_\-.]+$/.test(key) && !key.split('/').includes('..'); }
export function allowedUsAudio(url, env = {}) {
  if (isAllowedMediaUrl(url)) return true;
  try { const base = new URL(env.R2_PUBLIC_URL || process.env.R2_PUBLIC_URL); const target = new URL(url); return target.protocol === 'https:' && target.origin === base.origin && target.pathname.startsWith(base.pathname.replace(/\/$/, '') + '/us/'); } catch { return false; }
}
export async function fetchUsAudio(url, range, env, depth = 0) {
  if (!allowedUsAudio(url, env) || depth > 3) throw usFailure('This audio source is unavailable.', 502);
  const response = await fetch(url, { redirect: 'manual', headers: range ? { Range: range } : {}, signal: AbortSignal.timeout(20000) });
  if ([301,302,303,307,308].includes(response.status)) return fetchUsAudio(new URL(response.headers.get('location'), url).href, range, env, depth + 1);
  if (!response.ok || !response.body) throw usFailure('Your audio is temporarily unavailable. Please try again.', 502);
  return response;
}

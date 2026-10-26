// Compatibility bridge for the retained admin and US routes on Cloudflare Workers.
import { getCloudflareContext } from '@opennextjs/cloudflare';
export function getRequestContext() {
  try { return getCloudflareContext(); }
  catch { return { env: {} }; }
}

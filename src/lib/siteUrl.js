export const DOMINIO_CANONICO = 'http://localhost:3011';
export function normalizarSiteUrl(value) { try { const url = new URL(String(value || '')); return url.origin; } catch { return ''; } }
export const SITE_URL = normalizarSiteUrl(process.env.NEXT_PUBLIC_SITE_URL) || DOMINIO_CANONICO;
export function resolverSiteUrl(value) { return normalizarSiteUrl(value) || SITE_URL; }

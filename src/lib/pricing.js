// Compatibility exports for the retained admin. The US checkout uses usCatalog directly.
import { US_PACKAGES, getUsPackage, usRights } from './usCatalog';
export const SKU_PRICES = Object.fromEntries(US_PACKAGES.map(pack => [pack.sku, pack.priceCents / 100]));
export const CREDIT_PACKAGES = Object.freeze({});
export const getCreditPackage = () => null;
export const getCreditCostForSku = () => null;
export const getPriceForSku = sku => getUsPackage(sku)?.priceCents / 100 || null;
export const skuGrantsVideoAccess = sku => usRights(sku).hasVideoAccess;
export const skuGrantsCartaAccess = sku => usRights(sku).hasCartaAccess;
export const skuGrantsRetrospectivaAccess = sku => usRights(sku).hasRetrospectivaAccess;
export const skuGrantsKaraokeAccess = () => false;
export const skuGrantsCustomVoiceAccess = () => false;
export const skuApprovesMusic = sku => Boolean(getUsPackage(sku));
// Legacy impact payments are disabled; never infer paid rights from an amount.
export const brindesPorValorPago = () => ({ carta: false, video: false, retrospectiva: false });
export const faixasDeImpacto = () => [];

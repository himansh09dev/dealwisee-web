/*
 * Zod-free constants shared by web and API. Kept separate from the schemas so
 * browser code that only needs labels and ids (navigation, cards, filters)
 * doesn't download the validation library.
 */

export const categoryIds = [
  "audio",
  "phones",
  "computing",
  "gaming",
  "cameras",
  "wearables",
  "footwear",
  "home",
  "accessories",
] as const;
export type CategoryId = (typeof categoryIds)[number];

/** The category taxonomy is app configuration, not catalog data. */
export const categoryLabels: Record<CategoryId, string> = {
  audio: "Audio",
  phones: "Phones",
  computing: "Computing",
  gaming: "Gaming",
  cameras: "Cameras",
  wearables: "Wearables",
  footwear: "Footwear",
  home: "Home & Kitchen",
  accessories: "Accessories",
};
export const categoryList = categoryIds.map((id) => ({ id, name: categoryLabels[id] }));
export type Category = (typeof categoryList)[number];

export function isCategoryId(value: string): value is CategoryId {
  return categoryIds.some((id) => id === value);
}

/** Retailers offers can reference. Fictional, for the demo dataset. */
export const storeIds = ["northline", "parcel", "voltmart", "harbor", "kettle"] as const;
const storeNames: Record<(typeof storeIds)[number], string> = {
  northline: "Northline",
  parcel: "Parcel & Co.",
  voltmart: "Voltmart",
  harbor: "Harbor Supply",
  kettle: "Kettle & Crate",
};
export type Store = { id: string; name: string };
export const stores: Store[] = storeIds.map((id) => ({ id, name: storeNames[id] }));
export function storeName(id: string) {
  return stores.find((s) => s.id === id)?.name ?? id;
}

export const sortValues = ["newest", "price-asc", "price-desc", "name-asc", "drops"] as const;
export type ProductSort = (typeof sortValues)[number];
export const MAX_PAGE_SIZE = 48;

/** Most products a wishlist can hold: keeps GET /api/wishlist bounded. */
export const MAX_WISHLIST_ITEMS = 200;

/**
 * Remote hosts product images may come from. The web app's image optimizer
 * only fetches from these (next.config remotePatterns), so an admin can't
 * point it at arbitrary servers, and every accepted URL actually renders.
 */
export const allowedImageHosts = ["images.unsplash.com"] as const;

export function isAllowedImageUrl(value: string) {
  if (value.startsWith("/images/") && !value.includes("..")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && allowedImageHosts.some((h) => h === url.hostname);
  } catch {
    return false;
  }
}

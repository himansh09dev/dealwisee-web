import { derivePrices, storeName, vsAverage } from "@pricepilot/contracts";

import type { SeedProduct } from "./data.ts";

/** Seed records → documents with derived price fields, exactly as the service would store them. */
export function buildProductDocuments(products: SeedProduct[]) {
  return products.map(({ createdAt, history, ...p }) => {
    const offers = p.offers.map((o) => ({ ...o, storeName: storeName(o.storeId) }));
    const { currentPrice, previousPrice } = derivePrices({ offers, history });
    return {
      ...p,
      offers,
      history,
      currentPrice,
      previousPrice,
      vsAverage: vsAverage({ offers, history, currentPrice }),
      createdAt: new Date(createdAt),
      updatedAt: new Date(createdAt),
    };
  });
}

export type CategoryId =
  | "audio"
  | "phones"
  | "computing"
  | "gaming"
  | "cameras"
  | "wearables"
  | "footwear"
  | "home"
  | "accessories";

export type Category = {
  id: CategoryId;
  name: string;
};

export type Store = {
  id: string;
  name: string;
};

export type Offer = {
  storeId: Store["id"];
  /** Integer cents */
  price: number;
  /** Integer cents; 0 means free shipping */
  shipping: number;
  inStock: boolean;
};

export type Product = {
  slug: string;
  name: string;
  brand: string;
  category: CategoryId;
  summary: string;
  image: {
    src: string;
    alt: string;
    /** Source page for the photograph (Unsplash License) */
    sourceUrl: string;
  };
  /** Manufacturer's list price, integer cents */
  listPrice: number;
  /** ISO date the product entered the catalog */
  addedAt: string;
  offers: Offer[];
  /**
   * Lowest total price for each of the previous 11 weeks, oldest first, integer cents.
   * The current week is always derived from live offers, so the two can't disagree.
   */
  history: number[];
};

/** Values computed from a Product's offers and history; never stored. */
export type PriceInsight = {
  best: Offer & { total: number; store: Store };
  highestTotal: number;
  storeCount: number;
  inStockCount: number;
  historyAverage: number;
  historyLow: number;
  historyHigh: number;
  /** (best total − 12-week average) / average. Negative = cheaper than usual. */
  vsAverage: number;
};

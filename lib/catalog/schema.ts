import { priceInsight, type PriceInsight } from "@pricepilot/contracts/pricing";
import type { Product } from "@pricepilot/contracts";

/*
 * Web-side catalog module. Re-exports only the Zod-free parts of the contracts
 * (taxonomy constants, price maths, types), so importing it from browser code
 * never downloads the validation library. Import schemas from
 * "@pricepilot/contracts" directly where they're needed.
 */

export * from "@pricepilot/contracts/taxonomy";
export * from "@pricepilot/contracts/pricing";
export type {
  Facet,
  FieldIssue,
  Product,
  ProductInput,
  ProductListMeta,
  PublicUser,
  Role,
} from "@pricepilot/contracts";

export type ProductWithInsight = { product: Product; insight: PriceInsight };

export function withInsight(product: Product): ProductWithInsight {
  return { product, insight: priceInsight(product) };
}

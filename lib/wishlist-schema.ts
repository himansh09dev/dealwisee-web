import { productSchema } from "@pricepilot/contracts";
import { z } from "zod";

/** Loaded on demand by lib/wishlist.ts (only when a signed-in user's wishlist is fetched). */
export const wishlistResponse = z.object({ data: z.array(productSchema) });

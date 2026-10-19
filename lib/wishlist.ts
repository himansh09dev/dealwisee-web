"use client";

import { createLocalListStore } from "./stores/local-list";

/** Device-local wishlist (temporary adapter — see lib/stores/local-list.ts). */
export const wishlist = createLocalListStore({ key: "pricepilot:wishlist:v1" });

export const useWishlist = wishlist.useItems;

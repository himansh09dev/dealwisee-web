import { categoryIds, storeIds } from "@pricepilot/contracts";

import type { SeedProduct } from "./data.ts";

/*
 * Deterministic synthetic catalog for load tests and benchmarks only.
 * Same seed → same products, so before/after measurements compare like
 * with like. Never used by `npm run seed`.
 */

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const brands = ["Acme", "Northwind", "Contoso", "Fabrikam", "Globex", "Initech", "Umbrella", "Hooli", "Stark", "Wayne", "Tyrell", "Cyberdyne"];
const nouns = ["Speaker", "Headphones", "Phone", "Laptop", "Console", "Camera", "Watch", "Sneaker", "Grinder", "Lamp", "Sunglasses", "Tablet"];
const adjectives = ["Pro", "Lite", "Max", "Mini", "Air", "Studio", "Sport", "Classic", "Ultra", "Plus"];

export function syntheticProducts(count: number, seed = 42): SeedProduct[] {
  const rand = mulberry32(seed);
  const pick = <T,>(list: readonly T[]): T => list[Math.floor(rand() * list.length)] as T;
  const start = Date.parse("2025-01-01T00:00:00.000Z");

  return Array.from({ length: count }, (_, i) => {
    const brand = pick(brands);
    const name = `${pick(adjectives)} ${pick(nouns)} ${i}`;
    const base = 1000 + Math.floor(rand() * 200_000);
    const offerCount = 1 + Math.floor(rand() * 4);
    const offerStores = [...storeIds].sort(() => rand() - 0.5).slice(0, offerCount);
    const hasHistory = rand() > 0.3;
    return {
      slug: `synthetic-${i}`,
      name,
      brand,
      category: pick(categoryIds),
      summary: `${brand} ${name} · synthetic`,
      description: `Synthetic product ${i} for load testing.`,
      image: { url: "/images/products/jbl-flip-5.jpg", alt: `Synthetic product ${i}` },
      listPrice: Math.round(base * 1.2),
      createdAt: new Date(start + Math.floor(rand() * 600) * 86_400_000).toISOString(),
      offers: offerStores.map((storeId) => ({
        storeId,
        price: Math.round(base * (0.85 + rand() * 0.3)),
        shipping: rand() > 0.6 ? 0 : Math.round(rand() * 1500),
        inStock: rand() > 0.15,
      })),
      specs: [{ label: "Weight", value: `${100 + Math.floor(rand() * 900)} g` }],
      ...(hasHistory ? { history: Array.from({ length: 11 }, () => Math.round(base * (0.9 + rand() * 0.3))) } : {}),
    };
  });
}

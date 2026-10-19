import { categories } from "@/lib/catalog/data";

export const primaryNav = [
  { href: "/products", label: "Discover" },
  { href: "/compare", label: "Compare" },
] as const;

export const categoryLinks = categories.map((c) => ({
  href: `/products?category=${c.id}`,
  label: c.name,
}));

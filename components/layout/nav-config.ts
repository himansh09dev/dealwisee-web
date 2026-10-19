import { categoryList } from "@/lib/catalog/schema";

export const primaryNav = [
  { href: "/products", label: "Discover" },
  { href: "/compare", label: "Compare" },
] as const;

export const categoryLinks = categoryList.map((c) => ({
  href: `/products?category=${c.id}`,
  label: c.name,
}));

import { compareQuerySchema, productListQuerySchema, slugSchema } from "@pricepilot/contracts";
import type { Request, Response } from "express";

import * as products from "../services/product.service.ts";

export async function list(req: Request, res: Response) {
  const query = productListQuerySchema.parse(req.query);
  const { items, meta } = await products.listProducts(query);
  res.json({ data: items, meta });
}

export async function compare(req: Request, res: Response) {
  const { slugs } = compareQuerySchema.parse(req.query);
  const { items, missing } = await products.getProductsBySlugs([...new Set(slugs)]);
  res.json({ data: items, meta: { missing } });
}

export async function getBySlug(req: Request, res: Response) {
  const slug = slugSchema.parse(req.params.slug);
  res.json({ data: await products.getProductBySlug(slug) });
}

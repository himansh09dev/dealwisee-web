import { objectIdSchema, productInputSchema, productPatchSchema } from "@pricepilot/contracts";
import type { Request, Response } from "express";

import * as products from "../services/product.service.ts";

export async function create(req: Request, res: Response) {
  const input = productInputSchema.parse(req.body);
  res.status(201).json({ data: await products.createProduct(input) });
}

export async function update(req: Request, res: Response) {
  const id = objectIdSchema.parse(req.params.id);
  const patch = productPatchSchema.parse(req.body);
  res.json({ data: await products.updateProduct(id, patch) });
}

export async function remove(req: Request, res: Response) {
  const id = objectIdSchema.parse(req.params.id);
  await products.deleteProduct(id);
  res.json({ data: { id, deleted: true } });
}

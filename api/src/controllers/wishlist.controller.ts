import { objectIdSchema } from "@pricepilot/contracts";
import type { Request, Response } from "express";

import { unauthenticated } from "../lib/http-error.ts";
import * as wishlist from "../services/wishlist.service.ts";

function userId(res: Response) {
  const user = res.locals.user;
  if (!user) throw unauthenticated();
  return user.id;
}

export async function list(_req: Request, res: Response) {
  res.json({ data: await wishlist.listWishlist(userId(res)) });
}

export async function add(req: Request, res: Response) {
  const productId = objectIdSchema.parse(req.params.productId);
  const { created } = await wishlist.addToWishlist(userId(res), productId);
  res.status(created ? 201 : 200).json({ data: { productId, saved: true } });
}

export async function remove(req: Request, res: Response) {
  const productId = objectIdSchema.parse(req.params.productId);
  await wishlist.removeFromWishlist(userId(res), productId);
  res.json({ data: { productId, saved: false } });
}

import type { Request, Response } from "express";

import { isDatabaseUp } from "../db/connect.ts";

/** Liveness + DB readiness, for load balancers and uptime checks. No internals exposed. */
export function health(_req: Request, res: Response) {
  const db = isDatabaseUp() ? "up" : "down";
  res
    .status(db === "up" ? 200 : 503)
    .json({ data: { status: db === "up" ? "ok" : "degraded", db, uptimeSeconds: Math.round(process.uptime()) } });
}

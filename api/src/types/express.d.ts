import type { Role } from "@pricepilot/contracts";

declare global {
  namespace Express {
    interface Locals {
      /** Set by the authenticate middleware when a valid session cookie is present. */
      user?: { id: string; name: string; email: string; role: Role; sessionId: string };
    }
  }
}

export {};

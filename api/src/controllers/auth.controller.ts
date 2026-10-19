import { loginSchema, registerSchema, SESSION_COOKIE } from "@pricepilot/contracts";
import type { Request, Response } from "express";

import { sessionCookieOptions } from "../middleware/auth.ts";
import * as auth from "../services/auth.service.ts";

export type AuthControllerConfig = auth.AuthConfig & { production: boolean };

export function authController(config: AuthControllerConfig) {
  const setSession = (res: Response, session: { token: string; expiresAt: Date }) =>
    res.cookie(
      SESSION_COOKIE,
      session.token,
      sessionCookieOptions(config.production, session.expiresAt.getTime() - Date.now()),
    );

  return {
    async register(req: Request, res: Response) {
      const input = registerSchema.parse(req.body);
      const { user, session } = await auth.register(input, config);
      setSession(res, session);
      res.status(201).json({ data: { user } });
    },

    async login(req: Request, res: Response) {
      const input = loginSchema.parse(req.body);
      const { user, session } = await auth.login(input, config);
      setSession(res, session);
      res.json({ data: { user } });
    },

    async logout(req: Request, res: Response) {
      const token: unknown = req.cookies?.[SESSION_COOKIE];
      if (typeof token === "string") await auth.destroySession(token);
      res.clearCookie(SESSION_COOKIE, sessionCookieOptions(config.production));
      res.json({ data: { signedOut: true } });
    },

    /** Current session. Anonymous is a normal state here, not an error: 200 with user null. */
    me(_req: Request, res: Response) {
      const user = res.locals.user;
      if (!user) return res.json({ data: { user: null } });
      const { sessionId: _sessionId, ...publicUser } = user;
      res.json({ data: { user: publicUser } });
    },
  };
}

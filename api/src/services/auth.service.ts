import type { PublicUser, Role } from "@pricepilot/contracts";
import { createHash, randomBytes } from "node:crypto";

import { HttpError } from "../lib/http-error.ts";
import { hashPassword, verifyPassword } from "../lib/password.ts";
import { SessionModel } from "../models/session.model.ts";
import { UserModel } from "../models/user.model.ts";

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export type AuthConfig = { scryptLogN: number; sessionTtlDays: number };

type UserLike = { _id: { toString(): string }; name: string; email: string; role: string };

export function toPublicUser(user: UserLike): PublicUser {
  const role: Role = user.role === "admin" ? "admin" : "user";
  return { id: user._id.toString(), name: user.name, email: user.email, role };
}

export async function createSession(userId: string, ttlDays: number) {
  // 256 bits of randomness; the raw token only ever lives in the cookie.
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
  await SessionModel.create({ tokenHash: sha256(token), userId, expiresAt });
  return { token, expiresAt };
}

export async function register(input: { name: string; email: string; password: string }, config: AuthConfig) {
  const passwordHash = await hashPassword(input.password, config.scryptLogN);
  try {
    // Role is never taken from the request: every self-registered account is a "user".
    const user = await UserModel.create({ name: input.name, email: input.email, passwordHash, role: "user" });
    const session = await createSession(user._id.toString(), config.sessionTtlDays);
    return { user: toPublicUser(user), session };
  } catch (err) {
    if (typeof err === "object" && err !== null && "code" in err && err.code === 11000) {
      throw new HttpError(409, "CONFLICT", "An account with this email already exists", [
        { path: "email", message: "An account with this email already exists" },
      ]);
    }
    throw err;
  }
}

let dummyHash: Promise<string> | undefined;

export async function login(input: { email: string; password: string }, config: AuthConfig) {
  const user = await UserModel.findOne({ email: input.email }).select("+passwordHash");
  if (!user) {
    // Spend the same time as a real check so response timing doesn't reveal
    // which emails have accounts.
    dummyHash ??= hashPassword("not-a-real-password", config.scryptLogN);
    await verifyPassword(input.password, await dummyHash);
    throw invalidCredentials();
  }
  if (!(await verifyPassword(input.password, user.passwordHash))) throw invalidCredentials();
  const session = await createSession(user._id.toString(), config.sessionTtlDays);
  return { user: toPublicUser(user), session };
}

const invalidCredentials = () => new HttpError(401, "UNAUTHENTICATED", "Email or password is incorrect");

export async function resolveSession(token: string) {
  const session = await SessionModel.findOne({ tokenHash: sha256(token), expiresAt: { $gt: new Date() } }).lean();
  if (!session) return null;
  const user = await UserModel.findById(session.userId).lean();
  if (!user) return null;
  return { ...toPublicUser(user), sessionId: session._id.toString() };
}

export async function destroySession(token: string) {
  await SessionModel.deleteOne({ tokenHash: sha256(token) });
}

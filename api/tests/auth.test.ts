import { SESSION_COOKIE } from "@pricepilot/contracts";
import supertest from "supertest";
import { describe, expect, it } from "vitest";

import { UserModel } from "../src/models/user.model.ts";
import { createUser, makeApp, ORIGIN, TEST_PASSWORD, useTestDatabase } from "./helpers.ts";

useTestDatabase();
const app = makeApp();
const valid = { name: "Ana Test", email: "Ana@Example.test", password: "long-enough-1" };

function sessionCookie(res: supertest.Response) {
  const raw = res.headers["set-cookie"];
  const cookies = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return cookies.find((c) => c.startsWith(`${SESSION_COOKIE}=`));
}

describe("POST /api/auth/register", () => {
  it("creates a user, normalises the email, hashes the password and sets a secure session cookie", async () => {
    const res = await supertest(app).post("/api/auth/register").send(valid).expect(201);
    expect(res.body.data.user).toEqual({ id: expect.any(String), name: "Ana Test", email: "ana@example.test", role: "user" });
    expect(res.body.data.user).not.toHaveProperty("passwordHash");

    const cookie = sessionCookie(res);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
    expect(cookie).not.toMatch(/Secure/); // only in production

    const stored = await UserModel.findOne({ email: "ana@example.test" }).select("+passwordHash").lean();
    expect(stored?.passwordHash).toMatch(/^scrypt\$/);
    expect(stored?.passwordHash).not.toContain(valid.password);
  });

  it("ignores a client-supplied role", async () => {
    const res = await supertest(app).post("/api/auth/register").send({ ...valid, role: "admin" }).expect(201);
    expect(res.body.data.user.role).toBe("user");
  });

  it("rejects duplicate emails regardless of case", async () => {
    await supertest(app).post("/api/auth/register").send(valid).expect(201);
    const res = await supertest(app)
      .post("/api/auth/register")
      .send({ ...valid, email: "ANA@example.TEST" })
      .expect(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("validates input and reports field paths", async () => {
    const res = await supertest(app)
      .post("/api/auth/register")
      .send({ name: "", email: "not-an-email", password: "short" })
      .expect(400);
    expect(res.body.error.details.map((d: { path: string }) => d.path).sort()).toEqual(["email", "name", "password"]);
  });
});

describe("POST /api/auth/login", () => {
  it("signs in and the session works for /me until logout", async () => {
    const email = await createUser("user");
    const agent = supertest.agent(app);
    await agent.post("/api/auth/login").send({ email: email.toUpperCase(), password: TEST_PASSWORD }).expect(200);
    const me = await agent.get("/api/auth/me").expect(200);
    expect(me.body.data.user.email).toBe(email);
    expect(me.headers["cache-control"]).toBe("no-store");

    await agent.post("/api/auth/logout").expect(200);
    expect((await agent.get("/api/auth/me").expect(200)).body.data.user).toBeNull();
    await agent.get("/api/wishlist").expect(401);
  });

  it("gives the same answer for a wrong password and an unknown email", async () => {
    const email = await createUser("user");
    const wrong = await supertest(app).post("/api/auth/login").send({ email, password: "wrong-password-9" }).expect(401);
    const unknown = await supertest(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.test", password: "wrong-password-9" })
      .expect(401);
    expect(wrong.body).toEqual(unknown.body);
    expect(sessionCookie(wrong)).toBeUndefined();
  });

  it("rejects a forged session cookie", async () => {
    const res = await supertest(app).get("/api/auth/me").set("Cookie", `${SESSION_COOKIE}=forged`).expect(200);
    expect(res.body.data.user).toBeNull();
    await supertest(app).get("/api/wishlist").set("Cookie", `${SESSION_COOKIE}=forged`).expect(401);
  });

  it("rate-limits repeated attempts", async () => {
    const limited = supertest(makeApp({ AUTH_RATE_LIMIT_MAX: "3" }));
    const attempt = () => limited.post("/api/auth/login").send({ email: "x@example.test", password: "whatever-123" });
    for (let i = 0; i < 3; i++) await attempt().expect(401);
    const res = await attempt().expect(429);
    expect(res.body.error.code).toBe("RATE_LIMITED");
  });
});

describe("request hardening", () => {
  it("rejects malformed JSON and non-JSON bodies", async () => {
    const malformed = await supertest(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email": ')
      .expect(400);
    expect(malformed.body.error.code).toBe("MALFORMED_REQUEST");
    await supertest(app).post("/api/auth/login").type("form").send("email=a&password=b").expect(415);
  });

  it("blocks state-changing requests from other origins (CSRF)", async () => {
    await supertest(app).post("/api/auth/register").set("Origin", "https://evil.example").send(valid).expect(403);
    await supertest(app).post("/api/auth/register").set("Sec-Fetch-Site", "cross-site").send(valid).expect(403);
    await supertest(app).post("/api/auth/register").set("Origin", ORIGIN).send(valid).expect(201);
  });

  it("only allows CORS for the configured frontend origin", async () => {
    const allowed = await supertest(app).options("/api/products").set("Origin", ORIGIN).set("Access-Control-Request-Method", "GET");
    expect(allowed.headers["access-control-allow-origin"]).toBe(ORIGIN);
    const other = await supertest(app).options("/api/products").set("Origin", "https://evil.example").set("Access-Control-Request-Method", "GET");
    expect(other.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

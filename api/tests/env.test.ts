import { describe, expect, it } from "vitest";

import { loadEnv } from "../src/config/env.ts";

describe("loadEnv", () => {
  it("accepts local and Atlas URIs", () => {
    expect(loadEnv({ MONGODB_URI: "mongodb://127.0.0.1:27017/pricepilot" }).MONGODB_URI).toContain("127.0.0.1");
    expect(() => loadEnv({ MONGODB_URI: "mongodb+srv://app:s3cret@cluster0.example.mongodb.net/pricepilot" })).not.toThrow();
  });

  it("explains when the Atlas placeholders haven't been replaced", () => {
    expect(() =>
      loadEnv({ MONGODB_URI: "mongodb+srv://<db_username>:<db_password>@cluster0.example.mongodb.net/pricepilot" }),
    ).toThrow(/placeholder such as <db_password>/);
  });

  it("rejects non-MongoDB URIs", () => {
    expect(() => loadEnv({ MONGODB_URI: "postgres://localhost/db" })).toThrow(/mongodb/);
  });
});

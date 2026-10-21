import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

import { productListQuerySchema } from "@pricepilot/contracts";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

import { connectDatabase } from "../src/db/connect.ts";
import { ProductModel } from "../src/models/product.model.ts";
import { buildProductDocuments } from "../src/seed/build.ts";
import { seedProducts } from "../src/seed/data.ts";
import { syntheticProducts } from "../src/seed/synthetic.ts";
import { listProducts } from "../src/services/product.service.ts";

/*
 * Catalog query benchmark: N deterministic products in a throwaway mongod,
 * each listing scenario run through the real service. Reports median latency
 * and, from the MongoDB profiler, what every DB operation actually did.
 *   node scripts/bench-catalog.ts [--products 20000] [--runs 25] [--out file.json]
 */

const { values } = parseArgs({
  options: {
    products: { type: "string", default: "20000" },
    runs: { type: "string", default: "25" },
    out: { type: "string" },
  },
});

const scenarios: Record<string, Record<string, string>> = {
  "default (newest)": {},
  "category filter": { category: "audio" },
  "category + price asc": { category: "audio", sort: "price-asc" },
  "price range": { minPrice: "5000", maxPrice: "20000", sort: "price-asc" },
  "brand + name sort": { brand: "Acme", sort: "name-asc" },
  "biggest drops": { sort: "drops" },
  "text search": { q: "speaker pro" },
  "deep page (40)": { page: "40" },
};

const mongo = await MongoMemoryServer.create();
await connectDatabase(mongo.getUri("bench"));
const n = Number(values.products);
const docs = buildProductDocuments([...seedProducts, ...syntheticProducts(n)]);
for (let i = 0; i < docs.length; i += 2000) {
  await ProductModel.insertMany(docs.slice(i, i + 2000), { timestamps: false, lean: true });
}
const db = mongoose.connection.db;
if (!db) throw new Error("no db");

const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;

type ProfileEntry = {
  op: string;
  command?: Record<string, unknown>;
  planSummary?: string;
  keysExamined?: number;
  docsExamined?: number;
  hasSortStage?: boolean;
  usedDisk?: boolean;
  millis?: number;
  nreturned?: number;
};

const results = [];
for (const [name, raw] of Object.entries(scenarios)) {
  const query = productListQuerySchema.parse(raw);
  // Warm up, then time.
  await listProducts(query);
  const times: number[] = [];
  for (let i = 0; i < Number(values.runs); i++) {
    const t = performance.now();
    await listProducts(query);
    times.push(performance.now() - t);
  }
  // One profiled run to see what each DB operation did.
  await db.collection("system.profile").drop().catch(() => undefined);
  await db.command({ profile: 2 });
  const { meta } = await listProducts(query);
  await db.command({ profile: 0 });
  const ops = (await db.collection<ProfileEntry>("system.profile").find({ ns: /products$/ }).toArray()).map((p) => ({
    command: Object.keys(p.command ?? {})[0] ?? p.op,
    plan: p.planSummary ?? "",
    keysExamined: p.keysExamined ?? 0,
    docsExamined: p.docsExamined ?? 0,
    inMemorySort: Boolean(p.hasSortStage),
    ms: p.millis ?? 0,
  }));
  results.push({ name, medianMs: Number(median(times).toFixed(1)), total: meta.total, dbOps: ops.length, ops });
}

const report = { products: n + seedProducts.length, runs: Number(values.runs), results };
if (values.out) writeFileSync(values.out, JSON.stringify(report, null, 2));
console.log(`\n${report.products} products, ${report.runs} runs each\n`);
for (const r of results) {
  console.log(`${r.name.padEnd(22)} median ${String(r.medianMs).padStart(7)} ms · ${r.dbOps} DB ops · total ${r.total}`);
  for (const o of r.ops) {
    console.log(
      `    ${o.command.padEnd(10)} ${o.plan.slice(0, 60).padEnd(60)} keys ${String(o.keysExamined).padStart(6)} docs ${String(o.docsExamined).padStart(6)}${o.inMemorySort ? " · IN-MEMORY SORT" : ""}`,
    );
  }
}

await mongoose.disconnect();
await mongo.stop();

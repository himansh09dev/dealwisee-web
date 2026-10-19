import { MongoMemoryServer } from "mongodb-memory-server";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    mongoUri: string;
  }
}

let server: MongoMemoryServer | undefined;

export async function setup(project: TestProject) {
  server = await MongoMemoryServer.create();
  project.provide("mongoUri", server.getUri());
}

export async function teardown() {
  await server?.stop();
}

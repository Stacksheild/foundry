import Fastify, { type FastifyInstance } from "fastify";
import { registerScanRoute } from "./routes/scan.js";
import { registerChatRoute } from "./routes/chat.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  app.get("/health", async () => ({ status: "ok" }));
  await app.register(registerScanRoute);
  await app.register(registerChatRoute);

  return app;
}

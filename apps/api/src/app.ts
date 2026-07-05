import Fastify, { type FastifyInstance } from "fastify";
import { registerScanRoute } from "./routes/scan.js";
import { registerChatRoute } from "./routes/chat.js";
import { registerSessionsRoutes } from "./routes/sessions.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  app.get("/health", async () => ({ status: "ok" }));
  await app.register(registerScanRoute);
  await app.register(registerChatRoute);
  await app.register(registerSessionsRoutes);

  return app;
}

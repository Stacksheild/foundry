import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { registerScanRoute } from "./routes/scan.js";
import { registerChatRoute } from "./routes/chat.js";
import { registerSessionsRoutes } from "./routes/sessions.js";
import { registerAppsRoutes } from "./routes/apps.js";
import { registerDeployRoute } from "./routes/deploy.js";
import { registerAuthHook } from "./authHook.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: process.env.FOUNDRY_CORS_ORIGIN
      ? process.env.FOUNDRY_CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean)
      : true,
  });
  registerAuthHook(app);

  app.get("/", async () => ({
    service: "foundry-api",
    status: "ok",
    hint: "This is Foundry's backend API. Endpoints require an Authorization: Bearer token — the demo UI at foundry-live-demo.vercel.app supplies it for you. Liveness: GET /health.",
  }));
  app.get("/health", async () => ({ status: "ok" }));
  await app.register(registerScanRoute);
  await app.register(registerChatRoute);
  await app.register(registerSessionsRoutes);
  await app.register(registerAppsRoutes);
  await app.register(registerDeployRoute);

  return app;
}

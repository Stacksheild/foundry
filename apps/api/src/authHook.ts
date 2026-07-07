import type { FastifyInstance } from "fastify";

/**
 * Requires `Authorization: Bearer <FOUNDRY_API_TOKEN>` on every request
 * except GET /health and CORS preflight — but only when FOUNDRY_API_TOKEN
 * is set. Unset (every local/dev run today) means zero behavior change.
 */
export function registerAuthHook(app: FastifyInstance): void {
  const token = process.env.FOUNDRY_API_TOKEN;
  if (!token) return;

  app.addHook("onRequest", async (request, reply) => {
    if (request.method === "OPTIONS") return;
    if (request.method === "GET" && request.url === "/health") return;
    if (request.headers.authorization !== `Bearer ${token}`) {
      reply.code(401).send({ error: "Unauthorized" });
    }
  });
}

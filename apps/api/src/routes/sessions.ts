import type { FastifyInstance } from "fastify";
import { getDb, listSessions, getSession } from "../db.js";

/** Read-only view over chat history persisted by routes/chat.ts. Same env gate. */
export async function registerSessionsRoutes(app: FastifyInstance): Promise<void> {
  if (process.env.FOUNDRY_ENABLE_AGENT !== "true") return;

  app.get("/build/sessions", async () => {
    return { sessions: listSessions(getDb()) };
  });

  app.get<{ Params: { id: string } }>("/build/sessions/:id", async (request, reply) => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id)) {
      return reply.code(400).send({ error: "id must be an integer" });
    }
    const result = getSession(getDb(), id);
    if (!result) return reply.code(404).send({ error: `No session with id ${id}` });
    return result;
  });
}

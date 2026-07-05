import type { FastifyInstance } from "fastify";
import {
  getDb,
  registerApp,
  listApps,
  getApp,
  updateApp,
  DuplicateAppError,
  type AppEnv,
  type AppStatus,
} from "@foundry/app-registry";

interface RegisterBody {
  name: string;
  env?: AppEnv;
  team?: string;
  version?: string;
}

interface UpdateBody {
  env?: AppEnv;
  status?: AppStatus;
  version?: string;
  url?: string;
  vmName?: string;
}

/** The real app registry — replaces the mock APPS_DATA concept apps/web's DashboardScreen renders. */
export async function registerAppsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/apps", async () => ({ apps: listApps(getDb()) }));

  app.post<{ Body: RegisterBody }>("/apps", async (request, reply) => {
    const { name, env, team, version } = request.body ?? ({} as RegisterBody);
    if (!name || typeof name !== "string") {
      return reply.code(400).send({ error: "body.name (string) is required" });
    }
    try {
      const record = registerApp(getDb(), { name, env, team, version });
      return reply.code(201).send(record);
    } catch (err) {
      if (err instanceof DuplicateAppError) {
        return reply.code(409).send({ error: err.message });
      }
      throw err;
    }
  });

  app.get<{ Params: { name: string } }>("/apps/:name", async (request, reply) => {
    const record = getApp(getDb(), request.params.name);
    if (!record) return reply.code(404).send({ error: `No app named "${request.params.name}"` });
    return record;
  });

  app.patch<{ Params: { name: string }; Body: UpdateBody }>("/apps/:name", async (request, reply) => {
    const record = updateApp(getDb(), request.params.name, request.body ?? {});
    if (!record) return reply.code(404).send({ error: `No app named "${request.params.name}"` });
    return record;
  });
}

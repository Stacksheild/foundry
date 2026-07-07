import type { FastifyInstance } from "fastify";
import { getDb, deployApp, AppNotFoundError } from "@foundry/app-registry";
import { createComputeProvider } from "@foundry/compute-providers";

interface DeployBody {
  cpu?: number;
  memory?: string;
  image?: string;
}

/** Provisions a real exe.dev VM for a registered app — the HTTP twin of `foundry deploy`. */
export async function registerDeployRoute(app: FastifyInstance): Promise<void> {
  app.post<{ Params: { name: string }; Body: DeployBody }>("/apps/:name/deploy", async (request, reply) => {
    const provider = createComputeProvider("exedev");
    try {
      const record = await deployApp(getDb(), provider, request.params.name, request.body ?? {});
      return record;
    } catch (err) {
      if (err instanceof AppNotFoundError) {
        return reply.code(404).send({ error: err.message });
      }
      return reply.code(422).send({ error: err instanceof Error ? err.message : "Deploy failed" });
    }
  });
}

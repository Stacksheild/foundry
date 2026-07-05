import type { FastifyInstance } from "fastify";
import { runScan, type Severity } from "@foundry/scanner-service";

interface ScanBody {
  path: string;
  minSeverity?: Severity;
}

// NOTE: `path` is an arbitrary filesystem path with no allowlist — fine for a
// local dev tool, unsafe to expose on a multi-tenant/public deployment without
// restricting it to a configured workspace root first.
export async function registerScanRoute(app: FastifyInstance): Promise<void> {
  app.post<{ Body: ScanBody }>("/scan", async (request, reply) => {
    const { path, minSeverity } = request.body ?? ({} as ScanBody);
    if (!path || typeof path !== "string") {
      return reply.code(400).send({ error: "body.path (string) is required" });
    }
    try {
      const results = runScan(path, { minSeverity });
      return { results };
    } catch (err) {
      app.log.error(err);
      return reply.code(422).send({
        error: err instanceof Error ? err.message : "scan failed",
      });
    }
  });
}

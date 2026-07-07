import type { DatabaseSync } from "node:sqlite";
import type { ComputeProvider } from "@foundry/compute-providers";
import { getApp, updateApp, type AppRecord } from "./db.js";

export interface DeployOptions {
  cpu?: number;
  memory?: string;
  image?: string;
}

export class AppNotFoundError extends Error {
  constructor(name: string) {
    super(`No app named "${name}"`);
    this.name = "AppNotFoundError";
  }
}

/**
 * Provisions a real compute-provider VM for a registered app, destroying
 * any previous VM first (redeploy = fresh sandbox, matching exe.dev's
 * disposable-VM model). Shared by `foundry deploy` and
 * `POST /apps/:name/deploy` so the two never drift.
 */
export async function deployApp(
  db: DatabaseSync,
  provider: ComputeProvider,
  name: string,
  opts: DeployOptions = {},
): Promise<AppRecord> {
  const app = getApp(db, name);
  if (!app) throw new AppNotFoundError(name);

  updateApp(db, name, { status: "deploying" });

  if (app.vmName) {
    await provider.destroy(app.vmName).catch(() => {
      // best-effort: a stale/already-destroyed VM shouldn't block a redeploy
    });
  }

  try {
    const vm = await provider.create({ name, cpu: opts.cpu, memory: opts.memory, image: opts.image });
    const updated = updateApp(db, name, { status: "healthy", url: vm.httpsUrl, vmName: vm.name });
    if (!updated) throw new Error(`Failed to update app "${name}" after deploy`);
    return updated;
  } catch (err) {
    updateApp(db, name, { status: "error" });
    throw err;
  }
}

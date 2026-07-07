# Real Demoable Environment (Vercel + exe.dev) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Dashboard screen's app list and per-row "Deploy" button real — backed by `apps/api`'s live SQLite registry and real exe.dev VM provisioning — in a new, access-controlled Vercel environment, without touching the public static demo.

**Architecture:** A shared `deployApp()` orchestration function (destroy-old/create-new/update-registry) lives in `packages/app-registry` and is called by both `foundry deploy` (CLI, refactored) and a new `POST /apps/:name/deploy` route on `apps/api`. `apps/api` gets a token-gated auth hook and CORS, and will run persistently on its own exe.dev VM. `packages/ui`'s `DashboardScreen` gains an optional `apiBaseUrl`/`apiToken` prop pair, threaded from `apps/web`'s Vite env vars, that switches it from static mock data to real fetch calls — unset, it's pixel-identical to today.

**Tech Stack:** TypeScript, Fastify 5, `node:sqlite`, `@fastify/cors`, React 18, Vite 5, Vitest, `@testing-library/react`, exe.dev HTTPS API.

## Global Constraints

- Setting no new env var must change existing behavior: `FOUNDRY_API_TOKEN` unset → no auth check; `apiBaseUrl` prop unset → `DashboardScreen` renders `APPS_DATA` exactly as today; `FOUNDRY_DEMO_USERNAME`/`FOUNDRY_DEMO_PASSWORD` unset → `middleware.ts` is a no-op.
- No changes to the public `foundry` Vercel project, its build config, or `DeployScreen.tsx` (the canary pipeline page).
- Every new/changed piece of backend logic gets a `vitest` test using this repo's existing patterns (`app.inject()` for routes, `vi.mock` for `@foundry/compute-providers`, `:memory:` DB paths).
- Full `pnpm build && pnpm typecheck && pnpm lint && pnpm test` must stay green after every task.

---

### Task 1: Shared `deployApp()` orchestration in `packages/app-registry`

**Files:**
- Create: `packages/app-registry/src/deploy.ts`
- Create: `packages/app-registry/src/__tests__/deploy.test.ts`
- Modify: `packages/app-registry/src/index.ts`
- Modify: `packages/app-registry/package.json` (new dependency on `@foundry/compute-providers`)

**Interfaces:**
- Consumes: `getApp(db, name)`, `updateApp(db, name, input)`, `type AppRecord` from `./db.js` (all already exist); `type ComputeProvider` from `@foundry/compute-providers` (already exists, `create(spec): Promise<VmInfo>` / `destroy(name): Promise<void>`).
- Produces: `deployApp(db, provider, name, opts?): Promise<AppRecord>` and `class AppNotFoundError extends Error` — Task 2 (API route) and Task 3's CLI refactor both call these by exact name.

- [ ] **Step 1: Add the workspace dependency**

Run: `pnpm --filter @foundry/app-registry add @foundry/compute-providers@workspace:*`
Expected: `packages/app-registry/package.json`'s `dependencies` now includes `"@foundry/compute-providers": "workspace:*"`.

- [ ] **Step 2: Write the failing test**

Create `packages/app-registry/src/__tests__/deploy.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { openDb } from "../db.js";
import { registerApp, getApp } from "../db.js";
import { deployApp, AppNotFoundError } from "../deploy.js";
import type { ComputeProvider } from "@foundry/compute-providers";

function mockProvider(): ComputeProvider {
  return { name: "exedev", create: vi.fn(), list: vi.fn(), destroy: vi.fn() };
}

describe("deployApp", () => {
  let db: ReturnType<typeof openDb>;
  let provider: ComputeProvider;

  beforeEach(() => {
    db = openDb(":memory:");
    provider = mockProvider();
  });

  it("throws AppNotFoundError for an unregistered app, without calling create", async () => {
    await expect(deployApp(db, provider, "missing")).rejects.toThrow(AppNotFoundError);
    expect(provider.create).not.toHaveBeenCalled();
  });

  it("creates a VM and updates the registry with status/url/vmName", async () => {
    registerApp(db, { name: "deploy-svc" });
    vi.mocked(provider.create).mockResolvedValue({
      name: "deploy-svc",
      httpsUrl: "https://deploy-svc.exe.xyz",
      region: "lon",
      status: "running",
      sshDest: "deploy-svc.exe.xyz",
    });

    const result = await deployApp(db, provider, "deploy-svc", { cpu: 2 });

    expect(provider.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: "deploy-svc", cpu: 2 }),
    );
    expect(result).toMatchObject({ status: "healthy", url: "https://deploy-svc.exe.xyz", vmName: "deploy-svc" });
    expect(getApp(db, "deploy-svc")).toMatchObject({ status: "healthy" });
  });

  it("destroys the previous VM before creating a fresh one on redeploy", async () => {
    registerApp(db, { name: "redeploy-svc" });
    vi.mocked(provider.create).mockResolvedValue({
      name: "redeploy-svc",
      httpsUrl: "https://redeploy-svc.exe.xyz",
      region: "lon",
      status: "running",
      sshDest: "redeploy-svc.exe.xyz",
    });
    await deployApp(db, provider, "redeploy-svc");
    vi.mocked(provider.destroy).mockClear();
    vi.mocked(provider.create).mockClear();

    vi.mocked(provider.create).mockResolvedValue({
      name: "redeploy-svc",
      httpsUrl: "https://redeploy-svc-2.exe.xyz",
      region: "lon",
      status: "running",
      sshDest: "redeploy-svc-2.exe.xyz",
    });
    await deployApp(db, provider, "redeploy-svc");

    expect(provider.destroy).toHaveBeenCalledWith("redeploy-svc");
  });

  it("does not let a destroy failure block the redeploy", async () => {
    registerApp(db, { name: "stale-vm-svc" });
    vi.mocked(provider.create).mockResolvedValue({
      name: "stale-vm-svc",
      httpsUrl: "https://stale-vm-svc.exe.xyz",
      region: "lon",
      status: "running",
      sshDest: "stale-vm-svc.exe.xyz",
    });
    await deployApp(db, provider, "stale-vm-svc");
    vi.mocked(provider.destroy).mockRejectedValue(new Error("VM already gone"));

    const result = await deployApp(db, provider, "stale-vm-svc");
    expect(result.status).toBe("healthy");
  });

  it("marks the app as error and rethrows when provisioning fails", async () => {
    registerApp(db, { name: "fails-svc" });
    vi.mocked(provider.create).mockRejectedValue(new Error("EXE_DEV_TOKEN is not set"));

    await expect(deployApp(db, provider, "fails-svc")).rejects.toThrow("EXE_DEV_TOKEN is not set");
    expect(getApp(db, "fails-svc")?.status).toBe("error");
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm --filter @foundry/app-registry test`
Expected: FAIL — `Cannot find module '../deploy.js'` (the file doesn't exist yet).

- [ ] **Step 4: Write the implementation**

Create `packages/app-registry/src/deploy.ts`:

```ts
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
```

Modify `packages/app-registry/src/index.ts` — add the new export line after the existing `db.js` export block:

```ts
export {
  openDb,
  getDb,
  registerApp,
  listApps,
  getApp,
  updateApp,
  DuplicateAppError,
  type AppRecord,
  type AppEnv,
  type AppStatus,
  type RegisterAppInput,
  type UpdateAppInput,
} from "./db.js";
export { deployApp, AppNotFoundError, type DeployOptions } from "./deploy.js";
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @foundry/app-registry build && pnpm --filter @foundry/app-registry test`
Expected: PASS — 5 new tests green, plus the existing 7 `db.test.ts` tests still green.

- [ ] **Step 6: Typecheck and lint**

Run: `pnpm --filter @foundry/app-registry typecheck && pnpm --filter @foundry/app-registry lint`
Expected: both clean.

- [ ] **Step 7: Commit**

```bash
git add packages/app-registry/package.json packages/app-registry/src/deploy.ts packages/app-registry/src/index.ts packages/app-registry/src/__tests__/deploy.test.ts
git commit -m "Add shared deployApp() orchestration to app-registry"
```

---

### Task 2: Refactor `foundry deploy` (CLI) to use `deployApp()`

**Files:**
- Modify: `packages/cli/src/commands/deploy.ts`

**Interfaces:**
- Consumes: `deployApp(db, provider, name, opts): Promise<AppRecord>`, `AppNotFoundError` from `@foundry/app-registry` (Task 1); `createComputeProvider` from `@foundry/compute-providers` (existing).
- Produces: no change to the command's public CLI surface (`foundry deploy <name>` with `--cpu`/`--memory`/`--image`).

- [ ] **Step 1: Confirm the existing tests still describe the behavior you're preserving**

Run: `pnpm --filter @foundry/cli test -- -t "deploy command"`
Expected: PASS (4 existing tests, using the current implementation) — this is your baseline before refactoring.

- [ ] **Step 2: Replace the implementation**

Replace the full contents of `packages/cli/src/commands/deploy.ts`:

```ts
import { Command } from "commander";
import { getDb, deployApp, AppNotFoundError } from "@foundry/app-registry";
import { createComputeProvider } from "@foundry/compute-providers";

export const deployCommand = new Command("deploy")
  .description("Deploy a registered app to a real exe.dev sandbox VM")
  .argument("<name>", "App name (must already be registered via `foundry apps register`)")
  .option("--cpu <n>", "CPU cores for the VM")
  .option("--memory <size>", "e.g. 4GB")
  .option("--image <image>", "container image")
  .action(async (name: string, opts: { cpu?: string; memory?: string; image?: string }) => {
    const db = getDb();
    const provider = createComputeProvider("exedev");

    try {
      const app = await deployApp(db, provider, name, {
        cpu: opts.cpu ? Number(opts.cpu) : undefined,
        memory: opts.memory,
        image: opts.image,
      });
      console.log(`Deployed ${name} — ${app.url} (${app.status})`);
    } catch (err) {
      if (err instanceof AppNotFoundError) {
        console.error(`${err.message}. Run \`foundry apps register ${name}\` first.`);
      } else {
        console.error(`Deploy failed: ${err instanceof Error ? err.message : String(err)}`);
      }
      process.exitCode = 1;
    }
  });
```

- [ ] **Step 3: Run the existing deploy-command tests to verify they still pass unmodified**

Run: `pnpm --filter @foundry/cli build && pnpm --filter @foundry/cli test -- -t "deploy command"`
Expected: PASS — all 4 existing tests ("errors clearly when the app isn't registered", "provisions a VM...", "destroys the previous VM on redeploy", "marks the app as error...") pass against the refactored implementation with zero test changes.

- [ ] **Step 4: Full CLI test suite, typecheck, lint**

Run: `pnpm --filter @foundry/cli test && pnpm --filter @foundry/cli typecheck && pnpm --filter @foundry/cli lint`
Expected: all green (38 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/commands/deploy.ts
git commit -m "Refactor foundry deploy to use the shared deployApp() helper"
```

---

### Task 3: `POST /apps/:name/deploy` route on `apps/api`

**Files:**
- Create: `apps/api/src/routes/deploy.ts`
- Create: `apps/api/src/__tests__/deploy-route.test.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/package.json` (new dependency on `@foundry/compute-providers`)

**Interfaces:**
- Consumes: `deployApp`, `AppNotFoundError` from `@foundry/app-registry` (Task 1); `createComputeProvider` from `@foundry/compute-providers`; `getDb` from `@foundry/app-registry` (already used by `routes/apps.ts`).
- Produces: `registerDeployRoute(app: FastifyInstance): Promise<void>` — registered in `app.ts` alongside the other route registrars.

- [ ] **Step 1: Add the workspace dependency**

Run: `pnpm --filter @foundry/api add @foundry/compute-providers@workspace:*`
Expected: `apps/api/package.json`'s `dependencies` now includes `"@foundry/compute-providers": "workspace:*"`.

- [ ] **Step 2: Write the failing test**

Create `apps/api/src/__tests__/deploy-route.test.ts`:

```ts
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";

const mockProvider = { name: "exedev", create: vi.fn(), list: vi.fn(), destroy: vi.fn() };

vi.mock("@foundry/compute-providers", () => ({
  createComputeProvider: vi.fn(() => mockProvider),
}));

describe("POST /apps/:name/deploy", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    process.env.FOUNDRY_REGISTRY_DB_PATH = ":memory:";
    app = await buildApp();
  });

  afterAll(async () => {
    delete process.env.FOUNDRY_REGISTRY_DB_PATH;
    await app.close();
  });

  beforeEach(() => {
    mockProvider.create.mockReset();
    mockProvider.destroy.mockReset();
  });

  it("returns 404 for an unregistered app", async () => {
    const res = await app.inject({ method: "POST", url: "/apps/does-not-exist/deploy" });
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toContain("No app named");
  });

  it("provisions a VM and returns the updated record", async () => {
    await app.inject({ method: "POST", url: "/apps", payload: { name: "web-deploy-svc" } });
    mockProvider.create.mockResolvedValue({
      name: "web-deploy-svc",
      httpsUrl: "https://web-deploy-svc.exe.xyz",
      region: "lon",
      status: "running",
      sshDest: "web-deploy-svc.exe.xyz",
    });

    const res = await app.inject({ method: "POST", url: "/apps/web-deploy-svc/deploy" });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      status: "healthy",
      url: "https://web-deploy-svc.exe.xyz",
      vmName: "web-deploy-svc",
    });
  });

  it("returns 422 with the provider's error message when provisioning fails", async () => {
    await app.inject({ method: "POST", url: "/apps", payload: { name: "web-fails-svc" } });
    mockProvider.create.mockRejectedValue(new Error("Choose a plan to start creating VMs."));

    const res = await app.inject({ method: "POST", url: "/apps/web-fails-svc/deploy" });

    expect(res.statusCode).toBe(422);
    expect(res.json().error).toBe("Choose a plan to start creating VMs.");
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm --filter @foundry/api test -- deploy-route`
Expected: FAIL — 404 on all three requests (route doesn't exist yet).

- [ ] **Step 4: Write the route**

Create `apps/api/src/routes/deploy.ts`:

```ts
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
```

Modify `apps/api/src/app.ts` — add the import and registration:

```ts
import Fastify, { type FastifyInstance } from "fastify";
import { registerScanRoute } from "./routes/scan.js";
import { registerChatRoute } from "./routes/chat.js";
import { registerSessionsRoutes } from "./routes/sessions.js";
import { registerAppsRoutes } from "./routes/apps.js";
import { registerDeployRoute } from "./routes/deploy.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  app.get("/health", async () => ({ status: "ok" }));
  await app.register(registerScanRoute);
  await app.register(registerChatRoute);
  await app.register(registerSessionsRoutes);
  await app.register(registerAppsRoutes);
  await app.register(registerDeployRoute);

  return app;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @foundry/api build && pnpm --filter @foundry/api test -- deploy-route`
Expected: PASS — 3 new tests green.

- [ ] **Step 6: Full apps/api test suite, typecheck, lint**

Run: `pnpm --filter @foundry/api test && pnpm --filter @foundry/api typecheck && pnpm --filter @foundry/api lint`
Expected: all green (25 tests total: 22 existing + 3 new).

- [ ] **Step 7: Commit**

```bash
git add apps/api/package.json apps/api/src/app.ts apps/api/src/routes/deploy.ts apps/api/src/__tests__/deploy-route.test.ts
git commit -m "Add POST /apps/:name/deploy route to apps/api"
```

---

### Task 4: `FOUNDRY_API_TOKEN` auth hook on `apps/api`

**Files:**
- Create: `apps/api/src/authHook.ts`
- Create: `apps/api/src/__tests__/auth-hook.test.ts`
- Modify: `apps/api/src/app.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `registerAuthHook(app: FastifyInstance): void` — called once from `buildApp()`, before any route is registered.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/__tests__/auth-hook.test.ts`:

```ts
import { describe, it, expect, afterEach } from "vitest";
import { buildApp } from "../app.js";

describe("FOUNDRY_API_TOKEN gating", () => {
  afterEach(() => {
    delete process.env.FOUNDRY_API_TOKEN;
  });

  it("does not require a token when FOUNDRY_API_TOKEN is unset", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/apps" });
    expect(res.statusCode).toBe(200);
    await app.close();
  });

  it("rejects missing/wrong tokens and allows the right one when set", async () => {
    process.env.FOUNDRY_API_TOKEN = "secret123";
    const app = await buildApp();

    const noAuth = await app.inject({ method: "GET", url: "/apps" });
    expect(noAuth.statusCode).toBe(401);

    const wrongAuth = await app.inject({ method: "GET", url: "/apps", headers: { authorization: "Bearer wrong" } });
    expect(wrongAuth.statusCode).toBe(401);

    const rightAuth = await app.inject({
      method: "GET",
      url: "/apps",
      headers: { authorization: "Bearer secret123" },
    });
    expect(rightAuth.statusCode).toBe(200);

    await app.close();
  });

  it("never gates GET /health, even when a token is set", async () => {
    process.env.FOUNDRY_API_TOKEN = "secret123";
    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    await app.close();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @foundry/api test -- auth-hook`
Expected: FAIL — the second test fails because nothing returns 401 yet.

- [ ] **Step 3: Write the hook**

Create `apps/api/src/authHook.ts`:

```ts
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
```

Modify `apps/api/src/app.ts` — add the import and call it before any route registration:

```ts
import Fastify, { type FastifyInstance } from "fastify";
import { registerScanRoute } from "./routes/scan.js";
import { registerChatRoute } from "./routes/chat.js";
import { registerSessionsRoutes } from "./routes/sessions.js";
import { registerAppsRoutes } from "./routes/apps.js";
import { registerDeployRoute } from "./routes/deploy.js";
import { registerAuthHook } from "./authHook.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  registerAuthHook(app);

  app.get("/health", async () => ({ status: "ok" }));
  await app.register(registerScanRoute);
  await app.register(registerChatRoute);
  await app.register(registerSessionsRoutes);
  await app.register(registerAppsRoutes);
  await app.register(registerDeployRoute);

  return app;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @foundry/api test -- auth-hook`
Expected: PASS — 3 tests green.

- [ ] **Step 5: Full apps/api test suite, typecheck, lint**

Run: `pnpm --filter @foundry/api test && pnpm --filter @foundry/api typecheck && pnpm --filter @foundry/api lint`
Expected: all green (28 tests total).

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/authHook.ts apps/api/src/app.ts apps/api/src/__tests__/auth-hook.test.ts
git commit -m "Add optional FOUNDRY_API_TOKEN bearer-auth gate to apps/api"
```

---

### Task 5: CORS on `apps/api`

**Files:**
- Modify: `apps/api/src/app.ts`
- Create: `apps/api/src/__tests__/cors.test.ts`
- Modify: `apps/api/package.json` (new dependency on `@fastify/cors`)

**Interfaces:**
- Consumes: `@fastify/cors`'s default export (a Fastify plugin).
- Produces: no new exports; `buildApp()`'s behavior gains CORS headers.

- [ ] **Step 1: Add the dependency**

Run: `pnpm --filter @foundry/api add @fastify/cors`
Expected: `apps/api/package.json`'s `dependencies` now includes `@fastify/cors`.

- [ ] **Step 2: Write the failing test**

Create `apps/api/src/__tests__/cors.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildApp } from "../app.js";

describe("CORS", () => {
  it("reflects the request origin with an allow-origin header", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/apps",
      headers: { origin: "https://foundry-live-demo.vercel.app" },
    });
    expect(res.headers["access-control-allow-origin"]).toBe("https://foundry-live-demo.vercel.app");
    await app.close();
  });

  it("answers an OPTIONS preflight without requiring a bearer token", async () => {
    process.env.FOUNDRY_API_TOKEN = "secret123";
    const app = await buildApp();
    const res = await app.inject({
      method: "OPTIONS",
      url: "/apps/some-app/deploy",
      headers: {
        origin: "https://foundry-live-demo.vercel.app",
        "access-control-request-method": "POST",
      },
    });
    expect(res.statusCode).toBeLessThan(300);
    delete process.env.FOUNDRY_API_TOKEN;
    await app.close();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm --filter @foundry/api test -- cors`
Expected: FAIL — no `access-control-allow-origin` header exists yet.

- [ ] **Step 4: Register the plugin**

Modify `apps/api/src/app.ts` — add the import and register it first, before `registerAuthHook`, so CORS preflight requests are answered before the auth hook ever runs:

```ts
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
    origin: process.env.FOUNDRY_CORS_ORIGIN ? process.env.FOUNDRY_CORS_ORIGIN.split(",") : true,
  });
  registerAuthHook(app);

  app.get("/health", async () => ({ status: "ok" }));
  await app.register(registerScanRoute);
  await app.register(registerChatRoute);
  await app.register(registerSessionsRoutes);
  await app.register(registerAppsRoutes);
  await app.register(registerDeployRoute);

  return app;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @foundry/api test -- cors`
Expected: PASS — 2 tests green.

- [ ] **Step 6: Full apps/api test suite, typecheck, lint**

Run: `pnpm --filter @foundry/api test && pnpm --filter @foundry/api typecheck && pnpm --filter @foundry/api lint`
Expected: all green (30 tests total).

- [ ] **Step 7: Commit**

```bash
git add apps/api/package.json apps/api/src/app.ts apps/api/src/__tests__/cors.test.ts
git commit -m "Add CORS support to apps/api, scoped via FOUNDRY_CORS_ORIGIN"
```

---

### Task 6: `formatRelativeTime` helper + `AppRecord.url` field in `packages/ui`

**Files:**
- Create: `packages/ui/src/lib/relativeTime.ts`
- Create: `packages/ui/src/__tests__/relativeTime.test.ts`
- Modify: `packages/ui/src/types.ts`

**Interfaces:**
- Produces: `formatRelativeTime(iso: string): string` — consumed by Task 7's `DashboardScreen` changes. `AppRecord` gains `url?: string`.

- [ ] **Step 1: Write the failing test**

Create `packages/ui/src/__tests__/relativeTime.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { formatRelativeTime } from "../lib/relativeTime";

describe("formatRelativeTime", () => {
  it("formats a timestamp seconds ago as \"just now\"", () => {
    const now = new Date().toISOString().replace("T", " ").replace(/\.\d+Z$/, "");
    expect(formatRelativeTime(now)).toBe("just now");
  });

  it("formats a timestamp minutes ago", () => {
    const tenMinAgo = new Date(Date.now() - 10 * 60_000).toISOString().replace("T", " ").replace(/\.\d+Z$/, "");
    expect(formatRelativeTime(tenMinAgo)).toBe("10m ago");
  });

  it("formats a timestamp hours ago", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3_600_000).toISOString().replace("T", " ").replace(/\.\d+Z$/, "");
    expect(formatRelativeTime(threeHoursAgo)).toBe("3h ago");
  });

  it("formats a timestamp days ago", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000).toISOString().replace("T", " ").replace(/\.\d+Z$/, "");
    expect(formatRelativeTime(twoDaysAgo)).toBe("2d ago");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @foundry/ui test -- relativeTime`
Expected: FAIL — `Cannot find module '../lib/relativeTime'`.

- [ ] **Step 3: Write the implementation**

Create `packages/ui/src/lib/relativeTime.ts`:

```ts
/**
 * apps/api's registry stores SQLite `datetime('now')` timestamps: UTC,
 * space-separated ("2026-07-06 06:44:04"), no timezone suffix — append "Z"
 * after swapping the space for "T" so `Date` parses it as UTC instead of
 * local time.
 */
export function formatRelativeTime(sqliteTimestamp: string): string {
  const then = new Date(`${sqliteTimestamp.replace(" ", "T")}Z`).getTime();
  const minutes = Math.floor((Date.now() - then) / 60_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
```

Modify `packages/ui/src/types.ts` — add `url?: string;` to `AppRecord`:

```ts
export interface AppRecord {
  id: number;
  name: string;
  env: AppEnv;
  status: AppStatus;
  deploy: string;
  team: string;
  ver: string;
  url?: string;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @foundry/ui test -- relativeTime`
Expected: PASS — 4 tests green.

- [ ] **Step 5: Full packages/ui test suite, typecheck, lint**

Run: `pnpm --filter @foundry/ui test && pnpm --filter @foundry/ui typecheck && pnpm --filter @foundry/ui lint`
Expected: all green (8 tests total: 4 existing `screens.test.tsx` + 4 new).

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/lib/relativeTime.ts packages/ui/src/__tests__/relativeTime.test.ts packages/ui/src/types.ts
git commit -m "Add formatRelativeTime helper and optional AppRecord.url field"
```

---

### Task 7: Wire `DashboardScreen` to real data when `apiBaseUrl` is set

**Files:**
- Modify: `packages/ui/src/screens/DashboardScreen.tsx`
- Modify: `packages/ui/src/__tests__/screens.test.tsx`

**Interfaces:**
- Consumes: `formatRelativeTime` from `../lib/relativeTime` (Task 6); `AppRecord`, `AppEnv` from `../types` (existing, extended in Task 6).
- Produces: `DashboardScreen` now accepts optional `apiBaseUrl?: string` and `apiToken?: string` props — consumed by Task 8's `App.tsx` change.

- [ ] **Step 1: Write the failing tests**

Modify `packages/ui/src/__tests__/screens.test.tsx` — replace the existing `describe("DashboardScreen", ...)` block with:

```tsx
describe("DashboardScreen", () => {
  it("renders the mocked applications table when apiBaseUrl is not set", () => {
    render(<DashboardScreen setScreen={vi.fn()} setNavActive={vi.fn()} />);
    expect(screen.getByText("My Applications")).toBeTruthy();
    expect(screen.getByText("team-productivity-dash")).toBeTruthy();
    expect(screen.getByText("6 apps · 4 production · 1 staging · 1 dev")).toBeTruthy();
  });

  it("fetches and renders real apps when apiBaseUrl is set", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        apps: [
          {
            id: 1,
            name: "live-app",
            env: "dev",
            status: "healthy",
            version: "0.2.0",
            team: "Platform",
            url: "https://live-app.exe.xyz",
            vmName: "live-app",
            createdAt: "2026-07-06 06:00:00",
            updatedAt: "2026-07-06 06:00:00",
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<DashboardScreen setScreen={vi.fn()} setNavActive={vi.fn()} apiBaseUrl="https://api.example.com" apiToken="tok" />);

    expect(await screen.findByText("live-app")).toBeTruthy();
    expect(screen.getByText("https://live-app.exe.xyz")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/apps",
      expect.objectContaining({ headers: { Authorization: "Bearer tok" } }),
    );

    vi.unstubAllGlobals();
  });

  it("calls the real deploy endpoint and updates the row on click", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          apps: [
            {
              id: 1,
              name: "live-app",
              env: "dev",
              status: "healthy",
              version: "0.2.0",
              team: "Platform",
              url: null,
              vmName: null,
              createdAt: "2026-07-06 06:00:00",
              updatedAt: "2026-07-06 06:00:00",
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 1,
          name: "live-app",
          env: "dev",
          status: "healthy",
          version: "0.2.0",
          team: "Platform",
          url: "https://live-app.exe.xyz",
          vmName: "live-app",
          createdAt: "2026-07-06 06:00:00",
          updatedAt: "2026-07-06 06:05:00",
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<DashboardScreen setScreen={vi.fn()} setNavActive={vi.fn()} apiBaseUrl="https://api.example.com" />);
    await screen.findByText("live-app");

    fireEvent.click(screen.getByRole("button", { name: "Deploy" }));

    expect(await screen.findByText("https://live-app.exe.xyz")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith("https://api.example.com/apps/live-app/deploy", expect.objectContaining({ method: "POST" }));

    vi.unstubAllGlobals();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @foundry/ui test -- screens`
Expected: FAIL — `DashboardScreen` doesn't accept `apiBaseUrl`/`apiToken` yet and never calls `fetch`.

- [ ] **Step 3: Write the implementation**

Replace the full contents of `packages/ui/src/screens/DashboardScreen.tsx`:

```tsx
import { useCallback, useEffect, useState } from "react";
import { tokens as T } from "../tokens";
import { Icon } from "../icons";
import { StatusBadge } from "../components/StatusBadge";
import { APPS_DATA } from "../data/apps";
import { formatRelativeTime } from "../lib/relativeTime";
import type { AppEnv, AppRecord, ScreenId } from "../types";

interface ApiAppRecord {
  id: number;
  name: string;
  env: AppEnv;
  status: AppRecord["status"];
  version: string;
  team: string | null;
  url: string | null;
  vmName: string | null;
  createdAt: string;
  updatedAt: string;
}

function toUiRecord(r: ApiAppRecord): AppRecord {
  return {
    id: r.id,
    name: r.name,
    env: r.env,
    status: r.status,
    deploy: formatRelativeTime(r.updatedAt),
    team: r.team ?? "—",
    ver: r.version,
    url: r.url ?? undefined,
  };
}

export const DashboardScreen = ({
  setScreen,
  setNavActive,
  apiBaseUrl,
  apiToken,
}: {
  setScreen: (s: ScreenId) => void;
  setNavActive: (id: string) => void;
  apiBaseUrl?: string;
  apiToken?: string;
}) => {
  const [apps, setApps] = useState<AppRecord[]>(APPS_DATA);

  const authHeaders = apiToken ? { Authorization: `Bearer ${apiToken}` } : undefined;

  const refetch = useCallback(async () => {
    if (!apiBaseUrl) return;
    try {
      const res = await fetch(`${apiBaseUrl}/apps`, { headers: authHeaders });
      const data = (await res.json()) as { apps: ApiAppRecord[] };
      setApps(data.apps.map(toUiRecord));
    } catch {
      // leave the previous list in place on a failed refresh
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBaseUrl, apiToken]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleDeploy = useCallback(
    async (name: string) => {
      if (!apiBaseUrl) {
        setScreen("deploy");
        setNavActive("deployments");
        return;
      }
      setApps((prev) => prev.map((a) => (a.name === name ? { ...a, status: "deploying" } : a)));
      try {
        const res = await fetch(`${apiBaseUrl}/apps/${name}/deploy`, { method: "POST", headers: authHeaders });
        const body = (await res.json()) as ApiAppRecord & { error?: string };
        if (!res.ok) throw new Error(body.error ?? "Deploy failed");
        setApps((prev) => prev.map((a) => (a.name === name ? toUiRecord(body) : a)));
      } catch {
        setApps((prev) => prev.map((a) => (a.name === name ? { ...a, status: "error" } : a)));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiBaseUrl, apiToken, setScreen, setNavActive],
  );

  const counts = apps.reduce<Record<string, number>>((acc, a) => {
    acc[a.env] = (acc[a.env] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "24px 32px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 11, color: T.textFaint, marginBottom: 4 }}>
            Foundry / <span style={{ color: T.accent }}>my-workspace</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>My Applications</h1>
          <p style={{ color: T.textSub, fontSize: 13.5, marginTop: 3 }}>
            {apps.length} apps · {counts.production ?? 0} production · {counts.staging ?? 0} staging · {counts.dev ?? 0} dev
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn-ghost"
            onClick={refetch}
            style={{
              padding: "8px 14px",
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              fontSize: 13.5,
              color: T.text,
              background: T.bg,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="refresh" size={13} color={T.textSub} /> Refresh
          </button>
          <button
            onClick={() => setScreen("home")}
            style={{
              padding: "8px 16px",
              background: T.accent,
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 13.5,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            <Icon name="plus" size={13} color="#fff" /> New App
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        {[
          { l: "Deploy Frequency", v: "4.2 / day", d: "+12%", i: "deploy" as const },
          { l: "Avg Lead Time", v: "3.1 hrs", d: "−18%", i: "pulse" as const },
          { l: "Error Rate", v: "1.2%", d: "−0.4%", i: "warn" as const },
          { l: "Apps Healthy", v: "5 / 6", d: "83%", i: "check" as const },
        ].map((m, i) => (
          <div key={i} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ fontSize: 11.5, color: T.textFaint, marginBottom: 7, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name={m.i} size={12} color={T.textFaint} /> {m.l}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{m.v}</div>
            <div style={{ fontSize: 11.5, color: T.success, marginTop: 4 }}>{m.d} vs last week</div>
          </div>
        ))}
      </div>

      <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.8fr 110px 100px 120px 1fr 130px",
            padding: "10px 20px",
            borderBottom: `1px solid ${T.border}`,
            fontSize: 11.5,
            fontWeight: 700,
            color: T.textFaint,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          <span>Application</span>
          <span>Status</span>
          <span>Env</span>
          <span>Last Deploy</span>
          <span>URL</span>
          <span></span>
        </div>
        {apps.map((app, i) => (
          <div
            key={app.id}
            className="row-hover"
            style={{
              display: "grid",
              gridTemplateColumns: "1.8fr 110px 100px 120px 1fr 130px",
              padding: "12px 20px",
              borderBottom: i < apps.length - 1 ? `1px solid ${T.border}` : "none",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5, fontFamily: "monospace", color: T.text }}>{app.name}</div>
              <div style={{ fontSize: 11.5, color: T.textFaint, marginTop: 1 }}>
                v{app.ver} · {app.team}
              </div>
            </div>
            <StatusBadge status={app.status} />
            <span
              style={{
                padding: "3px 9px",
                borderRadius: 12,
                background: T.surface,
                border: `1px solid ${T.border}`,
                fontSize: 11.5,
                color: T.textSub,
                fontWeight: 500,
              }}
            >
              {app.env}
            </span>
            <span style={{ fontSize: 12.5, color: T.textSub }}>{app.deploy}</span>
            <span
              style={{
                fontSize: 12,
                color: T.accent,
                fontFamily: "monospace",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {app.url ?? `${app.name.substring(0, 12)}.foundry.app`}
            </span>
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <button
                onClick={() => handleDeploy(app.name)}
                style={{
                  padding: "5px 12px",
                  background: T.accentBg,
                  color: T.accent,
                  border: "none",
                  borderRadius: 5,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Deploy
              </button>
              <button
                style={{
                  padding: "5px 9px",
                  background: T.surface,
                  color: T.textSub,
                  border: `1px solid ${T.border}`,
                  borderRadius: 5,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                <Icon name="dots" size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Recent Activity</h2>
      <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
        {[
          { icon: "deploy" as const, msg: "customer-escalation-intel deployed to production", time: "1h ago", type: "success" as const },
          { icon: "deploy" as const, msg: "kpi-performance-tracker promotion: staging → production (in progress)", time: "5m ago", type: "active" as const },
          { icon: "warn" as const, msg: "feature-flag-dashboard · P95 latency spike detected (320ms)", time: "2h ago", type: "warn" as const },
          { icon: "deploy" as const, msg: "team-productivity-dash auto-rolled back v2.3.9 (health check failed)", time: "6h ago", type: "danger" as const },
          { icon: "sparkle" as const, msg: "Foundry Agent proposed a ticket from #analytics-support · 3 mentions", time: "3h ago", type: "info" as const },
        ].map((ev, i) => {
          const color = ev.type === "success" ? T.success : ev.type === "warn" ? T.warning : ev.type === "danger" ? T.danger : T.accent;
          const bg = ev.type === "success" ? T.successBg : ev.type === "warn" ? T.warningBg : ev.type === "danger" ? T.dangerBg : T.accentBg;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", borderBottom: i < 4 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={ev.icon} size={13} color={color} />
              </div>
              <span style={{ flex: 1, fontSize: 13, color: T.textMid }}>{ev.msg}</span>
              <span style={{ fontSize: 12, color: T.textFaint, flexShrink: 0 }}>{ev.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @foundry/ui test -- screens`
Expected: PASS — all `DashboardScreen` tests green (mocked-default, live-fetch, live-deploy).

- [ ] **Step 5: Full packages/ui test suite, typecheck, lint**

Run: `pnpm --filter @foundry/ui test && pnpm --filter @foundry/ui typecheck && pnpm --filter @foundry/ui lint`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/screens/DashboardScreen.tsx packages/ui/src/__tests__/screens.test.tsx
git commit -m "Wire DashboardScreen to real apps/api data and deploy when apiBaseUrl is set"
```

---

### Task 8: Thread `apiBaseUrl`/`apiToken` from `apps/web`'s env vars through `App.tsx`

**Files:**
- Modify: `packages/ui/src/App.tsx`
- Modify: `apps/web/src/main.tsx`
- Create: `apps/web/.env.example`

**Interfaces:**
- Consumes: `DashboardScreen`'s `apiBaseUrl`/`apiToken` props (Task 7).
- Produces: `App`'s public props grow from none to `{ apiBaseUrl?: string; apiToken?: string }`, both optional so every existing call site (including the public demo, which passes neither) is unaffected.

- [ ] **Step 1: Modify `App.tsx`**

Modify `packages/ui/src/App.tsx` — change the export signature and the `DashboardScreen` call site:

```tsx
export const App = ({ apiBaseUrl, apiToken }: { apiBaseUrl?: string; apiToken?: string } = {}) => {
```

(this replaces the existing `export const App = () => {` line)

And change:

```tsx
{screen === "dashboard" && <DashboardScreen setScreen={setScreen} setNavActive={setNavActive} />}
```

to:

```tsx
{screen === "dashboard" && (
  <DashboardScreen setScreen={setScreen} setNavActive={setNavActive} apiBaseUrl={apiBaseUrl} apiToken={apiToken} />
)}
```

- [ ] **Step 2: Modify `apps/web/src/main.tsx`**

Replace the full contents of `apps/web/src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { App } from "@foundry/ui";
import "@foundry/ui/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App apiBaseUrl={import.meta.env.VITE_API_BASE_URL} apiToken={import.meta.env.VITE_API_TOKEN} />
    <Analytics />
  </StrictMode>,
);
```

- [ ] **Step 3: Extend the Vite env typing**

Modify `apps/web/src/vite-env.d.ts` — replace its contents:

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

- [ ] **Step 4: Document the env vars**

Create `apps/web/.env.example`:

```
# Unset (the default, and what the public foundry-blond.vercel.app demo
# uses): the Dashboard renders static mock data, exactly as today.
#
# Set (for the private foundry-live-demo Vercel project): the Dashboard
# fetches the real apps/api registry and its Deploy button provisions
# real exe.dev VMs.
VITE_API_BASE_URL=
VITE_API_TOKEN=
```

- [ ] **Step 5: Build and verify the public-demo path is unaffected**

Run: `pnpm --filter @foundry/web build`
Expected: builds cleanly with no `VITE_API_BASE_URL` set, producing the same static output as before (no new env vars in this shell).

- [ ] **Step 6: Full workspace typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: all packages clean, including `apps/web` and `packages/ui`.

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/App.tsx apps/web/src/main.tsx apps/web/src/vite-env.d.ts apps/web/.env.example
git commit -m "Thread VITE_API_BASE_URL/VITE_API_TOKEN through App.tsx to DashboardScreen"
```

---

### Task 9: Basic Auth gate (`middleware.ts`) for `foundry-live-demo`

**Files:**
- Create: `middleware.ts` (repo root — Vercel Routing Middleware must live at
  the deployed project's root, which is the monorepo root here per the
  existing `vercel.json`'s `outputDirectory`/`buildCommand` pair; it is not
  inside `apps/web`).
- Create: `middleware.test.ts` (repo root, next to it).
- Create: `tsconfig.json` (repo root — nothing today typechecks a
  root-level file; this extends `tsconfig.base.json` and covers just these
  two files).
- Create: `vitest.config.ts` (repo root).
- Modify: root `package.json` — add `vitest` as a devDependency, and fold
  this file's typecheck/lint/test into the existing composite scripts.

**Interfaces:**
- Consumes: `FOUNDRY_DEMO_USERNAME`/`FOUNDRY_DEMO_PASSWORD` env vars — set
  only on the `foundry-live-demo` Vercel project (Task 11, Step 7). Unset
  everywhere else, including the public `foundry` project.
- Produces: a default-exported `middleware(request: Request): Response |
  undefined` Vercel Routing Middleware entrypoint plus a `config.matcher`
  that applies it to every route.

This file ships in the same commit/deploy as the public `foundry` project
(both projects build from this one repo), so — matching the
`FOUNDRY_API_TOKEN` pattern from Task 4 — it **must** be a no-op whenever
those two env vars are unset. That's what keeps the public demo untouched
per the plan's Global Constraints, without needing a second copy of
anything.

- [ ] **Step 1: Write the failing test**

Create `middleware.test.ts`:

```ts
import { describe, it, expect, afterEach } from "vitest";
import middleware from "./middleware.js";

describe("Basic Auth gate", () => {
  afterEach(() => {
    delete process.env.FOUNDRY_DEMO_USERNAME;
    delete process.env.FOUNDRY_DEMO_PASSWORD;
  });

  it("passes through when FOUNDRY_DEMO_USERNAME/PASSWORD are unset", () => {
    const res = middleware(new Request("https://example.com/"));
    expect(res).toBeUndefined();
  });

  it("rejects missing/wrong credentials and allows the right one when set", () => {
    process.env.FOUNDRY_DEMO_USERNAME = "demo";
    process.env.FOUNDRY_DEMO_PASSWORD = "secret123";

    const noAuth = middleware(new Request("https://example.com/"));
    expect(noAuth?.status).toBe(401);
    expect(noAuth?.headers.get("www-authenticate")).toContain("Basic");

    const wrongAuth = middleware(
      new Request("https://example.com/", {
        headers: { authorization: `Basic ${btoa("demo:wrong")}` },
      }),
    );
    expect(wrongAuth?.status).toBe(401);

    const rightAuth = middleware(
      new Request("https://example.com/", {
        headers: { authorization: `Basic ${btoa("demo:secret123")}` },
      }),
    );
    expect(rightAuth).toBeUndefined();
  });
});
```

- [ ] **Step 2: Add the test runner**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["*.test.ts"],
  },
});
```

Add `"vitest": "^3.0.0"` to root `package.json`'s (new) `devDependencies`,
run `pnpm install`, then run: `pnpm exec vitest run`
Expected: FAIL — `middleware.ts` doesn't exist yet.

- [ ] **Step 3: Write the middleware**

Create `middleware.ts`:

```ts
export default function middleware(request: Request): Response | undefined {
  const username = process.env.FOUNDRY_DEMO_USERNAME;
  const password = process.env.FOUNDRY_DEMO_PASSWORD;
  if (!username || !password) return undefined;

  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    const [user, pass] = atob(auth.slice("Basic ".length)).split(":");
    if (user === username && pass === password) return undefined;
  }

  return new Response("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="foundry-live-demo"' },
  });
}

export const config = {
  matcher: "/(.*)",
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run`
Expected: PASS — 2 tests green.

- [ ] **Step 5: Typecheck and lint**

Create `tsconfig.json`:

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["middleware.ts", "middleware.test.ts"]
}
```

Run: `pnpm exec tsc --noEmit -p tsconfig.json && pnpm exec eslint middleware.ts middleware.test.ts`
Expected: both clean. Then update root `package.json`'s `typecheck`/`lint`/`test`
scripts to run these alongside the existing recursive commands, e.g.:
`"typecheck": "tsc --noEmit -p tsconfig.json && pnpm --filter '!./vendor/**' -r typecheck"`,
`"lint": "eslint middleware.ts middleware.test.ts && pnpm --filter '!./vendor/**' -r lint"`,
`"test": "vitest run && pnpm --filter '!./vendor/**' -r test"`.
Run `pnpm typecheck && pnpm lint && pnpm test` from repo root to confirm the
full composite commands still pass.

- [ ] **Step 6: Commit**

```bash
git add middleware.ts middleware.test.ts tsconfig.json vitest.config.ts package.json pnpm-lock.yaml
git commit -m "Add Basic Auth gate (middleware.ts) for the foundry-live-demo environment"
```

---

### Task 10: Full workspace verification + live end-to-end smoke test

**Files:** none (verification only).

**Interfaces:** none.

- [ ] **Step 1: Full workspace build/typecheck/lint/test**

Run: `pnpm build && pnpm typecheck && pnpm lint && pnpm test`
Expected: all green across all 11 non-vendor packages.

- [ ] **Step 2: Local manual smoke test of the new route**

Run:
```bash
FOUNDRY_REGISTRY_DB_PATH=:memory: EXE_DEV_TOKEN=<real token> pnpm --filter @foundry/api dev
```
In another shell:
```bash
curl -s -X POST http://localhost:3001/apps -H "content-type: application/json" -d '{"name":"plan-smoke-test"}'
curl -s -X POST http://localhost:3001/apps/plan-smoke-test/deploy
curl -s http://localhost:3001/apps/plan-smoke-test
```
Expected: the deploy call returns a `200` with `status: "healthy"` and a real `https://plan-smoke-test.exe.xyz`-style `url`. Then destroy the throwaway VM: `foundry sandbox rm plan-smoke-test` (from repo root, CLI built).

- [ ] **Step 3: Local manual smoke test of the UI wiring**

Run:
```bash
VITE_API_BASE_URL=http://localhost:3001 pnpm --filter @foundry/web dev
```
Open the app, navigate to the Dashboard (via "Admin"), confirm the real registry's apps render (not the 6 mocked rows), click "Deploy" on one, confirm the row flips to "Deploying" then to "Healthy" with a real URL. Then destroy that VM too via `foundry sandbox rm <name>`.

- [ ] **Step 4: Commit any final fixups**

If steps 2-3 surface anything, fix it, re-run the relevant package's tests, and commit with a message describing what the live smoke test caught — the same standard applied to every other real-integration bug found this session.

---

### Task 11: Stand up the real environment (ops — not code)

**Files:** none in the repo; this task provisions external infrastructure (one exe.dev VM, one Vercel project) and verifies the whole thing live. Push the branch first so the VM can pull real code.

**Interfaces:** none — this is the deliverable the whole plan exists to produce.

- [ ] **Step 1: Push the branch**

Run: `git push -u origin live-demo-environment`

- [ ] **Step 2: Provision the exe.dev VM**

Run: `node packages/cli/dist/index.js sandbox new foundry-api-host --memory 2GB`
Expected: prints `Created foundry-api-host — https://foundry-api-host.exe.xyz (running)`. Record that `httpsUrl` and the `ssh_dest` (`foundry-api-host.exe.xyz`) — you'll need both below.

- [ ] **Step 3: Get the code onto the VM and check the runtime**

Run: `ssh foundry-api-host.exe.xyz "node --version || echo NO_NODE"`
Expected: either a Node version (≥20, matching this repo's `engines` field) or `NO_NODE`. If `NO_NODE`, install it first — e.g. `ssh foundry-api-host.exe.xyz "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"` (exact command depends on the VM's base image; adapt if it's not Debian-based).

Then clone and build:
```bash
ssh foundry-api-host.exe.xyz "git clone https://github.com/Stacksheild/foundry.git && cd foundry && git checkout live-demo-environment && corepack enable && git submodule update --init --recursive && pnpm install && pnpm build:vendor && pnpm build:libs"
```
Expected: completes with no errors (mirrors Task 1-6's already-green local builds).

- [ ] **Step 4: Start `apps/api` persistently, with real env vars**

Generate a token: `openssl rand -hex 24` — use its output as `<TOKEN>` below.

Run:
```bash
ssh foundry-api-host.exe.xyz "cd foundry && FOUNDRY_API_TOKEN=<TOKEN> FOUNDRY_CORS_ORIGIN=https://foundry-live-demo.vercel.app EXE_DEV_TOKEN=<your exe.dev token> nohup pnpm --filter @foundry/api dev > api.log 2>&1 & disown"
```
Expected: `curl https://foundry-api-host.exe.xyz/health` from your local machine returns `{"status":"ok"}`.

- [ ] **Step 5: Seed 2-3 demo apps in the registry**

Run:
```bash
ssh foundry-api-host.exe.xyz "cd foundry && node packages/cli/dist/index.js apps register demo-metrics-dashboard --team Platform"
ssh foundry-api-host.exe.xyz "cd foundry && node packages/cli/dist/index.js apps register demo-service-catalog --team Platform"
```
Expected: `curl https://foundry-api-host.exe.xyz/apps` (with the bearer token) shows both.

- [ ] **Step 6: Create the second Vercel project in an isolated worktree**

The existing working tree's `.vercel/project.json` is already linked to the `foundry` project — don't touch it. Use a separate worktree so the new project's link lives in its own `.vercel/project.json`:

```bash
git worktree add /tmp/foundry-live-demo live-demo-environment
cd /tmp/foundry-live-demo
vercel link --yes --project foundry-live-demo
```
Expected: creates and links a new project named `foundry-live-demo` (confirm it's new, not the existing `foundry` project, by checking the printed project name).

- [ ] **Step 7: Set env vars, including the Basic Auth credentials for `middleware.ts` (Task 9)**

Generate a password: `openssl rand -base64 18` — use its output as `<DEMO_PASSWORD>` below.

```bash
cd /tmp/foundry-live-demo
vercel env add VITE_API_BASE_URL production    # paste https://foundry-api-host.exe.xyz when prompted
vercel env add VITE_API_TOKEN production        # paste <TOKEN> from Step 4 when prompted
vercel env add FOUNDRY_DEMO_USERNAME production # e.g. "demo"
vercel env add FOUNDRY_DEMO_PASSWORD production # paste <DEMO_PASSWORD>
```
No dashboard step needed — `middleware.ts` (Task 9) reads these at request time, so the gate is fully scriptable via the CLI and doesn't depend on Vercel's paid Password Protection/Vercel Authentication add-ons.

- [ ] **Step 8: Deploy**

```bash
cd /tmp/foundry-live-demo
vercel --prod --yes
```
Expected: `READY` status, printed URL is the `foundry-live-demo` project's production URL (not `foundry-blond.vercel.app`).

- [ ] **Step 9: Live verification**

Visit the deployed URL, enter the username/password from Step 7 in the browser's Basic Auth prompt, navigate to the Dashboard, confirm `demo-metrics-dashboard` and `demo-service-catalog` render with real data, click "Deploy" on one, confirm it flips to "Deploying" then "Healthy" with a real exe.dev URL. Then verify `foundry-blond.vercel.app` (the original public demo) is completely unaffected — still static, still the 6 mocked rows.

- [ ] **Step 10: Clean up the worktree**

```bash
git worktree remove /tmp/foundry-live-demo
```

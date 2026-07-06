# Real demoable environment (Vercel + exe.dev) — design

## Context

`apps/web` on Vercel (`foundry-blond.vercel.app`) is deliberately static: the
four reference screens render hardcoded mock data
(`packages/ui/src/data/apps.ts`'s `APPS_DATA`, the scripted Build-screen agent
steps, etc.), by design — see the README's "Chat & agent wiring" and
"Live demo" sections. Real functionality already exists but is only reachable
locally: `apps/api`'s REST routes, `packages/app-registry`'s real SQLite
registry, and `packages/compute-providers`' real exe.dev integration (verified
live against the real API on 2026-07-05/06 — see git history on
`overnight-fixes`).

The goal here is a **second, access-controlled environment** where one of
those real capabilities — provisioning/destroying real exe.dev VMs — is
actually reachable and demoable from a browser UI, without touching the
public static demo at all.

## Goals

- Add a real `POST /apps/:name/deploy` endpoint to `apps/api` that provisions
  a real exe.dev VM for a registered app (mirrors what `foundry deploy`
  already does via the CLI).
- Host that `apps/api` persistently on its own exe.dev VM (not Vercel
  serverless — see "Why not Vercel Functions" below).
- Wire `packages/ui`'s `DashboardScreen` to optionally read the real registry
  and call the real deploy endpoint, gated behind a prop that's only set in
  the new environment.
- Stand up a second Vercel project pointed at that real backend, protected by
  Vercel Authentication.
- Leave the existing public `foundry` Vercel project, and the scripted
  canary-rollout "Deploy screen," completely untouched.

## Non-goals

- No LLM/Build-screen wiring (no provider key available; would also need
  real app-code generation, which doesn't exist yet — `packages/preview-engine`
  is real but has no UI consumer).
- No real canary/staged-rollout/auto-rollback. exe.dev only supports
  create/list/destroy of a VM — no traffic-split, no reverse proxy. Building
  that is explicitly future work per `docs/development-plan.md`'s Phase 3
  "Not yet built" list. The existing canary "Deploy screen" stays as the
  static creative reference; nothing about it becomes real.
- No migration off `node:sqlite`/SQLite.
- No changes to the public `foundry` Vercel project or its build config.

## Architecture

```
┌─────────────────────────┐        Bearer FOUNDRY_API_TOKEN        ┌──────────────────────────┐
│ foundry-live-demo       │ ─────────────────────────────────────▶ │ apps/api on its own      │
│ (new Vercel project,    │  GET /apps, POST /apps/:name/deploy    │ exe.dev VM (unchanged    │
│  Vercel Auth-gated)     │ ◀─────────────────────────────────────  │ Fastify + real SQLite)   │
│ apps/web + VITE_API_*   │                                        │                          │
└─────────────────────────┘                                        └──────────────────────────┘

  foundry-blond.vercel.app (existing "foundry" Vercel project): unchanged, fully static, no env vars
```

### Why apps/api runs on an exe.dev VM, not Vercel Functions

`apps/api` is a long-running Fastify process backed by real `node:sqlite`
files on local disk. Vercel Functions are stateless/ephemeral — no persistent
filesystem across invocations — so running it there would require swapping
SQLite for a hosted DB (a real, separate migration). Running it on a
persistent exe.dev VM instead needs **zero backend code changes**, and is
thematically consistent: Foundry's own admin backend runs on the same
disposable-VM compute layer it manages for its users.

## Backend changes (`apps/api`)

### New endpoint: `POST /apps/:name/deploy`

Behaves exactly like `packages/cli/src/commands/deploy.ts`'s `deploy` command:
1. Look up the app in the registry; 404 if it doesn't exist.
2. Mark it `deploying`.
3. If it already has a `vmName`, destroy that VM first (redeploy = fresh
   sandbox, matching exe.dev's disposable-VM model).
4. Create a new exe.dev VM named after the app; update the registry with
   `status: "healthy"`, `url`, `vmName` on success, or `status: "error"` on
   failure.
5. Return the updated `AppRecord` (or the error) as JSON.

To avoid duplicating this orchestration between the CLI and the API, extract
it into one shared function — e.g. `deployApp(db, provider, name, opts)` —
that both `packages/cli/src/commands/deploy.ts` and the new route call. Exact
placement (a new tiny module vs. adding to `packages/app-registry`) is an
implementation-plan detail, not a design fork.

### New env var: `FOUNDRY_API_TOKEN`

A Fastify `onRequest` hook checks `Authorization: Bearer <token>` against
`process.env.FOUNDRY_API_TOKEN` on every route except `GET /health`, **only
when that env var is set**. Unset (local dev, every test today, tonight's
manual testing) → zero behavior change. Set (on the exe.dev-hosted instance)
→ any request without a matching bearer token gets `401`.

This is defense in depth, not the primary access control: Vercel
Authentication is what actually keeps random visitors off the frontend. Since
`apps/web` is a static SPA, this token ships inside its built JS bundle — it
stops people who never get past Vercel Authentication from ever reaching the
API directly (e.g. if the VM's URL leaks or gets indexed), but it does not
hide the token from anyone who *is* let through Vercel Authentication. That
tradeoff was discussed and accepted explicitly.

### CORS

Add `@fastify/cors`, scoped to the `foundry-live-demo` Vercel project's
origin(s) (production + preview URLs for that project). `apps/api` has never
needed CORS before since nothing cross-origin has called it for real.

## Frontend changes (`packages/ui` + `apps/web`)

### `DashboardScreen`: optional live-data path, not a fork

Today `DashboardScreen` unconditionally renders the hardcoded `APPS_DATA`.
It gains an optional `apiBaseUrl?: string` prop, threaded down from
`App.tsx` (which reads `import.meta.env.VITE_API_BASE_URL`):

- **Unset** (the existing public demo, no env var set) → behavior is
  pixel-identical to today. This is the mechanism that keeps
  `foundry-blond.vercel.app` untouched without a second copy of the
  component.
- **Set** (the new `foundry-live-demo` project) → on mount, fetch
  `GET {apiBaseUrl}/apps` (with the bearer token from
  `import.meta.env.VITE_API_TOKEN`) and render that instead of `APPS_DATA`.

### Per-row "Deploy" button: real action when live

When `apiBaseUrl` is set, clicking a row's "Deploy" button no longer just
navigates to the canary screen. Instead it:
1. Optimistically flips that row's `StatusBadge` to `"deploying"`.
2. `POST`s `{apiBaseUrl}/apps/{name}/deploy`.
3. On success, updates that row's status/env/URL from the real response.
4. On failure (e.g. a real exe.dev error — the 422 billing-wall response is
   a real example from tonight), shows an inline error state on the row
   rather than silently failing.

When `apiBaseUrl` is unset, this button's behavior is unchanged (navigates
to the canary screen, exactly as today).

### Untouched

The canary-rollout "Deploy screen" (`DeployScreen.tsx`) is not modified at
all. It continues to render its scripted 3-stage pipeline regardless of
environment — Foundry has no real equivalent to demo yet, and pretending
otherwise would be dishonest.

## Deployment / operational steps (not code)

1. Provision one persistent exe.dev VM running `apps/api`, with
   `FOUNDRY_DB_PATH`, `FOUNDRY_REGISTRY_DB_PATH`, `EXE_DEV_TOKEN`, and the new
   `FOUNDRY_API_TOKEN` set as env vars on that VM.
2. Seed the registry with 2-3 demo apps via `foundry apps register` (pointed
   at that VM's DB, e.g. over SSH) so the Dashboard isn't empty on first
   view.
3. Create a new Vercel project, `foundry-live-demo`, linked to the same
   GitHub repo, same build settings as the existing `foundry` project
   (`pnpm --filter @foundry/web build`, output `apps/web/dist`), plus:
   - `VITE_API_BASE_URL` = the exe.dev VM's `https_url`
   - `VITE_API_TOKEN` = the same value as that VM's `FOUNDRY_API_TOKEN`
   - Vercel Authentication turned on in that project's settings.
4. Manual end-to-end verification pass on the deployed environment: load the
   Dashboard, confirm real app rows appear, click Deploy, confirm a real
   exe.dev VM appears (`foundry sandbox ls`) and the row updates, then clean
   up any VMs created purely for verification.

## Testing

- Unit tests for the new shared `deployApp` helper and the `POST
  /apps/:name/deploy` route, mocking the compute provider — same pattern as
  the existing `packages/cli/src/__tests__/cli.test.ts` deploy-command tests
  and `apps/api`'s existing route tests (`vi.stubEnv`/mocked fetch, no real
  network calls in CI).
- Unit test for the `FOUNDRY_API_TOKEN` hook: unset → request passes through;
  set + missing/wrong header → `401`; set + correct header → passes through.
- `DashboardScreen`: a test asserting it still renders `APPS_DATA` verbatim
  when `apiBaseUrl` is omitted (protects the public demo's frozen behavior),
  plus a test for the live-fetch path with a mocked `fetch`.
- Manual live verification against the real deployed environment (per step 4
  above) before considering this done — the same bar applied to tonight's
  exe.dev fixes.

## Open risks (surfaced, accepted)

- The `FOUNDRY_API_TOKEN` shipped in the frontend bundle is visible to anyone
  who gets past Vercel Authentication (accepted above).
- exe.dev VMs cost money/quota; the Deploy button in this environment is real
  and should only be clicked by people who understand that.

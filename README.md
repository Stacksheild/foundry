# Foundry

An AI pair-programmer for internal tools. Describe an internal app in plain
language; Foundry scaffolds it against your org's real services and APIs,
then ships it through a guided dev → staging → production pipeline with
health checks and canary rollout built in.

Foundry is vendor-neutral: bring your own LLM provider (OpenAI, Anthropic,
or a local model via Ollama), your own compute (exe.dev sandboxes today,
AWS/Azure reserved for later), your own deploy target (Docker/K8s, Vercel,
Fly.io, or your own CI), and your own design system.

## Live demo

**[foundry-blond.vercel.app](https://foundry-blond.vercel.app)** — try the
reference UI in your browser, no install needed. Click through Home → Build →
Dashboard → Deploy from the header. This is `apps/web` deployed as-is: the
four reference screens on mock data, deliberately kept static (see
[Status](#status) below — everything real lives in `apps/api`/`packages/cli`,
not the public demo, so it's always safe for strangers to click around).

Kept up to date via [`.github/workflows/deploy-demo.yml`](.github/workflows/deploy-demo.yml)
(CLI-based, not Vercel's native GitHub App — that failed to authorize for
the `Stacksheild` org) — every push to `main` redeploys it, once a
`VERCEL_TOKEN` repo secret is set. Until that secret exists, redeploy
manually from the repo root: `vercel --prod`.

## Status

Early-stage, but with substantially more real (not mocked) functionality
than the public demo shows:

- `packages/ui` / `apps/web` — the four reference screens (Home, Build,
  Dashboard, Deploy), intentionally frozen/scripted for public safety.
- `packages/cli` — a real CLI: `scan`, `sandbox`, `create`/`templates`,
  `config`, `chat`, `apps`, `deploy`, `check`, `dev`. Every command below
  works against real backends (SentinelAI, exe.dev, SQLite, esbuild), not
  fixtures.
- `apps/api` — real REST endpoints: `/scan`, `/build/chat` +
  `/build/sessions` (env-gated), `/apps` (registry CRUD).

The full picture — what's real vs. still aspirational per phase — lives in
[`docs/development-plan.md`](docs/development-plan.md).

## Monorepo layout

```
apps/web                   React + Vite frontend (renders packages/ui) — the public demo
apps/api                   Fastify API — /health, /scan, /build/chat, /build/sessions, /apps
packages/ui                Screens and components — the visual reference implementation
packages/agent-core        Pluggable LLM adapters (OpenAI/Anthropic/Ollama) with real
                            streaming, model-router-assisted selection
packages/scanner-service   Thin wrapper around @sentinelai/scanner, shared by apps/api + CLI
packages/compute-providers exe.dev sandbox VM lifecycle (create/list/destroy)
packages/app-registry      Real SQLite app registry, shared by apps/api + CLI
packages/health-checks     Pluggable checks: security scan, unit tests, bundle size
packages/preview-engine    Client-side esbuild-wasm bundler (Phase 2 preview infra,
                            not yet wired into a UI — see its README)
packages/cli               The `foundry` CLI (see below)
vendor/sentinelai          Git submodule — Stacksheild/sentinelai, vendored for real workspace deps
docs/                      Design tokens, architecture, roadmap
```

## Quick start

```bash
git submodule update --init --recursive   # fetch vendor/sentinelai
pnpm install
pnpm build:vendor                          # builds @sentinelai/{core,model-router,scanner}
pnpm build:libs                            # builds every dist-based @foundry/* package
pnpm --filter @foundry/web dev
```

This starts the web app at `http://localhost:5173` with the four reference
screens navigable from the header.

## CLI

```bash
pnpm --filter @foundry/cli build
node packages/cli/dist/index.js --help
```

- `foundry scan <path> [--format table|json] [--severity <level>]` — real
  security scan via `@sentinelai/scanner`.
- `foundry sandbox new|ls|rm` — manage exe.dev sandbox VMs.
- `foundry create <name> [--template <id>]` — scaffold from a first-party
  template (`minimal`, `metrics-dashboard`, `service-catalog-entry`,
  `crud-admin`); `foundry templates` lists them. Picks up `defaultTemplate`
  from a `foundry.config.yml` if one exists (see
  [docs/foundry.config.example.yml](docs/foundry.config.example.yml)).
- `foundry config` — show the resolved golden-path config.
- `foundry chat "<prompt>" [--provider <name>] [--task-type <type>]` — real
  streaming LLM chat, local/dev only (see [Chat & agent wiring](#chat--agent-wiring)).
- `foundry apps ls|register|show` — manage the real SQLite app registry.
- `foundry deploy <name>` — provision a real exe.dev VM for a registered app.
- `foundry check <path>` — run pluggable health checks (security scan, unit
  tests, bundle size) against a directory.
- `foundry dev` — starts the web app (`pnpm --filter @foundry/web dev`).

## Chat & agent wiring

`packages/agent-core`'s adapters (Anthropic/OpenAI/Ollama) support real
token streaming, parsing each provider's actual wire format. Exposed two
ways, both deliberately **outside** the public `apps/web` demo (anyone can
hit that URL — real LLM calls there would burn API budget and expose model
choice to strangers):

- `foundry chat` (CLI, local/dev use).
- `POST /build/chat` on `apps/api`, registered only when
  `FOUNDRY_ENABLE_AGENT=true`. Persists each turn to SQLite —
  `GET /build/sessions` / `GET /build/sessions/:id` read history back.

`packages/preview-engine` (client-side esbuild-wasm bundling, no server
round-trip) is the "live sandboxed preview" building block for a future
Build-screen wiring — real and tested, but nothing generates real per-request
app source yet, so it has no live UI consumer today. See its own README.

## App registry & deploy pipeline

`packages/app-registry` (SQLite) replaces the mock `APPS_DATA` concept with
a real registry — shared by `apps/api`'s REST routes (`GET/POST /apps`,
`GET/PATCH /apps/:name`) and `foundry apps`, both reading/writing the same
on-disk state. `foundry deploy <name>` provisions a real exe.dev VM for a
registered app and records its status/url/vmName back to the registry;
redeploying destroys the previous VM first (exe.dev's sandboxes are
disposable by design).

`foundry check <path>` runs pluggable health checks — real security
scanning, real test-script execution, real esbuild-measured bundle size —
against any directory, including apps `foundry create` just scaffolded.

## Security scanning

`POST /scan`, `foundry scan`, and `foundry check`'s security-scan check all
call `packages/scanner-service`, a thin wrapper around `@sentinelai/scanner`
(real vulnerability scanning for Claude Code skills, MCP configs, and hooks).

**Known limitation:** `/scan` takes an arbitrary filesystem path with no
allowlist — fine for local dev, unsafe to expose on a multi-tenant/public
deployment without restricting it to a configured workspace root first.

## Compute / sandboxes

`packages/compute-providers` wraps exe.dev's HTTPS API (`POST
https://exe.dev/exec`) for disposable VM lifecycle — create, list, destroy.
Set `EXE_DEV_TOKEN` (generate via `ssh exe.dev ssh-key generate-api-key
--exp=30d`) to use it. AWS and Azure are reserved in the provider type but
**not implemented** — exe.dev is the only real provider today.

## External integrations

`vendor/sentinelai` is a git submodule of
[Stacksheild/sentinelai](https://github.com/Stacksheild/sentinelai), vendored
(not npm-installed) because its packages use the `workspace:*` protocol
internally and aren't published to npm. `pnpm-workspace.yaml` includes
`vendor/sentinelai/packages/*` so `@sentinelai/core`, `@sentinelai/model-router`,
and `@sentinelai/scanner` resolve as real workspace dependencies. Update the
pin deliberately with `git submodule update --remote vendor/sentinelai`, not
automatically.

**Licensing note:** sentinelai's own `LICENSE` is PolyForm Noncommercial 1.0
(dual-licensed; a commercial license is available separately from
Stacksheild), not the Apache-2.0 its individual `package.json` files claim.
Foundry itself stays MIT, but the vendored `vendor/sentinelai` submodule
carries sentinelai's own license terms — worth knowing if you fork this repo.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)

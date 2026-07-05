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
four reference screens on mock data (see [Status](#status) below for what's
real vs. UI-only).

Kept up to date via [`.github/workflows/deploy-demo.yml`](.github/workflows/deploy-demo.yml)
(CLI-based, not Vercel's native GitHub App — that failed to authorize for
the `Stacksheild` org) — every push to `main` redeploys it, once a
`VERCEL_TOKEN` repo secret is set. Until that secret exists, redeploy
manually from the repo root: `vercel --prod`.

## Status

Early-stage. `packages/ui` has a working reference UI for the four core
screens (Home, Build, Dashboard, Deploy). `apps/api` has a real, working
security-scan endpoint and `packages/cli` has a real, working CLI (scan,
sandbox lifecycle, static scaffolding, dev). The full scaffolding engine,
agent-driven build pipeline, and deploy pipeline described in
[`docs/development-plan.md`](docs/development-plan.md) are still ahead —
that file has the phased roadmap and calls out what's real vs. aspirational
in each phase.

## Monorepo layout

```
apps/web                 React + Vite frontend (renders packages/ui)
apps/api                 Fastify API — /health, /scan (real, via @sentinelai/scanner)
packages/ui              Screens and components — the visual reference implementation
packages/agent-core       Pluggable LLM adapters (OpenAI / Anthropic / Ollama) +
                          model-router-assisted selection via @sentinelai/model-router
packages/scanner-service  Thin wrapper around @sentinelai/scanner, shared by apps/api and packages/cli
packages/compute-providers exe.dev sandbox VM lifecycle (create/list/destroy)
packages/cli              The `foundry` CLI: scan, sandbox, create, dev
vendor/sentinelai         Git submodule — Stacksheild/sentinelai, vendored for real workspace deps
docs/                     Design tokens, architecture, roadmap
```

## Quick start

```bash
git submodule update --init --recursive   # fetch vendor/sentinelai
pnpm install
pnpm build:vendor                          # builds @sentinelai/{core,model-router,scanner}
pnpm build:libs                            # builds @foundry/{scanner-service,compute-providers}
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
  security scan via `@sentinelai/scanner` (same engine as `apps/api`'s `/scan`).
- `foundry sandbox new|ls|rm` — manage exe.dev sandbox VMs (see below).
- `foundry create <name>` — copies Foundry's one built-in static starter
  template. Not a scaffolding engine yet — see Phase 1 in the development plan.
- `foundry dev` — starts the web app (`pnpm --filter @foundry/web dev`).

## Security scanning

`POST /scan` on `apps/api` and `foundry scan` on the CLI both call
`packages/scanner-service`, a thin wrapper around `@sentinelai/scanner`
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

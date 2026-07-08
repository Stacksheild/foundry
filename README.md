# Foundry

**Describe an internal app in plain language — Foundry builds it and ships it.**

Foundry is an AI pair-programmer for internal tools. It scaffolds apps against
your org's real services, then walks them through a dev → staging → production
pipeline with health checks and canary rollout built in. Bring your own LLM
(OpenAI, Anthropic, or local via Ollama), your own compute (exe.dev sandboxes),
and your own design system.

## Try it in your browser (no install)

👉 **[foundry-blond.vercel.app](https://foundry-blond.vercel.app)**

Click **Admin** in the header, then explore every screen: Overview, Deployments,
Logs, Analytics, Observability, and more. Or start from the home screen and
"build" an app to watch the guided Build → Deploy flow. This public demo runs
on scripted data, so it's always safe to click anything.

*(A second, password-protected environment demos the real backend — live app
registry, real VM provisioning from the Deploy button. Ask a maintainer for
access.)*

## Run it locally — 3 steps

You need [Node.js 20+](https://nodejs.org) (which includes `corepack`; run
`corepack enable` once so the `pnpm` command is available).

```bash
# 1. Get the code (the flag also fetches the vendored submodule — don't skip it)
git clone --recurse-submodules https://github.com/Stacksheild/foundry.git && cd foundry

# 2. Install dependencies
pnpm install

# 3. Start the app
pnpm dev
```

Open **http://localhost:5173** — you'll see the same UI as the online demo.

> **Something not working?**
> - `pnpm: command not found` → run `corepack enable` (needs Node 20+).
> - Errors about `@sentinelai/...` during install → you cloned without
>   `--recurse-submodules`. Fix with `git submodule update --init --recursive`,
>   then `pnpm install` again.

## Going deeper: the real backend & CLI

The web demo is the visual layer. The real functionality (security scanning,
sandbox VMs, app registry, deploys, LLM chat) lives in the CLI and API.

**No repo checkout needed:** every [GitHub Release](https://github.com/Stacksheild/foundry/releases)
ships a self-contained CLI bundle (`foundry-cli-*.tar.gz`, needs Node 22+ —
unpack and run `node foundry-cli/dist/index.js --help`) and the demo UI as a
host-anywhere static site (`foundry-demo-static-*.tar.gz`).

Or build from the repo — one extra step unlocks everything:

```bash
pnpm build:vendor && pnpm build:libs        # build the backend packages
pnpm --filter @foundry/cli build            # build the CLI
node packages/cli/dist/index.js --help      # see every command
```

The highlights:

| Command | What it does |
|---|---|
| `foundry scan <path>` | Real security scan (via `@sentinelai/scanner`) |
| `foundry create <name> --template <id>` | Scaffold an app from a template (`foundry templates` lists them) |
| `foundry apps ls\|register\|show` | Manage the real SQLite app registry |
| `foundry deploy <name>` | Provision a real [exe.dev](https://exe.dev) sandbox VM (needs `EXE_DEV_TOKEN`) |
| `foundry sandbox new\|ls\|rm` | Manage those VMs directly |
| `foundry check <path>` | Run health checks: security scan, unit tests, bundle size |
| `foundry chat "<prompt>"` | Streaming LLM chat (needs a provider API key; local use only) |

The REST API (`apps/api`) exposes the same registry and deploy pipeline over
HTTP: `pnpm --filter @foundry/api dev`, then hit `/health`, `/apps`,
`POST /apps/:name/deploy`.

## How the repo is laid out

```
apps/web                   The web app you just ran (React + Vite)
apps/api                   Fastify REST API (registry, deploys, scan, chat)
packages/ui                All screens & components
packages/cli               The `foundry` CLI
packages/app-registry      SQLite app registry (shared by API + CLI)
packages/compute-providers exe.dev sandbox VM lifecycle
packages/agent-core        LLM adapters (OpenAI / Anthropic / Ollama) with real streaming
packages/scanner-service   Security scanning (wraps @sentinelai/scanner)
packages/health-checks     Pluggable checks: security, tests, bundle size
packages/preview-engine    Client-side esbuild-wasm bundler (future Build-screen wiring)
vendor/sentinelai          Git submodule (why cloning needs --recurse-submodules)
docs/                      Architecture, roadmap, design tokens
```

What's real vs. still scripted, phase by phase:
[`docs/development-plan.md`](docs/development-plan.md).

## Notes for operators

- **Deploys:** every push to `main` should redeploy the public demo via
  [`.github/workflows/deploy-demo.yml`](.github/workflows/deploy-demo.yml),
  once a `VERCEL_TOKEN` repo secret is set. Until then: `vercel --prod` from
  the repo root.
- **Security:** `POST /scan` accepts an arbitrary filesystem path — fine
  locally, don't expose it publicly without restricting to a workspace root.
- **Licensing:** Foundry is [MIT](LICENSE). The vendored `vendor/sentinelai`
  submodule is PolyForm Noncommercial 1.0 (its own `package.json` files
  claiming Apache-2.0 are incorrect) — relevant if you fork this repo.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

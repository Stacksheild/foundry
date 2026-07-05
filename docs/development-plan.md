# Foundry — Open Source Development Plan

A vendor-neutral, AI-assisted internal-tooling builder. Prototype → phased
build plan for public release.

## 1. Rebrand & de-risk

Before any of this is public, every trace of the original internal prototype
must be stripped:

- **Naming** — project is named **Foundry**. Confirm trademark/npm/GitHub-org
  availability before publishing under this name elsewhere.
- **Visual identity** — original logo mark and an original indigo/slate color
  system (no borrowed corporate red accent or "Developer Portal" wordmark).
- **Design language** — no references to any named corporate design system in
  code, class names, or docs. Own token set documented in
  [`design-tokens.md`](design-tokens.md).
- **Copy** — sample data uses generic or fictional placeholders (Team Alpha,
  Service A, etc.), never real internal tool names.
- **License** — `LICENSE` (MIT) and `NOTICE` confirm no proprietary code or
  assets are included.

## 2. What Foundry is

An AI pair-programmer for internal tools: a developer describes an internal
app in plain language, Foundry scaffolds it against the org's real
services/APIs, and ships it through a guided dev → staging → production
pipeline with health checks and canary rollout built in. The reference
deliverable is a clickable prototype (4 screens: Home, Build, Dashboard,
Deploy) — see `packages/ui`.

## 3. Architecture overview

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite, Radix UI primitives + own token layer | Unstyled, accessible primitives keep the project free of any one company's design system |
| Backend | Node (Fastify) or Go | Thin API layer; swappable |
| Agent orchestration | Pluggable LLM adapter (OpenAI / Anthropic / local model via Ollama) | No single vendor lock-in |
| Scaffolding engine | Template-based generator (Plop/Yeoman-style) + AST codemods | Deterministic, reviewable output — not just LLM freeform text |
| Deploy targets | Adapters for Vercel, Fly.io, Docker/K8s, "bring your own CI" | Works without a specific cloud stack |
| Data/state | SQLite (local/dev) → Postgres (prod) | Zero-config local dev, real DB in prod |

## 4. Phased roadmap

### Phase 0 — 2 wks — Repo & foundations
- Rebrand assets, choose license, write CONTRIBUTING.md + CODE_OF_CONDUCT.md
- Monorepo setup (pnpm workspaces): `apps/web`, `apps/api`, `packages/ui`, `packages/agent-core`
- CI: lint, typecheck, unit tests on PR (GitHub Actions)
- Convert the prototype into real React components under `packages/ui` as the visual reference implementation

### Phase 1 — 4 wks — Core scaffolding engine
- Define a plugin manifest format (`foundry.plugin.json`) so templates for "dashboard", "CRUD app", "internal wiki" etc. are community-contributable
- Ship 3 first-party templates: metrics dashboard, service catalog entry, CRUD admin panel
- CLI: `npx foundry create` for local scaffolding without the web UI
- Golden-path config: teams define their own stack defaults (framework, API base, auth) in a repo-root `foundry.config.yml`

### Phase 2 — 4 wks — Agent & build UI
- Wire the Build screen to a real LLM adapter (streaming responses, not scripted timeline)
- Live sandboxed preview: run generated app in an iframe via esbuild-wasm or a small container, not a hand-authored mock
- Chat history persistence per session (SQLite)
- "Explain this change" + diff view before applying agent edits

### Phase 3 — 4 wks — Dashboard & deploy pipeline
- Real app registry (Postgres) replacing mock data
- Deploy adapters: start with Docker Compose + a generic webhook target; add Vercel/Fly adapters as plugins
- Health checks: pluggable check runners (unit tests, bundle size, security scan via OSV/Trivy)
- Canary rollout: real traffic-split via reverse proxy (e.g. Traefik weights) instead of a simulated progress bar
- Auto-rollback rule engine (threshold-based, configurable per app)

### Phase 4 — ongoing — Community & extensibility
- Plugin marketplace docs — how to publish a template or deploy adapter
- Public roadmap board (GitHub Projects) + "good first issue" labeling
- Example gallery of apps built with Foundry, contributed by users
- Docs site (Starlight/Docusaurus) with quick-start, architecture, plugin authoring guide

## 5. Immediate next steps

- Finish stripping branding from the prototype (logo, colors, "Developer Portal" label, red accent)
- Pick final project name + reserve GitHub org/repo + npm scope
- Decide license (MIT recommended for max adoption)
- Write a one-page README with the vision, screenshot, and quick-start stub

## 6. Open questions

- Target audience: platform/infra teams at mid-size companies, or solo indie devs?
- Self-hosted only, or also a hosted SaaS version later?
- Which LLM provider(s) to support first — bring-your-own-key vs. a default provider?
- Governance model: solo-maintained, or set up a core-maintainers group from day one?

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
| Agent orchestration | Pluggable LLM adapter (OpenAI / Anthropic / local model via Ollama), model selection assisted by `@sentinelai/model-router` via `packages/agent-core`'s `pickAdapter()` | No single vendor lock-in; task-aware model choice instead of always defaulting to one model |
| Security | `@sentinelai/scanner` via `packages/scanner-service`, exposed as `POST /scan` and `foundry scan` | Real vulnerability scanning for skills/MCP configs/hooks, not a mocked health check |
| Scaffolding engine | Template-based generator (Plop/Yeoman-style) + AST codemods | Deterministic, reviewable output — not just LLM freeform text |
| Compute / sandboxes | `packages/compute-providers` — exe.dev sandbox VMs today; AWS/Azure reserved in the type, not implemented | Provider-agnostic compute for agent-driven builds, without committing to one cloud |
| Deploy targets | `foundry deploy` provisions a real exe.dev VM today; Vercel/Fly.io/Docker-Compose/"bring your own CI" adapters still ahead | Works without a specific cloud stack |
| Health checks | `packages/health-checks` — real security scan, real test-script execution, real esbuild bundle-size measurement, run via `foundry check` | Pluggable, and none of the three are mocked |
| Data/state | SQLite (local/dev, via Node's built-in `node:sqlite`) → Postgres (prod, not built yet) | Zero-config local dev, real DB in prod |

`@sentinelai/*` is vendored as a git submodule (`vendor/sentinelai`) rather than
an npm dependency — see the README's [External integrations](../README.md#external-integrations)
section for why, and for the licensing note on that submodule (PolyForm
Noncommercial, not MIT — Foundry itself stays MIT).

## 4. Phased roadmap

### Phase 0 — 2 wks — Repo & foundations
- Rebrand assets, choose license, write CONTRIBUTING.md + CODE_OF_CONDUCT.md
- Monorepo setup (pnpm workspaces): `apps/web`, `apps/api`, `packages/ui`, `packages/agent-core`
- CI: lint, typecheck, unit tests on PR (GitHub Actions)
- Convert the prototype into real React components under `packages/ui` as the visual reference implementation

### Phase 1 — 4 wks — Core scaffolding engine
- **Real today:**
  - `foundry.plugin.json` manifest format (name/version/description/type) +
    a registry (`packages/cli/src/templates/registry.ts`) that discovers any
    template directory containing one.
  - Four first-party templates, each a genuinely runnable zero-dependency
    Node app: `minimal`, `metrics-dashboard`, `service-catalog-entry`,
    `crud-admin`. `foundry create --template <id>` scaffolds one;
    `foundry templates` lists them.
  - Golden-path config: `foundry.config.yml` (real loader in
    `packages/cli/src/config.ts`, using the `yaml` package — walks up from
    cwd like ESLint/Prettier config discovery). Only `defaultTemplate` is
    read today; `framework`/`apiBase`/`auth` are reserved fields for later
    once agent-driven codegen exists to act on them. `foundry config` prints
    the resolved config.
- **Not yet built:** community templates from arbitrary (non-first-party)
  paths, and AST codemods for modifying existing generated code.

### Phase 2 — 4 wks — Agent & build UI
- **Real today:**
  - Streaming chat: each `packages/agent-core` adapter (Anthropic/OpenAI/
    Ollama) parses its provider's real wire format (SSE or NDJSON) via
    `packages/agent-core/src/streaming.ts`. Exposed as `foundry chat` (CLI)
    and `POST /build/chat` on `apps/api` (env-gated behind
    `FOUNDRY_ENABLE_AGENT=true` — deliberately **not** wired into the public
    `apps/web` demo; see the README's Chat & agent wiring section for why).
  - Chat session persistence: real SQLite (`apps/api/src/db.ts`, via
    `node:sqlite`) backing `POST /build/chat` and readable via
    `GET /build/sessions`/`GET /build/sessions/:id`.
  - Live sandboxed preview building block: `packages/preview-engine` bundles
    an in-memory virtual filesystem into runnable JS with esbuild-wasm,
    entirely client-side (no LLM calls, no server round-trip). Real and
    tested, but **not wired into apps/web's Build screen** — nothing
    generates real per-request app source yet to feed it (needs this
    phase's agent wiring and Phase 1's scaffolding engine to mature further
    together). See the package's own README for exactly what's missing.
- **Not yet built:** "Explain this change" + diff view before applying agent
  edits (depends on the preview wiring above landing first).

### Phase 2.5 — 4 wks — Spec-driven & role-aware agent workflow

Prompted by external feedback comparing Foundry to
[Kiro](https://kiro.dev/docs/specs/) and to an internal spec-driven toolkit
with per-role agent skills (tracked in
[#14](https://github.com/Stacksheild/foundry/issues/14)). Kiro's actual
mechanics, not just the marketing name, map cleanly onto primitives Foundry
already has — this phase is sequencing, not new infrastructure:

- **Specs (requirements → design → tasks).** Kiro persists three markdown
  artifacts per feature — `requirements.md` (EARS-notation user stories:
  "WHEN [event] THE SYSTEM SHALL [behavior]"), `design.md` (architecture,
  sequence diagrams), `tasks.md` (dependency-graphed, parallelizable work
  items) — with an approval gate before each phase, or a "Quick Plan" path
  that skips gates for well-understood asks.
  **Foundry equivalent:** extend the existing chat session row in
  `apps/api/src/db.ts` with a `phase` column (`requirements` → `design` →
  `tasks` → `building`) and a `specs` table storing the generated markdown
  per phase. `POST /build/chat` already streams through `agent-core`; the
  new work is a prompt/parser pair per phase plus a "approve to continue"
  action in the Build screen, not a new service. `foundry create --template`
  becomes the literal "Quick Plan" path for already-well-understood app
  shapes.
- **Steering (persistent project context).** Kiro auto-generates
  `product.md`/`tech.md`/`structure.md` by analyzing a codebase, then feeds
  them into every agent turn; custom steering files load `auto` /
  `conditional` (glob-matched) / `manual` (`#file` mention).
  **Foundry equivalent:** `foundry.config.yml` (`packages/cli/src/config.ts`)
  already walks up from cwd like ESLint config discovery — add a
  `.foundry/steering/*.md` convention read at the same point and injected
  into the `agent-core` system prompt before the adapter call. Auto-generating
  the three foundation files from an existing target repo is a natural use of
  the already-built `@sentinelai/scanner` codepath (it already reads a
  filesystem tree for `foundry scan`).
- **Hooks (event-triggered automation).** Kiro hooks run on file-system
  events (save/create/delete) or agent lifecycle points
  (`agentSpawn`/`preToolUse`/`postToolUse`/`stop`).
  **Foundry equivalent:** start with the "hooks-lite" version already scoped
  in #14 — auto-run `foundry check <path>` (security scan + tests + bundle
  size, all real today via `packages/health-checks`) immediately after a
  scaffold or agent edit, surfaced inline in the Build screen instead of
  requiring a manual CLI call. File-watch-triggered hooks are a fast follow
  once that loop exists.
- **Role-scoped personas (the part Kiro doesn't do, but the internal toolkit
  in the feedback does).** Instead of one generic chat agent, bind a
  persona/prompt layer per SDLC role on top of the adapters
  `packages/agent-core` already has: BA/Architect owns the
  requirements/design phases above, Dev owns scaffolding
  (`packages/cli/src/templates`), QA owns `packages/health-checks`, Security
  owns `packages/scanner-service`, SRE owns deploy/canary. No new runtime —
  each persona is a system-prompt + allowed-tool-subset config consumed by
  the same `pickAdapter()` path.

**Sequencing note:** none of the above matters to an outside evaluator until
Phase 2's existing gap closes first — the agent chat and `preview-engine` are
still not wired into the public `apps/web` Build screen, so specs/steering/
hooks would still be invisible in the demo even once built. Wire the real
loop into the demo *first*, then land specs → steering → hooks → personas in
that order (each depends on the previous one's storage/prompt-injection
plumbing).

### Phase 3 — 4 wks — Dashboard & deploy pipeline
- **Real today:**
  - Security scan health check — `POST /scan`, `foundry scan`, and
    `foundry check`'s security-scan check all call `@sentinelai/scanner` for
    genuine findings.
  - Real app registry: `packages/app-registry` (SQLite via `node:sqlite`)
    replaces the mock dashboard data concept — shared by `apps/api`'s
    `GET/POST /apps`, `GET/PATCH /apps/:name` and `foundry apps
    ls/register/show`, both reading/writing the same on-disk state.
  - Real deploy pipeline: `foundry deploy <name>` provisions an actual
    exe.dev VM for a registered app (destroying any previous VM first —
    redeploy = fresh sandbox, matching exe.dev's disposable-VM model) and
    records real status/url/vmName back to the registry.
  - Two more pluggable health checks alongside security-scan:
    `packages/health-checks`'s unit-tests (runs the target's real test
    script directly, not through `npm test` — see the package's commit
    history for why that distinction mattered) and bundle-size (real
    esbuild bundle+minify, measured against a byte threshold). All three
    run via `foundry check <path>`.
- **Not yet built:** Postgres (still SQLite for now — deliberately, no new
  hosted infra was justified for this round), Vercel/Fly/Docker-Compose
  deploy adapters (exe.dev is the only real deploy target today), real
  canary traffic-split via a reverse proxy, and the auto-rollback rule
  engine (both need a running proxy layer with real traffic in front of an
  app, which is a bigger infrastructure commitment than this round's scope).

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

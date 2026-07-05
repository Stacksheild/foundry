# Contributing to Foundry

Thanks for your interest in contributing. Foundry is early-stage — the
[development plan](docs/development-plan.md) has the current roadmap and
phase priorities.

## Setup

```bash
pnpm install
pnpm --filter @foundry/web dev
```

## Workflow

1. Open an issue before starting substantial work, so effort isn't duplicated.
2. Fork and branch from `main`.
3. Run `pnpm lint` and `pnpm typecheck` before opening a PR.
4. Keep PRs scoped to one change; note which roadmap phase (if any) it belongs to.

## Adding a template or deploy adapter

Phase 1 introduces a plugin manifest format (`foundry.plugin.json`) so
templates and deploy adapters can be community-contributed without touching
core. Until that lands, propose new templates/adapters via an issue first.

## Code of conduct

By participating, you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md).

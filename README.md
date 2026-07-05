# Foundry

An AI pair-programmer for internal tools. Describe an internal app in plain
language; Foundry scaffolds it against your org's real services and APIs,
then ships it through a guided dev → staging → production pipeline with
health checks and canary rollout built in.

Foundry is vendor-neutral: bring your own LLM provider (OpenAI, Anthropic,
or a local model via Ollama), your own deploy target (Docker/K8s, Vercel,
Fly.io, or your own CI), and your own design system.

## Status

Early-stage. The `packages/ui` package contains a working reference UI for
the four core screens (Home, Build, Dashboard, Deploy) driven by mock data.
The scaffolding engine, agent orchestration, and deploy pipeline described in
[`docs/development-plan.md`](docs/development-plan.md) are not yet wired up —
see that file for the phased roadmap.

## Monorepo layout

```
apps/web            React + Vite frontend (renders packages/ui)
apps/api             Fastify API skeleton
packages/ui          Screens and components — the visual reference implementation
packages/agent-core  Pluggable LLM adapter interface (OpenAI / Anthropic / Ollama)
docs/                Design tokens, architecture, roadmap
```

## Quick start

```bash
pnpm install
pnpm --filter @foundry/web dev
```

This starts the web app at `http://localhost:5173` with the four reference
screens navigable from the header.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)

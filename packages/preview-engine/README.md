# @foundry/preview-engine

Bundles a small in-memory set of files (no real filesystem, no network) into
runnable JS using esbuild-wasm, entirely client-side — no LLM calls, no
server round-trip. This is the Phase 2 "live sandboxed preview" building
block from docs/development-plan.md.

## Status

Real and tested (`bundleVirtualFiles`, `buildPreviewHtml`/`buildPreviewBlobUrl`),
but **not yet wired into `apps/web`'s Build screen** — the public demo is
deliberately kept exactly as its scripted reference version (see the repo's
commit history around the SentinelAI/exe.dev integration for why). Wiring
this in requires:

1. A browser build step change in `apps/web`: import the wasm asset via
   Vite's `?url` suffix and pass it to `initializeEngine`:
   ```ts
   import wasmUrl from "esbuild-wasm/esbuild.wasm?url";
   import { initializeEngine } from "@foundry/preview-engine";
   await initializeEngine(wasmUrl);
   ```
2. Something to actually generate the virtual files to bundle — today
   nothing produces real per-request generated app source (that's Phase 1's
   scaffolding engine + Phase 2's agent wiring maturing further).

Until both exist, this package is real, working infrastructure without a
live UI consumer yet.

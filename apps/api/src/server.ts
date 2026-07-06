import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildApp } from "./app.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// FOUNDRY_DB_PATH/FOUNDRY_REGISTRY_DB_PATH default to a path relative to
// process.cwd(), but pnpm runs this package's scripts with cwd already set
// to apps/api — so an unset default would resolve "apps/api/.data/..." to
// apps/api/apps/api/.data/..., a different file than the one `foundry`
// CLI's own cwd-relative default reads from repo root. Anchor to this
// file's location instead so both processes agree on one on-disk registry
// regardless of how each was launched.
process.env.FOUNDRY_DB_PATH ??= join(__dirname, "../.data/foundry.db");
process.env.FOUNDRY_REGISTRY_DB_PATH ??= join(__dirname, "../.data/foundry-registry.db");

const port = Number(process.env.PORT ?? 3001);

buildApp()
  .then((app) => app.listen({ port, host: "0.0.0.0" }))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

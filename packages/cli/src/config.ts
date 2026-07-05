import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { parse } from "yaml";

export interface FoundryConfig {
  framework?: string;
  apiBase?: string;
  auth?: string;
  defaultTemplate?: string;
}

const CONFIG_FILENAME = "foundry.config.yml";

/** Walks up from startDir looking for foundry.config.yml, same convention as .eslintrc/.prettierrc discovery. */
export function findConfigPath(startDir: string = process.cwd()): string | null {
  let dir = startDir;
  for (;;) {
    const candidate = join(dir, CONFIG_FILENAME);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/** Returns {} if no foundry.config.yml is found — golden-path config is optional. */
export function loadConfig(startDir: string = process.cwd()): FoundryConfig {
  const path = findConfigPath(startDir);
  if (!path) return {};

  const parsed = parse(readFileSync(path, "utf-8"));
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${path}: expected a YAML mapping at the top level`);
  }
  return parsed as FoundryConfig;
}

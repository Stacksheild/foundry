import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  type: "template";
}

export interface TemplateEntry {
  /** Directory name under templates/, used as the --template value */
  id: string;
  manifest: PluginManifest;
  /** Absolute path to the template directory (the files to copy) */
  path: string;
}

const REQUIRED_FIELDS: (keyof PluginManifest)[] = ["name", "version", "description", "type"];

function readManifest(manifestPath: string): PluginManifest {
  const raw = JSON.parse(readFileSync(manifestPath, "utf-8")) as Partial<PluginManifest>;
  const missing = REQUIRED_FIELDS.filter((f) => !raw[f]);
  if (missing.length > 0) {
    throw new Error(`${manifestPath}: missing required field(s): ${missing.join(", ")}`);
  }
  if (raw.type !== "template") {
    throw new Error(`${manifestPath}: unsupported plugin type "${raw.type}" (only "template" is supported today)`);
  }
  return raw as PluginManifest;
}

/**
 * Discovers first-party templates: every immediate subdirectory of
 * templatesDir containing a foundry.plugin.json. Community templates aren't
 * discovered from arbitrary paths yet — see docs/development-plan.md Phase 1.
 */
export function listTemplates(templatesDir: string): TemplateEntry[] {
  if (!existsSync(templatesDir)) return [];

  return readdirSync(templatesDir)
    .filter((name) => statSync(join(templatesDir, name)).isDirectory())
    .flatMap((id) => {
      const dir = join(templatesDir, id);
      const manifestPath = join(dir, "foundry.plugin.json");
      if (!existsSync(manifestPath)) return [];
      return [{ id, manifest: readManifest(manifestPath), path: dir }];
    });
}

export function getTemplate(templatesDir: string, id: string): TemplateEntry | null {
  return listTemplates(templatesDir).find((t) => t.id === id) ?? null;
}

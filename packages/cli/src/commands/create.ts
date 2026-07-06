import { Command } from "commander";
import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getTemplate } from "../templates/registry.js";
import { loadConfig } from "../config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = resolve(__dirname, "../templates");
const FALLBACK_TEMPLATE = "minimal";

/** npm-safe package name derived from the requested app name, e.g. "My App!" -> "my-app". */
function toPackageName(name: string): string {
  return basename(name)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "my-foundry-app";
}

/** Rewrites the scaffolded package.json's "name" so it matches the app the user actually asked for. */
function renamePackageJson(dest: string, name: string): void {
  const pkgPath = join(dest, "package.json");
  if (!existsSync(pkgPath)) return;
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  pkg.name = toPackageName(name);
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

export const createCommand = new Command("create")
  .description("Scaffold a new app from a Foundry starter template")
  .argument("<name>", "Directory name to create")
  .option(
    "-t, --template <id>",
    "Template to use — see `foundry templates` (default: foundry.config.yml's defaultTemplate, or \"minimal\")",
  )
  .action((name: string, opts: { template?: string }) => {
    const dest = resolve(process.cwd(), name);
    if (existsSync(dest)) {
      console.error(`Directory already exists: ${dest}`);
      process.exitCode = 1;
      return;
    }

    const templateId = opts.template ?? loadConfig().defaultTemplate ?? FALLBACK_TEMPLATE;
    const template = getTemplate(TEMPLATES_DIR, templateId);
    if (!template) {
      console.error(`Unknown template "${templateId}". Run \`foundry templates\` to see what's available.`);
      process.exitCode = 1;
      return;
    }

    cpSync(template.path, dest, { recursive: true, filter: (src) => !src.endsWith("foundry.plugin.json") });
    renamePackageJson(dest, name);
    console.log(`Created ${name} from the "${template.manifest.name}" template.`);
    console.log("This is Phase 1 scaffolding — static starters, not AI-generated apps yet.");
  });

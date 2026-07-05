import { Command } from "commander";
import { cpSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getTemplate } from "../templates/registry.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = resolve(__dirname, "../templates");

export const createCommand = new Command("create")
  .description("Scaffold a new app from a Foundry starter template")
  .argument("<name>", "Directory name to create")
  .option("-t, --template <id>", "Template to use — see `foundry templates`", "minimal")
  .action((name: string, opts: { template: string }) => {
    const dest = resolve(process.cwd(), name);
    if (existsSync(dest)) {
      console.error(`Directory already exists: ${dest}`);
      process.exitCode = 1;
      return;
    }

    const template = getTemplate(TEMPLATES_DIR, opts.template);
    if (!template) {
      console.error(`Unknown template "${opts.template}". Run \`foundry templates\` to see what's available.`);
      process.exitCode = 1;
      return;
    }

    cpSync(template.path, dest, { recursive: true, filter: (src) => !src.endsWith("foundry.plugin.json") });
    console.log(`Created ${name} from the "${template.manifest.name}" template.`);
    console.log("This is Phase 1 scaffolding — static starters, not AI-generated apps yet.");
  });

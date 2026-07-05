import { Command } from "commander";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { listTemplates } from "../templates/registry.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = resolve(__dirname, "../templates");

export const templatesCommand = new Command("templates")
  .description("List available `foundry create --template` starters")
  .action(() => {
    const templates = listTemplates(TEMPLATES_DIR);
    if (templates.length === 0) {
      console.log("No templates found.");
      return;
    }
    for (const t of templates) {
      console.log(`${t.id}\t${t.manifest.description}`);
    }
  });

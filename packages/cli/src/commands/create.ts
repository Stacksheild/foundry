import { Command } from "commander";
import { cpSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const createCommand = new Command("create")
  .description("Scaffold a new app from Foundry's minimal starter template")
  .argument("<name>", "Directory name to create")
  .action((name: string) => {
    const dest = resolve(process.cwd(), name);
    if (existsSync(dest)) {
      console.error(`Directory already exists: ${dest}`);
      process.exitCode = 1;
      return;
    }
    const templateDir = resolve(__dirname, "../templates/minimal");
    cpSync(templateDir, dest, { recursive: true });
    console.log(`Created ${name} from the minimal template.`);
    console.log("This is Phase 1 scaffolding — one static starter, not an AI-generated app.");
  });

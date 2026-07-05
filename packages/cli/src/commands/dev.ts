import { Command } from "commander";
import { spawn } from "node:child_process";

export const devCommand = new Command("dev")
  .description("Start the Foundry web app in dev mode")
  .action(() => {
    const child = spawn("pnpm", ["--filter", "@foundry/web", "dev"], {
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.on("exit", (code) => {
      process.exitCode = code ?? 0;
    });
  });

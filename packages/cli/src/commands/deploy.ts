import { Command } from "commander";
import { getDb, deployApp, AppNotFoundError } from "@foundry/app-registry";
import { createComputeProvider } from "@foundry/compute-providers";

export const deployCommand = new Command("deploy")
  .description("Deploy a registered app to a real exe.dev sandbox VM")
  .argument("<name>", "App name (must already be registered via `foundry apps register`)")
  .option("--cpu <n>", "CPU cores for the VM")
  .option("--memory <size>", "e.g. 4GB")
  .option("--image <image>", "container image")
  .action(async (name: string, opts: { cpu?: string; memory?: string; image?: string }) => {
    const db = getDb();
    const provider = createComputeProvider("exedev");

    try {
      const app = await deployApp(db, provider, name, {
        cpu: opts.cpu ? Number(opts.cpu) : undefined,
        memory: opts.memory,
        image: opts.image,
      });
      console.log(`Deployed ${name} — ${app.url} (${app.status})`);
    } catch (err) {
      if (err instanceof AppNotFoundError) {
        console.error(`${err.message}. Run \`foundry apps register ${name}\` first.`);
      } else {
        console.error(`Deploy failed: ${err instanceof Error ? err.message : String(err)}`);
      }
      process.exitCode = 1;
    }
  });

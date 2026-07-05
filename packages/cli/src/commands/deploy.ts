import { Command } from "commander";
import { getDb, getApp, updateApp } from "@foundry/app-registry";
import { createComputeProvider } from "@foundry/compute-providers";

export const deployCommand = new Command("deploy")
  .description("Deploy a registered app to a real exe.dev sandbox VM")
  .argument("<name>", "App name (must already be registered via `foundry apps register`)")
  .option("--cpu <n>", "CPU cores for the VM")
  .option("--memory <size>", "e.g. 4GB")
  .option("--image <image>", "container image")
  .action(async (name: string, opts: { cpu?: string; memory?: string; image?: string }) => {
    const db = getDb();
    const app = getApp(db, name);
    if (!app) {
      console.error(`No app named "${name}". Run \`foundry apps register ${name}\` first.`);
      process.exitCode = 1;
      return;
    }

    const provider = createComputeProvider("exedev");
    updateApp(db, name, { status: "deploying" });

    if (app.vmName) {
      try {
        await provider.destroy(app.vmName);
        console.log(`Destroyed previous VM ${app.vmName} for a fresh deploy.`);
      } catch (err) {
        console.error(
          `Warning: couldn't destroy previous VM ${app.vmName} (continuing anyway): ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    try {
      const vm = await provider.create({
        name,
        cpu: opts.cpu ? Number(opts.cpu) : undefined,
        memory: opts.memory,
        image: opts.image,
      });
      updateApp(db, name, { status: "healthy", url: vm.httpsUrl, vmName: vm.name });
      console.log(`Deployed ${name} — ${vm.httpsUrl} (${vm.status})`);
    } catch (err) {
      updateApp(db, name, { status: "error" });
      console.error(`Deploy failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exitCode = 1;
    }
  });

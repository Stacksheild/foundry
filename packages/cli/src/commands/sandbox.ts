import { Command } from "commander";
import { createComputeProvider } from "@foundry/compute-providers";

export const sandboxCommand = new Command("sandbox").description(
  "Manage exe.dev sandbox VMs (dark-factory compute — create/list/destroy disposable VMs)",
);

sandboxCommand
  .command("new")
  .description("Create a new sandbox VM")
  .argument("<name>", "VM name")
  .option("--cpu <n>", "CPU cores")
  .option("--memory <size>", "e.g. 4GB")
  .option("--image <image>", "container image")
  .action(async (name: string, opts: { cpu?: string; memory?: string; image?: string }) => {
    try {
      const provider = createComputeProvider("exedev");
      const vm = await provider.create({
        name,
        cpu: opts.cpu ? Number(opts.cpu) : undefined,
        memory: opts.memory,
        image: opts.image,
      });
      console.log(`Created ${vm.name} — ${vm.httpsUrl} (${vm.status})`);
    } catch (err) {
      console.error(`Failed to create sandbox: ${err instanceof Error ? err.message : String(err)}`);
      process.exitCode = 1;
    }
  });

sandboxCommand
  .command("ls")
  .description("List your sandbox VMs")
  .action(async () => {
    try {
      const provider = createComputeProvider("exedev");
      const vms = await provider.list();
      if (vms.length === 0) {
        console.log("No sandbox VMs.");
        return;
      }
      for (const vm of vms) {
        console.log(`${vm.name}\t${vm.status}\t${vm.httpsUrl}`);
      }
    } catch (err) {
      console.error(`Failed to list sandboxes: ${err instanceof Error ? err.message : String(err)}`);
      process.exitCode = 1;
    }
  });

sandboxCommand
  .command("rm")
  .description("Destroy a sandbox VM")
  .argument("<name>", "VM name")
  .action(async (name: string) => {
    try {
      const provider = createComputeProvider("exedev");
      await provider.destroy(name);
      console.log(`Destroyed ${name}`);
    } catch (err) {
      console.error(`Failed to destroy sandbox: ${err instanceof Error ? err.message : String(err)}`);
      process.exitCode = 1;
    }
  });

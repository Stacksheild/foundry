import { Command } from "commander";
import { getDb, registerApp, listApps, getApp, DuplicateAppError, type AppEnv } from "@foundry/app-registry";

export const appsCommand = new Command("apps").description(
  "Manage the local app registry (real SQLite-backed storage, shared with apps/api)",
);

appsCommand
  .command("ls")
  .description("List registered apps")
  .action(() => {
    const apps = listApps(getDb());
    if (apps.length === 0) {
      console.log("No apps registered yet. Run `foundry apps register <name>` to add one.");
      return;
    }
    for (const app of apps) {
      console.log(`${app.name}\t${app.env}\t${app.status}\tv${app.version}${app.team ? `\t${app.team}` : ""}`);
    }
  });

appsCommand
  .command("register")
  .description("Register a new app")
  .argument("<name>", "App name")
  .option("-e, --env <env>", "dev, staging, or production", "dev")
  .option("-t, --team <team>", "Owning team")
  .option("-v, --version <version>", "Initial version", "0.1.0")
  .action((name: string, opts: { env: AppEnv; team?: string; version: string }) => {
    try {
      const app = registerApp(getDb(), { name, env: opts.env, team: opts.team, version: opts.version });
      console.log(`Registered ${app.name} (${app.env}, v${app.version})`);
    } catch (err) {
      if (err instanceof DuplicateAppError) {
        console.error(err.message);
      } else {
        console.error(`Failed to register app: ${err instanceof Error ? err.message : String(err)}`);
      }
      process.exitCode = 1;
    }
  });

appsCommand
  .command("show")
  .description("Show one app's details")
  .argument("<name>", "App name")
  .action((name: string) => {
    const app = getApp(getDb(), name);
    if (!app) {
      console.error(`No app named "${name}". Run \`foundry apps ls\` to see what's registered.`);
      process.exitCode = 1;
      return;
    }
    console.log(JSON.stringify(app, null, 2));
  });

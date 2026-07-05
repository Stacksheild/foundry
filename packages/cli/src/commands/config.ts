import { Command } from "commander";
import { findConfigPath, loadConfig } from "../config.js";

export const configCommand = new Command("config")
  .description("Show the resolved foundry.config.yml (golden-path defaults)")
  .action(() => {
    const path = findConfigPath();
    if (!path) {
      console.log("No foundry.config.yml found (walked up from the current directory). Using built-in defaults.");
      return;
    }
    console.log(`Loaded from ${path}:`);
    console.log(JSON.stringify(loadConfig(), null, 2));
  });

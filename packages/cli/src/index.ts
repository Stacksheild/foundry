#!/usr/bin/env node
import { Command } from "commander";
import { scanCommand } from "./commands/scan.js";
import { sandboxCommand } from "./commands/sandbox.js";
import { createCommand } from "./commands/create.js";
import { templatesCommand } from "./commands/templates.js";
import { configCommand } from "./commands/config.js";
import { chatCommand } from "./commands/chat.js";
import { appsCommand } from "./commands/apps.js";
import { devCommand } from "./commands/dev.js";

const program = new Command()
  .name("foundry")
  .description("Foundry — AI pair-programmer for internal tools")
  .version("0.1.0");

program.addCommand(scanCommand);
program.addCommand(sandboxCommand);
program.addCommand(createCommand);
program.addCommand(templatesCommand);
program.addCommand(configCommand);
program.addCommand(chatCommand);
program.addCommand(appsCommand);
program.addCommand(devCommand);

program.parse();

import { Command } from "commander";

import { runDiscovery } from "../interactive/discovery.js";
import { runSetup } from "../interactive/setup.js";

export function registerInteractiveCommands(program: Command): void {
  program
    .command("discover")
    .description("Interactive resource explorer (Clack)")
    .action(async () => {
      await runDiscovery(program);
    });

  program
    .command("setup")
    .description("Interactive local configuration (writes .env.local)")
    .action(async () => {
      await runSetup();
    });
}

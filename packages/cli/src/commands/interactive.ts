import { Command } from "commander";

import { runDiscovery } from "../interactive/discovery.js";
import { runOnboarding } from "../interactive/onboarding.js";

export function registerInteractiveCommands(program: Command): void {
  program
    .command("discover")
    .description("Interactive resource explorer (Clack)")
    .action(async () => {
      await runDiscovery(program);
    });

  program
    .command("onboarding")
    .description("Interactive setup guidance (Clack)")
    .action(async () => {
      await runOnboarding();
    });
}

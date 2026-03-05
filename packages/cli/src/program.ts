import { Command } from "commander";

import { registerInteractiveCommands } from "./commands/interactive.js";
import { registerLobstersCommands } from "./commands/lobsters.js";

export function createProgram(): Command {
  const program = new Command();

  program
    .name("chowda")
    .description("CLI for Lobste.rs content and tooling")
    .showHelpAfterError("\nRun `pnpm --silent cli --help` for usage.")
    .allowExcessArguments(false)
    .allowUnknownOption(false);

  registerLobstersCommands(program);
  registerInteractiveCommands(program);

  return program;
}

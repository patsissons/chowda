import { loadEnvFilesIntoProcessEnv } from "./config.js";
import { handleCliError } from "./core/errors.js";
import { runDiscovery } from "./interactive/discovery.js";
import { createProgram } from "./program.js";

async function main(): Promise<void> {
  loadEnvFilesIntoProcessEnv();

  const program = createProgram();
  const args = process.argv.slice(2);

  try {
    if (args.length === 0 && process.stdout.isTTY && process.stdin.isTTY) {
      await runDiscovery(program);
      return;
    }

    await program.parseAsync(process.argv);
  } catch (error) {
    handleCliError(error);
  }
}

await main();

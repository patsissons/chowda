import { intro, isCancel, note, outro, text } from "@clack/prompts";

import { ENV_LOCAL_PATH, resolveRuntimeConfig, writeEnvLocal } from "../config.js";
import { fail } from "../core/errors.js";
import { normalizeBaseUrl } from "../lobsters/api.js";

function examplesFromDefaults(baseUrl: string, timeoutMs: number): string {
  return [
    `pnpm --silent cli feed hottest --base-url ${baseUrl} --timeout-ms ${timeoutMs} --json`,
    `pnpm --silent cli search rust ffi --base-url ${baseUrl} --timeout-ms ${timeoutMs} --json`,
    `pnpm --silent cli story abc123 --base-url ${baseUrl} --timeout-ms ${timeoutMs}`
  ].join("\n");
}

export async function runSetup(): Promise<void> {
  intro("chowda CLI setup");

  const runtimeConfig = resolveRuntimeConfig();

  const baseUrlInput = await text({
    message: "Default Lobsters base URL",
    initialValue: runtimeConfig.baseUrl,
    validate(value) {
      if (!String(value).trim()) {
        return "Base URL is required";
      }
      return undefined;
    }
  });

  if (isCancel(baseUrlInput)) {
    outro("Setup cancelled.");
    return;
  }

  const timeoutInput = await text({
    message: "Default timeout (ms)",
    initialValue: String(runtimeConfig.timeoutMs),
    validate(value) {
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed < 1) {
        return "Use a positive integer";
      }
      return undefined;
    }
  });

  if (isCancel(timeoutInput)) {
    outro("Setup cancelled.");
    return;
  }

  const normalizedBaseUrl = normalizeBaseUrl(baseUrlInput);
  const timeoutMs = Number(timeoutInput);

  try {
    writeEnvLocal({
      baseUrl: normalizedBaseUrl,
      timeoutMs
    });
  } catch (error) {
    fail(`Failed to write ${ENV_LOCAL_PATH}: ${error instanceof Error ? error.message : String(error)}`);
  }

  note(
    JSON.stringify(
      {
        baseUrl: normalizedBaseUrl,
        timeoutMs
      },
      null,
      2
    ),
    "Saved defaults"
  );
  note(ENV_LOCAL_PATH, "Wrote file");
  note(examplesFromDefaults(normalizedBaseUrl, timeoutMs), "Commands to try");
  outro("Setup complete.");
}

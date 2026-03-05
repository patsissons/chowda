import { intro, isCancel, note, outro, text } from "@clack/prompts";

import { DEFAULT_BASE_URL, DEFAULT_TIMEOUT_MS } from "../config.js";
import { normalizeBaseUrl } from "../lobsters/api.js";

function examplesFromDefaults(baseUrl: string, timeoutMs: number): string {
  return [
    `pnpm --silent cli feed hottest --base-url ${baseUrl} --timeout-ms ${timeoutMs} --json`,
    `pnpm --silent cli search rust ffi --base-url ${baseUrl} --timeout-ms ${timeoutMs} --json`,
    `pnpm --silent cli story abc123 --base-url ${baseUrl} --timeout-ms ${timeoutMs}`
  ].join("\n");
}

export async function runOnboarding(): Promise<void> {
  intro("chowda CLI onboarding");

  const baseUrlInput = await text({
    message: "Default Lobsters base URL",
    initialValue: DEFAULT_BASE_URL,
    validate(value) {
      if (!String(value).trim()) {
        return "Base URL is required";
      }
      return undefined;
    }
  });

  if (isCancel(baseUrlInput)) {
    outro("Onboarding cancelled.");
    return;
  }

  const timeoutInput = await text({
    message: "Default timeout (ms)",
    initialValue: String(DEFAULT_TIMEOUT_MS),
    validate(value) {
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed < 1) {
        return "Use a positive integer";
      }
      return undefined;
    }
  });

  if (isCancel(timeoutInput)) {
    outro("Onboarding cancelled.");
    return;
  }

  const normalizedBaseUrl = normalizeBaseUrl(baseUrlInput);
  const timeoutMs = Number(timeoutInput);

  note(
    JSON.stringify(
      {
        baseUrl: normalizedBaseUrl,
        timeoutMs
      },
      null,
      2
    ),
    "Recommended defaults"
  );

  note(examplesFromDefaults(normalizedBaseUrl, timeoutMs), "Commands to try");
  outro("Onboarding complete.");
}

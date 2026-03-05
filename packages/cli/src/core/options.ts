import { Command, InvalidArgumentError } from "commander";

import { DEFAULT_BASE_URL, DEFAULT_TIMEOUT_MS } from "../config.js";
import { normalizeBaseUrl } from "../lobsters/api.js";
import { CommonOptions } from "../types.js";

export function parsePositiveInteger(label: string) {
  return (value: string): number => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new InvalidArgumentError(`Invalid ${label}: ${value}`);
    }
    return parsed;
  };
}

export function addCommonOptions(command: Command): Command {
  return command
    .option("--base-url <url>", "override Lobsters base URL", DEFAULT_BASE_URL)
    .option(
      "--timeout-ms <ms>",
      "request timeout in milliseconds",
      parsePositiveInteger("timeout-ms"),
      DEFAULT_TIMEOUT_MS
    )
    .option("--json", "print JSON output", false)
    .option("--raw", "print raw response body", false);
}

export function addListOptions(command: Command): Command {
  return addCommonOptions(command)
    .option("--page <number>", "page number", parsePositiveInteger("page"), 1)
    .option("--limit <number>", "limit output rows", parsePositiveInteger("limit"), 0);
}

export function addStoryOptions(command: Command): Command {
  return addCommonOptions(command).option(
    "--limit <number>",
    "limit output comments",
    parsePositiveInteger("limit"),
    0
  );
}

export function normalizeCommonOptions<T extends CommonOptions>(options: T): T {
  return {
    ...options,
    baseUrl: normalizeBaseUrl(options.baseUrl)
  };
}

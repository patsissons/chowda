import { CliError, fail } from "../core/errors.js";
import { CommonOptions } from "../types.js";

export function normalizeBaseUrl(url: string): string {
  return String(url).trim().replace(/\/$/, "");
}

export async function fetchText(url: string, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "chowda-cli/0.1"
      }
    });

    const body = await response.text();

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status} for ${url}`) as Error & {
        status?: number;
        body?: string;
      };
      error.status = response.status;
      error.body = body;
      throw error;
    }

    return body;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new CliError(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export function parseJson(text: string, url: string): unknown {
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`Expected JSON response from ${url}, got parse error: ${(error as Error).message}`);
  }
}

export function asArray<T>(value: unknown): T[] {
  if (!Array.isArray(value)) {
    fail("Expected an array response");
  }
  return value as T[];
}

export async function executeRequest(url: string, options: CommonOptions): Promise<string | null> {
  const textValue = await fetchText(url, options.timeoutMs);

  if (options.raw) {
    process.stdout.write(`${textValue}\n`);
    return null;
  }

  return textValue;
}

export class CliError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CliError";
  }
}

export function fail(message: string): never {
  throw new CliError(message);
}

export function handleCliError(error: unknown): never {
  if (error && typeof error === "object" && "code" in error) {
    const candidate = error as { code?: string; exitCode?: number };
    if (candidate.code === "commander.helpDisplayed") {
      process.exit(0);
    }

    if (typeof candidate.exitCode === "number") {
      process.exit(candidate.exitCode);
    }
  }

  if (error && typeof error === "object" && "status" in error) {
    const httpError = error as { message: string; body?: string };
    const bodySnippet = String(httpError.body ?? "")
      .slice(0, 300)
      .replace(/\s+/g, " ");
    process.stderr.write(`${httpError.message}${bodySnippet ? `: ${bodySnippet}` : ""}\n`);
    process.exit(1);
  }

  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}

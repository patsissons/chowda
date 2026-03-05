import { confirm, intro, isCancel, note, outro, select, text } from "@clack/prompts";
import { Command, InvalidArgumentError } from "commander";

const DEFAULT_BASE_URL = "https://lobste.rs";
const DEFAULT_TIMEOUT_MS = 15_000;

class CliError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CliError";
  }
}

type CommonOptions = {
  baseUrl: string;
  timeoutMs: number;
  raw: boolean;
  json: boolean;
};

type ListOptions = CommonOptions & {
  page: number;
  limit: number;
};

type StoryOptions = CommonOptions & {
  limit: number;
};

function fail(message: string): never {
  throw new CliError(message);
}

function parsePositiveInteger(label: string) {
  return (value: string): number => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new InvalidArgumentError(`Invalid ${label}: ${value}`);
    }
    return parsed;
  };
}

function normalizeBaseUrl(url: string): string {
  return String(url).trim().replace(/\/$/, "");
}

function htmlToText(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function joinUrl(baseUrl: string, pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }
  return `${baseUrl}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

async function fetchText(url: string, timeoutMs: number): Promise<string> {
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

function parseJson(text: string, url: string): unknown {
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`Expected JSON response from ${url}, got parse error: ${(error as Error).message}`);
  }
}

function asArray<T>(value: unknown): T[] {
  if (!Array.isArray(value)) {
    fail("Expected an array response");
  }
  return value as T[];
}

function truncate(value: unknown, max: number): string {
  const textValue = String(value ?? "");
  if (textValue.length <= max) {
    return textValue;
  }
  return `${textValue.slice(0, max - 1)}...`;
}

function formatTable(rows: string[][], headers: string[]): void {
  const widths = headers.map((header) => header.length);

  rows.forEach((row) => {
    row.forEach((cell, index) => {
      widths[index] = Math.max(widths[index], String(cell).length);
    });
  });

  const line = (cells: string[]) =>
    cells
      .map((cell, index) => String(cell).padEnd(widths[index]))
      .join("  ")
      .trimEnd();

  const separator = widths.map((width) => "-".repeat(width)).join("  ");
  const output = [line(headers), separator, ...rows.map((row) => line(row))].join("\n");
  process.stdout.write(`${output}\n`);
}

type LobstersStory = {
  short_id: string;
  score: number;
  comment_count: number;
  title: string;
  url?: string;
  comments_url?: string;
  submitter_user?: string;
  tags?: string[];
  comments?: Array<{
    short_id: string;
    score?: number;
    depth?: number;
    commenting_user: string;
    comment_plain?: string;
  }>;
};

type LobstersTag = {
  tag: string;
  category: string;
  active: boolean;
  description?: string;
};

type LobstersUser = {
  username?: string;
  karma?: number;
  created_at?: string;
  is_admin?: boolean;
  is_moderator?: boolean;
  invited_by_user?: string;
  github_username?: string;
  avatar_url?: string;
};

function storyRows(posts: LobstersStory[]): string[][] {
  return posts.map((post) => [
    post.short_id,
    String(post.score),
    String(post.comment_count),
    truncate(post.title, 72)
  ]);
}

function printPosts(posts: LobstersStory[], options: ListOptions): void {
  const output = options.limit > 0 ? posts.slice(0, options.limit) : posts;

  if (options.json) {
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    return;
  }

  formatTable(storyRows(output), ["id", "score", "comments", "title"]);
}

function printUser(user: LobstersUser, options: CommonOptions): void {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(user, null, 2)}\n`);
    return;
  }

  const rows = [
    ["username", user.username ?? ""],
    ["karma", String(user.karma ?? "")],
    ["created_at", user.created_at ?? ""],
    ["is_admin", String(Boolean(user.is_admin))],
    ["is_moderator", String(Boolean(user.is_moderator))],
    ["invited_by_user", user.invited_by_user ?? ""],
    ["github_username", user.github_username ?? ""],
    ["avatar_url", user.avatar_url ?? ""]
  ];

  formatTable(rows, ["field", "value"]);
}

function printTags(tags: LobstersTag[], options: Omit<ListOptions, "page">): void {
  const output = options.limit > 0 ? tags.slice(0, options.limit) : tags;

  if (options.json) {
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    return;
  }

  const rows = output.map((tag) => [
    tag.tag,
    tag.category,
    tag.active ? "active" : "inactive",
    truncate(tag.description ?? "", 62)
  ]);
  formatTable(rows, ["tag", "category", "state", "description"]);
}

function printStoryDetails(story: LobstersStory, options: StoryOptions): void {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(story, null, 2)}\n`);
    return;
  }

  const headerRows = [
    ["id", story.short_id ?? ""],
    ["title", story.title ?? ""],
    ["submitter", story.submitter_user ?? ""],
    ["score", String(story.score ?? "")],
    ["comments", String(story.comment_count ?? "")],
    ["url", story.url ?? ""],
    ["comments_url", story.comments_url ?? ""],
    ["tags", Array.isArray(story.tags) ? story.tags.join(", ") : ""]
  ];

  formatTable(headerRows, ["field", "value"]);

  if (!Array.isArray(story.comments) || story.comments.length === 0) {
    return;
  }

  process.stdout.write("\nTop comments:\n");
  const rows = story.comments.slice(0, options.limit > 0 ? options.limit : 10).map((comment) => [
    comment.short_id,
    String(comment.score ?? ""),
    String(comment.depth ?? ""),
    comment.commenting_user,
    truncate(comment.comment_plain ?? "", 64)
  ]);
  formatTable(rows, ["id", "score", "depth", "user", "text"]);
}

function parseSearchHtml(html: string, baseUrl: string): LobstersStory[] {
  const blocks = html.split('<li id="story_').slice(1);
  const results: LobstersStory[] = [];

  for (const block of blocks) {
    const end = block.indexOf("</li>");
    if (end === -1) {
      continue;
    }
    const item = block.slice(0, end);

    const shortIdMatch = item.match(/data-shortid="([^"]+)"/);
    const linkMatch = item.match(/<span[^>]*class="link[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    const submitterMatch = item.match(/<a class="u-author[^>]*>([^<]+)<\/a>/);
    const commentsMatch = item.match(
      /<span class="comments_label">[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>[\s\S]*?(\d+)\s+comments?/
    );
    const scoreMatch = item.match(/<a class="upvoter"[^>]*>(\d+|~)<\/a>/);

    if (!shortIdMatch || !linkMatch || !submitterMatch) {
      continue;
    }

    const tagMatches = [...item.matchAll(/<a class="tag[^>]*>([^<]+)<\/a>/g)];

    results.push({
      short_id: shortIdMatch[1],
      title: htmlToText(linkMatch[2]),
      url: joinUrl(baseUrl, htmlToText(linkMatch[1])),
      score: scoreMatch && scoreMatch[1] !== "~" ? Number(scoreMatch[1]) : 0,
      submitter_user: htmlToText(submitterMatch[1]),
      tags: tagMatches.map((match) => htmlToText(match[1])),
      comment_count: commentsMatch ? Number(commentsMatch[2]) : 0,
      comments_url: commentsMatch ? joinUrl(baseUrl, htmlToText(commentsMatch[1])) : ""
    });
  }

  return results;
}

function addCommonOptions(command: Command): Command {
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

function addListOptions(command: Command): Command {
  return addCommonOptions(command)
    .option("--page <number>", "page number", parsePositiveInteger("page"), 1)
    .option("--limit <number>", "limit output rows", parsePositiveInteger("limit"), 0);
}

function addStoryOptions(command: Command): Command {
  return addCommonOptions(command).option(
    "--limit <number>",
    "limit output comments",
    parsePositiveInteger("limit"),
    0
  );
}

function examplesFromDefaults(baseUrl: string, timeoutMs: number): string {
  return [
    `pnpm --silent cli feed hottest --base-url ${baseUrl} --timeout-ms ${timeoutMs} --json`,
    `pnpm --silent cli search rust ffi --base-url ${baseUrl} --timeout-ms ${timeoutMs} --json`,
    `pnpm --silent cli story abc123 --base-url ${baseUrl} --timeout-ms ${timeoutMs}`
  ].join("\n");
}

async function runDiscovery(program: Command): Promise<void> {
  intro("chowda CLI discovery");

  const action = await select({
    message: "Choose a command to start with",
    options: [
      { label: "Feed (hottest/newest/active)", value: "feed" },
      { label: "Search stories", value: "search" },
      { label: "Fetch one story", value: "story" },
      { label: "Show full help", value: "help" },
      { label: "Exit", value: "exit" }
    ]
  });

  if (isCancel(action) || action === "exit") {
    outro("No changes made.");
    return;
  }

  if (action === "help") {
    program.outputHelp();
    outro("Use `pnpm --silent cli <command> --help` for command-level help.");
    return;
  }

  const examples: Record<string, string> = {
    feed: "pnpm --silent cli feed hottest --json | jq '.[0]'",
    search: "pnpm --silent cli search rust ffi --json | jq '.[].title'",
    story: "pnpm --silent cli story abc123 --json | jq '.title'"
  };

  note(examples[action], "Example");

  const showHelp = await confirm({
    message: "Show full CLI help now?",
    initialValue: false
  });

  if (isCancel(showHelp)) {
    outro("Cancelled.");
    return;
  }

  if (showHelp) {
    program.outputHelp();
  }

  outro("Discovery complete.");
}

async function runOnboarding(): Promise<void> {
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

function normalizeCommonOptions(options: CommonOptions): CommonOptions {
  return {
    ...options,
    baseUrl: normalizeBaseUrl(options.baseUrl)
  };
}

async function executeRequest(url: string, options: CommonOptions): Promise<string | null> {
  const textValue = await fetchText(url, options.timeoutMs);

  if (options.raw) {
    process.stdout.write(`${textValue}\n`);
    return null;
  }

  return textValue;
}

function buildProgram(): Command {
  const program = new Command();

  program
    .name("chowda")
    .description("CLI for Lobste.rs content and tooling")
    .showHelpAfterError("\nRun `pnpm --silent cli --help` for usage.")
    .allowExcessArguments(false)
    .allowUnknownOption(false);

  addListOptions(program.command("feed <type>").description("Fetch hottest, newest, or active feed pages"))
    .addHelpText(
      "after",
      "\nExamples:\n  pnpm --silent cli feed hottest --json\n  pnpm --silent cli feed newest --page 2"
    )
    .action(async (type: string, options: ListOptions) => {
      const normalized = normalizeCommonOptions(options) as ListOptions;
      const validTypes = new Set(["hottest", "newest", "active"]);
      if (!validTypes.has(type)) {
        fail(`Unsupported feed type: ${type}. Use hottest|newest|active`);
      }

      const path =
        type === "hottest"
          ? `/page/${normalized.page}.json`
          : `/${type}/page/${normalized.page}.json`;
      const url = `${normalized.baseUrl}${path}`;

      const textValue = await executeRequest(url, normalized);
      if (textValue === null) {
        return;
      }

      const data = parseJson(textValue, url);
      printPosts(asArray<LobstersStory>(data), normalized);
    });

  addListOptions(program.command("tag <tag>").description("Fetch stories for a tag"))
    .addHelpText("after", "\nExample:\n  pnpm --silent cli tag rust --page 2 --json")
    .action(async (tag: string, options: ListOptions) => {
      const normalized = normalizeCommonOptions(options) as ListOptions;
      const url = `${normalized.baseUrl}/t/${encodeURIComponent(tag)}/page/${normalized.page}.json`;

      const textValue = await executeRequest(url, normalized);
      if (textValue === null) {
        return;
      }

      const data = parseJson(textValue, url);
      printPosts(asArray<LobstersStory>(data), normalized);
    });

  addListOptions(program.command("domain <domain>").description("Fetch stories for a domain"))
    .addHelpText("after", "\nExample:\n  pnpm --silent cli domain github.com --json")
    .action(async (domain: string, options: ListOptions) => {
      const normalized = normalizeCommonOptions(options) as ListOptions;
      const url = `${normalized.baseUrl}/domains/${encodeURIComponent(domain)}/page/${normalized.page}.json`;

      const textValue = await executeRequest(url, normalized);
      if (textValue === null) {
        return;
      }

      const data = parseJson(textValue, url);
      printPosts(asArray<LobstersStory>(data), normalized);
    });

  addStoryOptions(program.command("story <shortId>").description("Fetch a single story and its comments"))
    .addHelpText("after", "\nExample:\n  pnpm --silent cli story jr3zym --json")
    .action(async (shortId: string, options: StoryOptions) => {
      const normalized = normalizeCommonOptions(options) as StoryOptions;
      const url = `${normalized.baseUrl}/s/${encodeURIComponent(shortId)}.json`;

      const textValue = await executeRequest(url, normalized);
      if (textValue === null) {
        return;
      }

      const data = parseJson(textValue, url) as LobstersStory;
      printStoryDetails(data, normalized);
    });

  addCommonOptions(program.command("user <username>").description("Fetch a Lobsters user profile"))
    .addHelpText("after", "\nExample:\n  pnpm --silent cli user jcs --json")
    .action(async (username: string, options: CommonOptions) => {
      const normalized = normalizeCommonOptions(options);
      const url = `${normalized.baseUrl}/~${encodeURIComponent(username)}.json`;

      const textValue = await executeRequest(url, normalized);
      if (textValue === null) {
        return;
      }

      const data = parseJson(textValue, url) as LobstersUser;
      printUser(data, normalized);
    });

  addCommonOptions(
    program.command("tags").description("Fetch all Lobsters tags")
  )
    .option("--limit <number>", "limit output rows", parsePositiveInteger("limit"), 0)
    .addHelpText("after", "\nExample:\n  pnpm --silent cli tags --json | jq '.[0]'")
    .action(async (options: Omit<ListOptions, "page">) => {
      const normalized = normalizeCommonOptions(options) as Omit<ListOptions, "page">;
      const url = `${normalized.baseUrl}/tags.json`;

      const textValue = await executeRequest(url, normalized);
      if (textValue === null) {
        return;
      }

      const data = parseJson(textValue, url);
      printTags(asArray<LobstersTag>(data), normalized);
    });

  addListOptions(program.command("search <query...>").description("Search Lobsters stories"))
    .addHelpText("after", "\nExample:\n  pnpm --silent cli search rust ffi --page 1 --json")
    .action(async (queryParts: string[], options: ListOptions) => {
      const normalized = normalizeCommonOptions(options) as ListOptions;
      const query = queryParts.join(" ").trim();
      if (!query) {
        fail("search requires a query");
      }

      const queryParams = new URLSearchParams({
        what: "stories",
        order: "newest",
        q: query,
        page: String(normalized.page)
      });
      const url = `${normalized.baseUrl}/search?${queryParams.toString()}`;

      const textValue = await executeRequest(url, normalized);
      if (textValue === null) {
        return;
      }

      const parsed = parseSearchHtml(textValue, normalized.baseUrl);
      printPosts(parsed, normalized);
    });

  program
    .command("discover")
    .description("Interactive command discovery (Clack)")
    .action(async () => {
      await runDiscovery(program);
    });

  program
    .command("onboarding")
    .description("Interactive setup guidance (Clack)")
    .action(async () => {
      await runOnboarding();
    });

  return program;
}

function handleError(error: unknown): never {
  if (error && typeof error === "object" && "code" in error) {
    const candidate = error as { code?: string; exitCode?: number; message?: string };
    if (candidate.code === "commander.helpDisplayed") {
      process.exit(0);
    }

    if (typeof candidate.exitCode === "number") {
      process.exit(candidate.exitCode);
    }
  }

  if (error && (error as Error).name === "AbortError") {
    process.stderr.write(`${(error as Error).message}\n`);
    process.exit(1);
  } else if (error && typeof error === "object" && "status" in error) {
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

async function main(): Promise<void> {
  const program = buildProgram();
  const args = process.argv.slice(2);

  if (args.length === 0 && process.stdout.isTTY && process.stdin.isTTY) {
    await runDiscovery(program);
    return;
  }

  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    handleError(error);
  }
}

await main();

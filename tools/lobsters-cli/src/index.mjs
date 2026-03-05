#!/usr/bin/env node

const DEFAULT_BASE_URL = "https://lobste.rs";
const DEFAULT_TIMEOUT_MS = 15000;

function printHelp() {
  const text = `lobsters-cli

Usage:
  lobsters <command> [args] [options]

Commands:
  help
  feed <hottest|newest|active> [--page N]
  tag <tag> [--page N]
  domain <domain> [--page N]
  story <short-id>
  user <username>
  tags
  search <query> [--page N]

Options:
  --page N         Page number (default: 1)
  --limit N        Limit output rows for list commands
  --json           Print JSON output
  --raw            Print raw response body
  --base-url URL   Override Lobsters base URL (default: https://lobste.rs)
  --timeout-ms N   Request timeout in milliseconds (default: 15000)

Examples:
  lobsters feed hottest --page 1
  lobsters story jr3zym
  lobsters user jcs
  lobsters tag rust --page 2
  lobsters search rust ffi --page 1 --json
`;
  process.stdout.write(text);
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function parseNumber(value, name) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    fail(`Invalid ${name}: ${value}`);
  }
  return parsed;
}

function parseArgs(argv) {
  const options = {
    page: 1,
    limit: 0,
    json: false,
    raw: false,
    baseUrl: DEFAULT_BASE_URL,
    timeoutMs: DEFAULT_TIMEOUT_MS
  };

  const positionals = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (!arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }

    if (arg === "--json") {
      options.json = true;
      continue;
    }

    if (arg === "--raw") {
      options.raw = true;
      continue;
    }

    if (arg === "--page") {
      i += 1;
      options.page = parseNumber(argv[i], "page");
      continue;
    }

    if (arg === "--limit") {
      i += 1;
      options.limit = parseNumber(argv[i], "limit");
      continue;
    }

    if (arg === "--base-url") {
      i += 1;
      options.baseUrl = String(argv[i] || "").trim();
      if (!options.baseUrl) {
        fail("--base-url requires a value");
      }
      continue;
    }

    if (arg === "--timeout-ms") {
      i += 1;
      options.timeoutMs = parseNumber(argv[i], "timeout-ms");
      continue;
    }

    fail(`Unknown option: ${arg}`);
  }

  return { positionals, options };
}

function normalizeBaseUrl(url) {
  return url.replace(/\/$/, "");
}

function htmlToText(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function joinUrl(baseUrl, pathOrUrl) {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }
  return `${baseUrl}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

async function fetchText(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "chowda-lobsters-cli/0.1"
      }
    });

    const body = await response.text();

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status} for ${url}`);
      error.status = response.status;
      error.body = body;
      throw error;
    }

    return body;
  } finally {
    clearTimeout(timer);
  }
}

function parseJson(text, url) {
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`Expected JSON response from ${url}, got parse error: ${error.message}`);
  }
}

function asArray(value) {
  if (!Array.isArray(value)) {
    fail("Expected an array response");
  }
  return value;
}

function truncate(value, max) {
  const text = String(value ?? "");
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max - 1)}...`;
}

function formatTable(rows, headers) {
  const widths = headers.map((h) => h.length);

  rows.forEach((row) => {
    row.forEach((cell, index) => {
      widths[index] = Math.max(widths[index], String(cell).length);
    });
  });

  const line = (cells) =>
    cells
      .map((cell, index) => String(cell).padEnd(widths[index]))
      .join("  ")
      .trimEnd();

  const separator = widths.map((w) => "-".repeat(w)).join("  ");

  const output = [line(headers), separator, ...rows.map((row) => line(row))].join("\n");
  process.stdout.write(`${output}\n`);
}

function storyRows(posts) {
  return posts.map((post) => [
    post.short_id,
    String(post.score),
    String(post.comment_count),
    truncate(post.title, 72)
  ]);
}

function printPosts(posts, options) {
  const output = options.limit > 0 ? posts.slice(0, options.limit) : posts;

  if (options.json) {
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    return;
  }

  formatTable(storyRows(output), ["id", "score", "comments", "title"]);
}

function parseSearchHtml(html, baseUrl) {
  const blocks = html.split("<li id=\"story_").slice(1);
  const results = [];

  for (const block of blocks) {
    const end = block.indexOf("</li>");
    if (end === -1) {
      continue;
    }
    const item = block.slice(0, end);

    const shortIdMatch = item.match(/data-shortid="([^"]+)"/);
    const linkMatch = item.match(/<span[^>]*class="link[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    const submitterMatch = item.match(/<a class="u-author[^>]*>([^<]+)<\/a>/);
    const commentsMatch = item.match(/<span class="comments_label">[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>[\s\S]*?(\d+)\s+comments?/);
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
      tags: tagMatches.map((m) => htmlToText(m[1])),
      comment_count: commentsMatch ? Number(commentsMatch[2]) : 0,
      comments_url: commentsMatch ? joinUrl(baseUrl, htmlToText(commentsMatch[1])) : ""
    });
  }

  return results;
}

function printUser(user, options) {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(user, null, 2)}\n`);
    return;
  }

  const rows = [
    ["username", user.username ?? ""],
    ["karma", user.karma ?? ""],
    ["created_at", user.created_at ?? ""],
    ["is_admin", String(Boolean(user.is_admin))],
    ["is_moderator", String(Boolean(user.is_moderator))],
    ["invited_by_user", user.invited_by_user ?? ""],
    ["github_username", user.github_username ?? ""],
    ["avatar_url", user.avatar_url ?? ""]
  ];

  formatTable(rows, ["field", "value"]);
}

function printTags(tags, options) {
  const output = options.limit > 0 ? tags.slice(0, options.limit) : tags;

  if (options.json) {
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    return;
  }

  const rows = output.map((tag) => [
    tag.tag,
    tag.category,
    tag.active ? "active" : "inactive",
    truncate(tag.description || "", 62)
  ]);
  formatTable(rows, ["tag", "category", "state", "description"]);
}

function printStoryDetails(story, options) {
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
    truncate(comment.comment_plain || "", 64)
  ]);
  formatTable(rows, ["id", "score", "depth", "user", "text"]);
}

async function main() {
  const { positionals, options } = parseArgs(process.argv.slice(2));
  const baseUrl = normalizeBaseUrl(options.baseUrl);

  const [command, ...args] = positionals;

  if (!command || command === "help") {
    printHelp();
    return;
  }

  let url = "";
  let expect = "json";

  if (command === "feed") {
    const type = args[0];
    if (!type) {
      fail("feed requires a type: hottest|newest|active");
    }

    if (type === "hottest") {
      url = `${baseUrl}/page/${options.page}.json`;
    } else if (type === "newest") {
      url = `${baseUrl}/newest/page/${options.page}.json`;
    } else if (type === "active") {
      url = `${baseUrl}/active/page/${options.page}.json`;
    } else {
      fail(`Unsupported feed type: ${type}`);
    }
  } else if (command === "tag") {
    const tag = args[0];
    if (!tag) {
      fail("tag requires a tag name");
    }
    url = `${baseUrl}/t/${encodeURIComponent(tag)}/page/${options.page}.json`;
  } else if (command === "domain") {
    const domain = args[0];
    if (!domain) {
      fail("domain requires a domain value");
    }
    url = `${baseUrl}/domains/${encodeURIComponent(domain)}/page/${options.page}.json`;
  } else if (command === "story") {
    const shortId = args[0];
    if (!shortId) {
      fail("story requires a short id");
    }
    url = `${baseUrl}/s/${encodeURIComponent(shortId)}.json`;
  } else if (command === "user") {
    const username = args[0];
    if (!username) {
      fail("user requires a username");
    }
    url = `${baseUrl}/~${encodeURIComponent(username)}.json`;
  } else if (command === "tags") {
    url = `${baseUrl}/tags.json`;
  } else if (command === "search") {
    if (args.length === 0) {
      fail("search requires a query");
    }
    const query = args.join(" ");
    const queryParams = new URLSearchParams({
      what: "stories",
      order: "newest",
      q: query,
      page: String(options.page)
    });
    url = `${baseUrl}/search?${queryParams.toString()}`;
    expect = "html";
  } else {
    fail(`Unknown command: ${command}`);
  }

  try {
    const text = await fetchText(url, options.timeoutMs);

    if (options.raw) {
      process.stdout.write(`${text}\n`);
      return;
    }

    if (expect === "html") {
      const parsed = parseSearchHtml(text, baseUrl);
      printPosts(parsed, options);
      return;
    }

    const data = parseJson(text, url);

    if (command === "feed" || command === "tag" || command === "domain") {
      printPosts(asArray(data), options);
      return;
    }

    if (command === "tags") {
      printTags(asArray(data), options);
      return;
    }

    if (command === "user") {
      printUser(data, options);
      return;
    }

    if (command === "story") {
      printStoryDetails(data, options);
      return;
    }

    process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
  } catch (error) {
    if (error && error.name === "AbortError") {
      fail(`Request timed out after ${options.timeoutMs}ms`);
    }

    if (error && typeof error.status === "number") {
      const bodySnippet = String(error.body || "").slice(0, 300).replace(/\s+/g, " ");
      fail(`${error.message}${bodySnippet ? `: ${bodySnippet}` : ""}`);
    }

    fail(error instanceof Error ? error.message : String(error));
  }
}

await main();

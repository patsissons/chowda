import { Command } from "commander";

import {
  addCommonOptions,
  addListOptions,
  addStoryOptions,
  normalizeCommonOptions,
  parsePositiveInteger
} from "../core/options.js";
import { fail } from "../core/errors.js";
import { asArray, executeRequest, parseJson } from "../lobsters/api.js";
import { parseSearchHtml } from "../lobsters/search-parser.js";
import { LobstersStory, LobstersTag, LobstersUser } from "../lobsters/types.js";
import { printPosts, printStoryDetails, printTags, printUser } from "../presentation/renderers.js";
import { CommonOptions, ListOptions, StoryOptions } from "../types.js";

export function registerLobstersCommands(program: Command): void {
  addListOptions(program.command("feed <type>").description("Fetch hottest, newest, or active feed pages"))
    .addHelpText(
      "after",
      "\nExamples:\n  pnpm --silent cli feed hottest --json\n  pnpm --silent cli feed newest --page 2"
    )
    .action(async (type: string, options: ListOptions) => {
      const normalized = normalizeCommonOptions(options);
      const validTypes = new Set(["hottest", "newest", "active"]);
      if (!validTypes.has(type)) {
        fail(`Unsupported feed type: ${type}. Use hottest|newest|active`);
      }

      const path = type === "hottest" ? `/page/${normalized.page}.json` : `/${type}/page/${normalized.page}.json`;
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
      const normalized = normalizeCommonOptions(options);
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
      const normalized = normalizeCommonOptions(options);
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
      const normalized = normalizeCommonOptions(options);
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

  addCommonOptions(program.command("tags").description("Fetch all Lobsters tags"))
    .option("--limit <number>", "limit output rows", parsePositiveInteger("limit"), 0)
    .addHelpText("after", "\nExample:\n  pnpm --silent cli tags --json | jq '.[0]'")
    .action(async (options: Omit<ListOptions, "page">) => {
      const normalized = normalizeCommonOptions(options);
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
      const normalized = normalizeCommonOptions(options);
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
}

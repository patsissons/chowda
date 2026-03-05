import { Command } from "commander";

import {
  addCommonOptions,
  addListOptions,
  addStoryOptions,
  normalizeCommonOptions,
  parsePositiveInteger
} from "../core/options.js";
import {
  fetchDomainStories,
  fetchFeedStories,
  fetchStory,
  fetchTagStories,
  fetchTags,
  fetchUser,
  searchStories
} from "../lobsters/resources.js";
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
      const stories = await fetchFeedStories(type, normalized);
      if (stories === null) {
        return;
      }
      printPosts(stories, normalized);
    });

  addListOptions(program.command("tag <tag>").description("Fetch stories for a tag"))
    .addHelpText("after", "\nExample:\n  pnpm --silent cli tag rust --page 2 --json")
    .action(async (tag: string, options: ListOptions) => {
      const normalized = normalizeCommonOptions(options);
      const stories = await fetchTagStories(tag, normalized);
      if (stories === null) {
        return;
      }
      printPosts(stories, normalized);
    });

  addListOptions(program.command("domain <domain>").description("Fetch stories for a domain"))
    .addHelpText("after", "\nExample:\n  pnpm --silent cli domain github.com --json")
    .action(async (domain: string, options: ListOptions) => {
      const normalized = normalizeCommonOptions(options);
      const stories = await fetchDomainStories(domain, normalized);
      if (stories === null) {
        return;
      }
      printPosts(stories, normalized);
    });

  addStoryOptions(program.command("story <shortId>").description("Fetch a single story and its comments"))
    .addHelpText("after", "\nExample:\n  pnpm --silent cli story jr3zym --json")
    .action(async (shortId: string, options: StoryOptions) => {
      const normalized = normalizeCommonOptions(options);
      const story = await fetchStory(shortId, normalized);
      if (story === null) {
        return;
      }
      printStoryDetails(story, normalized);
    });

  addCommonOptions(program.command("user <username>").description("Fetch a Lobsters user profile"))
    .addHelpText("after", "\nExample:\n  pnpm --silent cli user jcs --json")
    .action(async (username: string, options: CommonOptions) => {
      const normalized = normalizeCommonOptions(options);
      const user = await fetchUser(username, normalized);
      if (user === null) {
        return;
      }
      printUser(user, normalized);
    });

  addCommonOptions(program.command("tags").description("Fetch all Lobsters tags"))
    .option("--limit <number>", "limit output rows", parsePositiveInteger("limit"), 0)
    .addHelpText("after", "\nExample:\n  pnpm --silent cli tags --json | jq '.[0]'")
    .action(async (options: Omit<ListOptions, "page">) => {
      const normalized = normalizeCommonOptions(options);
      const tags = await fetchTags(normalized);
      if (tags === null) {
        return;
      }
      printTags(tags, normalized);
    });

  addListOptions(program.command("search <query...>").description("Search Lobsters stories"))
    .addHelpText("after", "\nExample:\n  pnpm --silent cli search rust ffi --page 1 --json")
    .action(async (queryParts: string[], options: ListOptions) => {
      const normalized = normalizeCommonOptions(options);
      const stories = await searchStories(queryParts.join(" "), normalized);
      if (stories === null) {
        return;
      }
      printPosts(stories, normalized);
    });
}

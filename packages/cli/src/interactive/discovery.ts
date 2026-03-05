import { intro, isCancel, note, outro, select, text } from "@clack/prompts";
import { Command } from "commander";

import { resolveRuntimeConfig } from "../config.js";
import {
  FEED_TYPES,
  fetchDomainStories,
  fetchFeedStories,
  fetchTagStories,
  fetchTags,
  searchStories
} from "../lobsters/resources.js";
import { printPosts, printTags } from "../presentation/renderers.js";
import { CommonOptions, ListOptions } from "../types.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIST_LIMIT = 20;
const SUGGESTION_LIMIT = 12;

type TopLevelAction = "search" | "feeds" | "stories" | "tags" | "domains" | "help" | "exit";
type StoriesAction = "by_tag" | "by_domain" | "back";

function withListOptions(common: CommonOptions, page: number, limit: number): ListOptions {
  return { ...common, page, limit };
}

async function promptRequiredText(message: string, initialValue = ""): Promise<string | null> {
  const value = await text({
    message,
    initialValue,
    validate(input) {
      if (!String(input).trim()) {
        return "This value is required";
      }
      return undefined;
    }
  });

  if (isCancel(value)) {
    return null;
  }

  return String(value).trim();
}

async function promptInteger(message: string, initialValue: number, min: number): Promise<number | null> {
  const value = await text({
    message,
    initialValue: String(initialValue),
    validate(input) {
      const parsed = Number(input);
      if (!Number.isInteger(parsed) || parsed < min) {
        return `Use an integer >= ${min}`;
      }
      return undefined;
    }
  });

  if (isCancel(value)) {
    return null;
  }

  return Number(value);
}

function getDefaultRuntimeOptions(): CommonOptions {
  const runtimeConfig = resolveRuntimeConfig();
  return {
    baseUrl: runtimeConfig.baseUrl,
    timeoutMs: runtimeConfig.timeoutMs,
    raw: false,
    json: false
  };
}

function sortedUnique(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value && value.trim())).map((value) => value.trim()))].sort();
}

async function suggestFromHottest(common: CommonOptions) {
  const stories = await fetchFeedStories(
    "hottest",
    withListOptions(common, DEFAULT_PAGE, SUGGESTION_LIMIT)
  );
  return stories ?? [];
}

async function promptFeedType(): Promise<string | null> {
  const type = await select({
    message: "Feed type",
    options: FEED_TYPES.map((item) => ({ label: item, value: item }))
  });

  if (isCancel(type)) {
    return null;
  }

  return type;
}

async function promptTag(common: CommonOptions): Promise<string | null> {
  try {
    const tags = await fetchTags({ ...common, limit: SUGGESTION_LIMIT });
    const candidates = (tags ?? []).map((tag) => tag.tag).slice(0, SUGGESTION_LIMIT);

    if (candidates.length > 0) {
      const choice = await select({
        message: "Choose a tag",
        options: [
          ...candidates.map((tag) => ({ label: tag, value: tag })),
          { label: "Manual entry", value: "__manual__" }
        ]
      });

      if (isCancel(choice)) {
        return null;
      }

      if (choice !== "__manual__") {
        return choice;
      }
    }
  } catch {
    // Fall back to manual entry if tag suggestions fail.
  }

  return promptRequiredText("Tag name (example: rust)", "rust");
}

async function promptDomain(common: CommonOptions): Promise<string | null> {
  let suggestions: string[] = [];
  try {
    const stories = await suggestFromHottest(common);
    suggestions = sortedUnique(
      stories.map((story) => {
        try {
          if (!story.url) {
            return undefined;
          }
          return new URL(story.url).hostname;
        } catch {
          return undefined;
        }
      })
    ).slice(0, SUGGESTION_LIMIT);
  } catch {
    suggestions = [];
  }

  if (suggestions.length > 0) {
    const choice = await select({
      message: "Choose a domain",
      options: [
        ...suggestions.map((domain) => ({ label: domain, value: domain })),
        { label: "Manual entry", value: "__manual__" }
      ]
    });

    if (isCancel(choice)) {
      return null;
    }

    if (choice !== "__manual__") {
      return choice;
    }
  }

  return promptRequiredText("Domain name (example: github.com)", "github.com");
}

async function runFeedsFlow(common: CommonOptions): Promise<void> {
  const type = await promptFeedType();
  if (type === null) {
    return;
  }

  const page = await promptInteger("Page", DEFAULT_PAGE, 1);
  if (page === null) {
    return;
  }

  const limit = await promptInteger("Row limit (0 for all)", DEFAULT_LIST_LIMIT, 0);
  if (limit === null) {
    return;
  }

  const options = withListOptions(common, page, limit);
  const stories = await fetchFeedStories(type, options);
  if (stories === null) {
    return;
  }

  printPosts(stories, options);
  note(`pnpm --silent cli feed ${type} --page ${page} --limit ${limit}`, "Equivalent command");
}

async function runTagStoriesFlow(common: CommonOptions): Promise<void> {
  const tag = await promptTag(common);
  if (tag === null) {
    return;
  }

  const page = await promptInteger("Page", DEFAULT_PAGE, 1);
  if (page === null) {
    return;
  }

  const limit = await promptInteger("Row limit (0 for all)", DEFAULT_LIST_LIMIT, 0);
  if (limit === null) {
    return;
  }

  const options = withListOptions(common, page, limit);
  const stories = await fetchTagStories(tag, options);
  if (stories === null) {
    return;
  }

  printPosts(stories, options);
  note(`pnpm --silent cli tag ${tag} --page ${page} --limit ${limit}`, "Equivalent command");
}

async function runDomainStoriesFlow(common: CommonOptions): Promise<void> {
  const domain = await promptDomain(common);
  if (domain === null) {
    return;
  }

  const page = await promptInteger("Page", DEFAULT_PAGE, 1);
  if (page === null) {
    return;
  }

  const limit = await promptInteger("Row limit (0 for all)", DEFAULT_LIST_LIMIT, 0);
  if (limit === null) {
    return;
  }

  const options = withListOptions(common, page, limit);
  const stories = await fetchDomainStories(domain, options);
  if (stories === null) {
    return;
  }

  printPosts(stories, options);
  note(`pnpm --silent cli domain ${domain} --page ${page} --limit ${limit}`, "Equivalent command");
}

async function runStoriesMenu(common: CommonOptions): Promise<void> {
  while (true) {
    const action = await select({
      message: "Stories",
      options: [
        { label: "By tag", value: "by_tag" },
        { label: "By domain", value: "by_domain" },
        { label: "Back", value: "back" }
      ]
    });

    if (isCancel(action) || action === "back") {
      return;
    }

    if ((action as StoriesAction) === "by_tag") {
      await runTagStoriesFlow(common);
      continue;
    }

    if ((action as StoriesAction) === "by_domain") {
      await runDomainStoriesFlow(common);
      continue;
    }
  }
}

async function runTagsFlow(common: CommonOptions): Promise<void> {
  const limit = await promptInteger("Row limit (0 for all)", DEFAULT_LIST_LIMIT, 0);
  if (limit === null) {
    return;
  }

  const options = { ...common, limit };
  const tags = await fetchTags(options);
  if (tags === null) {
    return;
  }

  printTags(tags, options);
  note(`pnpm --silent cli tags --limit ${limit}`, "Equivalent command");
}

async function runSearchFlow(common: CommonOptions): Promise<void> {
  const query = await promptRequiredText("Search query", "rust ffi");
  if (query === null) {
    return;
  }

  const page = await promptInteger("Page", DEFAULT_PAGE, 1);
  if (page === null) {
    return;
  }

  const limit = await promptInteger("Row limit (0 for all)", DEFAULT_LIST_LIMIT, 0);
  if (limit === null) {
    return;
  }

  const options = withListOptions(common, page, limit);
  const stories = await searchStories(query, options);
  if (stories === null) {
    return;
  }

  printPosts(stories, options);
  note(`pnpm --silent cli search ${query} --page ${page} --limit ${limit}`, "Equivalent command");
}

async function runTopLevelAction(action: TopLevelAction, common: CommonOptions, program: Command): Promise<void> {
  if (action === "search") {
    await runSearchFlow(common);
    return;
  }

  if (action === "feeds") {
    await runFeedsFlow(common);
    return;
  }

  if (action === "stories") {
    await runStoriesMenu(common);
    return;
  }

  if (action === "tags") {
    await runTagsFlow(common);
    return;
  }

  if (action === "domains") {
    await runDomainStoriesFlow(common);
    return;
  }

  if (action === "help") {
    program.outputHelp();
  }
}

export async function runDiscovery(program: Command): Promise<void> {
  intro("chowda CLI interactive explorer");

  const common = getDefaultRuntimeOptions();

  while (true) {
    const action = await select({
      message: "Choose a resource",
      options: [
        { label: "Search", value: "search" },
        { label: "Feeds", value: "feeds" },
        { label: "Stories", value: "stories" },
        { label: "Tags", value: "tags" },
        { label: "Domains", value: "domains" },
        { label: "Help", value: "help" },
        { label: "Exit", value: "exit" }
      ]
    });

    if (isCancel(action) || action === "exit") {
      outro("Interactive flow complete.");
      return;
    }

    await runTopLevelAction(action as TopLevelAction, common, program);
  }
}

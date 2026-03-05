import { confirm, intro, isCancel, note, outro, select, text } from "@clack/prompts";
import { Command } from "commander";

import { DEFAULT_BASE_URL, DEFAULT_TIMEOUT_MS } from "../config.js";
import { normalizeBaseUrl } from "../lobsters/api.js";
import {
  FEED_TYPES,
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

const DEFAULT_PAGE = 1;
const DEFAULT_LIST_LIMIT = 20;
const DEFAULT_STORY_LIMIT = 10;
const SUGGESTION_LIMIT = 12;

type ResourceAction = "feed" | "tag" | "domain" | "story" | "user" | "tags" | "search" | "help" | "exit";

function withListOptions(common: CommonOptions, page: number, limit: number): ListOptions {
  return { ...common, page, limit };
}

function withStoryOptions(common: CommonOptions, limit: number): StoryOptions {
  return { ...common, limit };
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

async function promptRuntimeOptions(): Promise<CommonOptions | null> {
  const useDefaults = await confirm({
    message: "Use default base URL and timeout?",
    initialValue: true
  });

  if (isCancel(useDefaults)) {
    return null;
  }

  if (useDefaults) {
    return {
      baseUrl: DEFAULT_BASE_URL,
      timeoutMs: DEFAULT_TIMEOUT_MS,
      raw: false,
      json: false
    };
  }

  const baseUrl = await promptRequiredText("Lobsters base URL", DEFAULT_BASE_URL);
  if (baseUrl === null) {
    return null;
  }

  const timeoutMs = await promptInteger("Timeout (ms)", DEFAULT_TIMEOUT_MS, 1);
  if (timeoutMs === null) {
    return null;
  }

  return {
    baseUrl: normalizeBaseUrl(baseUrl),
    timeoutMs,
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

async function promptUsername(common: CommonOptions): Promise<string | null> {
  let suggestions: string[] = [];
  try {
    const stories = await suggestFromHottest(common);
    suggestions = sortedUnique(stories.map((story) => story.submitter_user)).slice(0, SUGGESTION_LIMIT);
  } catch {
    suggestions = [];
  }

  if (suggestions.length > 0) {
    const choice = await select({
      message: "Choose a username",
      options: [
        ...suggestions.map((username) => ({ label: username, value: username })),
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

  return promptRequiredText("Lobsters username", "jcs");
}

async function promptStoryId(common: CommonOptions): Promise<string | null> {
  let stories = [] as Awaited<ReturnType<typeof suggestFromHottest>>;
  try {
    stories = await suggestFromHottest(common);
  } catch {
    stories = [];
  }

  if (stories.length > 0) {
    const choice = await select({
      message: "Choose a story",
      options: [
        ...stories.slice(0, SUGGESTION_LIMIT).map((story) => ({
          label: `${story.short_id} | ${story.title}`,
          value: story.short_id
        })),
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

  return promptRequiredText("Story short id", "jr3zym");
}

async function runFeedFlow(common: CommonOptions): Promise<void> {
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

async function runTagFlow(common: CommonOptions): Promise<void> {
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

async function runDomainFlow(common: CommonOptions): Promise<void> {
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

async function runStoryFlow(common: CommonOptions): Promise<void> {
  const shortId = await promptStoryId(common);
  if (shortId === null) {
    return;
  }

  const limit = await promptInteger("Comment limit (0 uses default)", DEFAULT_STORY_LIMIT, 0);
  if (limit === null) {
    return;
  }

  const story = await fetchStory(shortId, common);
  if (story === null) {
    return;
  }

  const options = withStoryOptions(common, limit);
  printStoryDetails(story, options);
  note(`pnpm --silent cli story ${shortId} --limit ${limit}`, "Equivalent command");
}

async function runUserFlow(common: CommonOptions): Promise<void> {
  const username = await promptUsername(common);
  if (username === null) {
    return;
  }

  const user = await fetchUser(username, common);
  if (user === null) {
    return;
  }

  printUser(user, common);
  note(`pnpm --silent cli user ${username}`, "Equivalent command");
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

async function runResourceAction(action: ResourceAction, common: CommonOptions, program: Command): Promise<void> {
  if (action === "feed") {
    await runFeedFlow(common);
    return;
  }

  if (action === "tag") {
    await runTagFlow(common);
    return;
  }

  if (action === "domain") {
    await runDomainFlow(common);
    return;
  }

  if (action === "story") {
    await runStoryFlow(common);
    return;
  }

  if (action === "user") {
    await runUserFlow(common);
    return;
  }

  if (action === "tags") {
    await runTagsFlow(common);
    return;
  }

  if (action === "search") {
    await runSearchFlow(common);
    return;
  }

  if (action === "help") {
    program.outputHelp();
    return;
  }
}

export async function runDiscovery(program: Command): Promise<void> {
  intro("chowda CLI interactive explorer");

  const common = await promptRuntimeOptions();
  if (common === null) {
    outro("Cancelled.");
    return;
  }

  const action = await select({
    message: "Choose a resource",
    options: [
      { label: "Feed", value: "feed" },
      { label: "Tag stories", value: "tag" },
      { label: "Domain stories", value: "domain" },
      { label: "Story details", value: "story" },
      { label: "User profile", value: "user" },
      { label: "Tags catalog", value: "tags" },
      { label: "Search stories", value: "search" },
      { label: "Show full help", value: "help" },
      { label: "Exit", value: "exit" }
    ]
  });

  if (isCancel(action) || action === "exit") {
    outro("No changes made.");
    return;
  }

  await runResourceAction(action as ResourceAction, common, program);
  outro("Interactive flow complete.");
}

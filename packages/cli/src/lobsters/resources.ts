import { fail } from "../core/errors.js";
import { CommonOptions, ListOptions } from "../types.js";
import { asArray, executeRequest, parseJson } from "./api.js";
import { parseSearchHtml } from "./search-parser.js";
import { LobstersStory, LobstersTag, LobstersUser } from "./types.js";

export const FEED_TYPES = ["hottest", "newest", "active"] as const;
export type FeedType = (typeof FEED_TYPES)[number];

function ensureFeedType(value: string): FeedType {
  if (value === "hottest" || value === "newest" || value === "active") {
    return value;
  }
  fail(`Unsupported feed type: ${value}. Use hottest|newest|active`);
}

async function fetchJson(url: string, options: CommonOptions): Promise<unknown | null> {
  const textValue = await executeRequest(url, options);
  if (textValue === null) {
    return null;
  }
  return parseJson(textValue, url);
}

export async function fetchFeedStories(type: string, options: ListOptions): Promise<LobstersStory[] | null> {
  const feedType = ensureFeedType(type);
  const path = feedType === "hottest" ? `/page/${options.page}.json` : `/${feedType}/page/${options.page}.json`;
  const url = `${options.baseUrl}${path}`;

  const data = await fetchJson(url, options);
  if (data === null) {
    return null;
  }

  return asArray<LobstersStory>(data);
}

export async function fetchTagStories(tag: string, options: ListOptions): Promise<LobstersStory[] | null> {
  const url = `${options.baseUrl}/t/${encodeURIComponent(tag)}/page/${options.page}.json`;
  const data = await fetchJson(url, options);
  if (data === null) {
    return null;
  }

  return asArray<LobstersStory>(data);
}

export async function fetchDomainStories(domain: string, options: ListOptions): Promise<LobstersStory[] | null> {
  const url = `${options.baseUrl}/domains/${encodeURIComponent(domain)}/page/${options.page}.json`;
  const data = await fetchJson(url, options);
  if (data === null) {
    return null;
  }

  return asArray<LobstersStory>(data);
}

export async function fetchStory(shortId: string, options: CommonOptions): Promise<LobstersStory | null> {
  const url = `${options.baseUrl}/s/${encodeURIComponent(shortId)}.json`;
  const data = await fetchJson(url, options);
  if (data === null) {
    return null;
  }

  return data as LobstersStory;
}

export async function fetchUser(username: string, options: CommonOptions): Promise<LobstersUser | null> {
  const url = `${options.baseUrl}/~${encodeURIComponent(username)}.json`;
  const data = await fetchJson(url, options);
  if (data === null) {
    return null;
  }

  return data as LobstersUser;
}

export async function fetchTags(options: Omit<ListOptions, "page">): Promise<LobstersTag[] | null> {
  const url = `${options.baseUrl}/tags.json`;
  const data = await fetchJson(url, options);
  if (data === null) {
    return null;
  }

  return asArray<LobstersTag>(data);
}

export async function searchStories(query: string, options: ListOptions): Promise<LobstersStory[] | null> {
  if (!query.trim()) {
    fail("search requires a query");
  }

  const queryParams = new URLSearchParams({
    what: "stories",
    order: "newest",
    q: query.trim(),
    page: String(options.page)
  });
  const url = `${options.baseUrl}/search?${queryParams.toString()}`;

  const textValue = await executeRequest(url, options);
  if (textValue === null) {
    return null;
  }

  return parseSearchHtml(textValue, options.baseUrl);
}

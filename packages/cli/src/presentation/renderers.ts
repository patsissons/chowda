import { LobstersStory, LobstersTag, LobstersUser } from "../lobsters/types.js";
import { CommonOptions, ListOptions, StoryOptions } from "../types.js";

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

function storyRows(posts: LobstersStory[]): string[][] {
  return posts.map((post) => [
    post.short_id,
    String(post.score),
    String(post.comment_count),
    truncate(post.title, 72)
  ]);
}

export function printPosts(posts: LobstersStory[], options: ListOptions): void {
  const output = options.limit > 0 ? posts.slice(0, options.limit) : posts;

  if (options.json) {
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    return;
  }

  formatTable(storyRows(output), ["id", "score", "comments", "title"]);
}

export function printUser(user: LobstersUser, options: CommonOptions): void {
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

export function printTags(tags: LobstersTag[], options: Omit<ListOptions, "page">): void {
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

export function printStoryDetails(story: LobstersStory, options: StoryOptions): void {
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

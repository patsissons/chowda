import { LobstersStory } from "./types.js";

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

export function parseSearchHtml(html: string, baseUrl: string): LobstersStory[] {
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

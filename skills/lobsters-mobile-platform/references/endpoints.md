# Lobsters Endpoint Notes

Last reviewed: 2026-03-05.

## Live-read routes confirmed

- `GET /hottest` and `GET /hottest.json`
- `GET /page/{page}.json` (hottest/front page)
- `GET /newest/page/{page}.json`
- `GET /active/page/{page}.json`
- `GET /t/{tag}/page/{page}.json`
- `GET /domains/{domain}/page/{page}.json`
- `GET /s/{short_id}.json`
- `GET /~{username}.json`
- `GET /tags.json`
- `GET /c/{comment_short_id}.json`
- `GET /stories/url/all.json?url=...`
- `GET /search?what=stories&order=newest&q=...&page=...` (HTML, not JSON)
- `GET /comments.rss`
- `GET /top/{length}/rss` (example: `/top/1w/rss`)

## Useful route details from upstream code

- Route source is `config/routes.rb` in the `lobsters/lobsters` repo.
- JSON/RSS format handling is implemented in controllers such as:
  - `home_controller.rb`
  - `stories_controller.rb`
  - `users_controller.rb`
  - `tags_controller.rb`
  - `story_urls_controller.rb`
- Model serialization lives in `Story#as_json`, `Comment#as_json`, `User#as_json`.

## Important caveats

- Upstream maintainers explicitly do not support maintaining a JSON API as a product surface.
- Some JSON is exposed due Rails behavior and could change without warning.
- Old client patterns may reference `GET /u/{username}.json`; current behavior can return HTML while `GET /~{username}.json` returns JSON.
- Search is commonly implemented by parsing HTML (`/search`) in newer clients.
- Logged-out URL searches are restricted due bot abuse; expect special handling and occasional anti-bot behavior on `/search`.
- Lobsters enforces Rack::Attack throttles and returns `429` with `RateLimit-*` headers; client retries should honor reset timing.

## Known non-working or unstable paths (as of review date)

- `GET /recent.json` -> `404`
- `GET /comments.json` -> `404`
- `GET /u/{username}.json` -> currently returns HTML user page (not JSON contract)
- Origin JSON routes in the form `GET /origins/{identifier}.json` were not validated as a stable public JSON surface
- `GET /stories/url/latest?url=...` is redirect-oriented and may return `404` for non-submitted URLs

## Practical rules

- Always verify endpoint behavior live before shipping.
- Keep parsers tolerant of optional/missing fields.
- Prefer read-only features first; treat write/auth flows as higher-risk integration work.
- For search, support graceful fallback when HTML shape changes or access is denied.

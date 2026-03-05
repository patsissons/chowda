# Existing Client Survey

## Official Lobsters codebase (`lobsters/lobsters`)

- Strongest source of truth for route availability and serializers.
- Controllers expose many JSON responses via `respond_to`, but support level is unofficial.
- Story/user/comment/tag serializers provide practical contracts for read clients.

## `nguyenmp/chowders` (Java wrapper)

- Older wrapper around Lobsters JSON endpoints.
- Uses:
  - `hottest.json`, `newest.json`
  - `s/{id}.json`
  - `u/{username}.json` (now risky/outdated)
- Includes HTML login/filter scraping paths with cookies and CSRF extraction.
- Good for historical field expectations; not enough as modern source of truth.

## `nguyenmp/bisque` (Android app)

- Legacy Android client that depends on `chowders`.
- Useful as a read-client reference and for data-to-UI mapping patterns.
- Endpoint assumptions inherit `chowders` limitations.

## `msfjarvis/compose-lobsters` (Claw)

- Modern active Android client with explicit warning that API is unsupported upstream.
- Uses Retrofit + model serialization + paging + robust error handling.
- Uses:
  - `/page/{page}.json`
  - `/newest/page/{page}.json`
  - `/s/{id}.json`
  - `/~{username}.json`
  - `/tags.json`
  - HTML parsing for `/search`
- Includes retry behavior for `Retry-After` and clear failure mapping.

## `0queue/lemon` (Android, active in 2025)

- Compose-based successor to older Claw architecture.
- Uses Ktor + Kotlin serialization + paging + local persistence.
- Uses:
  - `/page/{index}.json`
  - `/s/{short_id}.json`
  - `/u/{username}.json` (currently risky because this now serves HTML instead of JSON)
- Useful architecture reference, but user endpoint handling needs modernization (`/~{username}.json`).

## `say4n/crustacean` (iOS, active in 2025)

- SwiftUI iOS client with practical login-cookie + interaction flows.
- Uses:
  - `/page/{page}.json`
  - `/active/page/{page}.json`
  - `/newest/page/{page}.json`
  - `/s/{short_id}.json`
- Implements vote/flag writes using cookie-backed session state and form posts.
- Good reference for iOS UX and interaction wiring; treat write endpoints as fragile.

## `0queue/claw-for-lobsters` (legacy Android)

- Older modular Android client using Retrofit + SQLDelight.
- Valuable for historical architecture patterns and caching design.
- Uses `/u/{username}.json`, so it reflects older API assumptions.

## `al2o3cr/lobsters` (unofficial API)

- Very old Rack app with limited routes (`frontpage`, `recent`, `search`).
- Useful as historical context only; do not treat as current contract.

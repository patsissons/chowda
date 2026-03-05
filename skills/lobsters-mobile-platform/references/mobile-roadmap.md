# Mobile Platform Roadmap

## Phase 1: CLI foundation (current)

- Build a no-dependency CLI that can query live Lobsters content quickly.
- Cover core read paths: hottest/newest/active/tag/domain/story/user/tags/search.
- Add output modes for debugging (`table`, `json`, `raw`).

## Phase 2: Shared data contracts

- Extract shared Lobsters DTO/domain models from CLI behavior.
- Add fixture-based parser tests from real endpoint captures.
- Add schema drift checks in CI for critical fields.

## Phase 3: Cross-platform app core

- Keep platform-independent layers:
  - transport
  - parsing/model mapping
  - cache and persistence
  - feature use-cases
- Keep platform-specific layers:
  - UI
  - navigation
  - platform services (notifications, deep links, background work)

## Phase 4: Product hardening

- Add user-visible fallback states for endpoint failures.
- Add rate-limit-aware retries and timeout controls.
- Add analytics around endpoint reliability and parsing errors.

## Suggested architecture boundaries

- `api`: HTTP endpoints and response parsing
- `domain`: app use-cases and business logic
- `storage`: local cache and persistence
- `clients`: CLI and mobile presentation layers

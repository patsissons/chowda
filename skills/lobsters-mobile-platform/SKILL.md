---
name: lobsters-mobile-platform
description: Build and maintain Lobste.rs integrations for CLI and cross-platform mobile clients. Use when tasks involve discovering supported Lobsters routes/formats, handling unstable unofficial JSON behavior, building read-only content flows, parsing search HTML, or planning app architecture and testing around Lobsters stories/comments/users/tags.
---

# Lobsters Mobile Platform

## Overview

Use this skill to implement reliable Lobste.rs data clients and product workflows while minimizing breakage risk from unofficial JSON behavior.

## Workflow

1. Establish endpoint scope before writing app code.
- Read [references/endpoints.md](references/endpoints.md).
- Prefer known working read routes first (`feed`, `story`, `user`, `tags`).
- Treat search as HTML parsing unless you confirm a supported JSON route.

2. Validate live behavior before locking contracts.
- Run the local CLI at `tools/lobsters-cli/src/index.mjs` against the intended endpoints.
- Confirm both status codes and field shapes for the exact feature you are building.
- Keep fixtures from real responses for parser and model tests.

3. Design clients for breakage tolerance.
- Keep model parsing lenient for optional fields.
- Expect endpoint shape drift and non-JSON fallbacks.
- Implement retry/backoff and clear error messages for rate-limit/service failures.
- Expect anti-bot constraints, especially around `/search`, and handle 403/429 gracefully.

4. Separate product layers.
- Keep `api` transport layer independent from UI state.
- Keep storage/caching independent from view models.
- Reuse shared domain models across CLI and mobile clients where possible.

5. Document assumptions in the task output.
- Record which endpoints are unofficial.
- Record which responses were verified live.
- Record fallback behavior if an endpoint returns HTML, 404, or schema drift.

## Reference Map

- Endpoint matrix and caveats: [references/endpoints.md](references/endpoints.md)
- Existing client patterns and pitfalls: [references/client-survey.md](references/client-survey.md)
- Architecture path from CLI to cross-platform app: [references/mobile-roadmap.md](references/mobile-roadmap.md)
- Source links used for investigation: [references/source-links.md](references/source-links.md)

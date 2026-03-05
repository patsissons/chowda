# chowda

Monorepo for Lobste.rs tooling and mobile-platform exploration.

## Workspace layout

- `packages/web`: stub web app package
- `packages/cli`: stub CLI package
- `packages/mobile`: stub mobile app package
- `tools/lobsters-cli`: first CLI for querying Lobste.rs content
- `skills/lobsters-mobile-platform`: reusable Codex skill for Lobste.rs integration work

## Quick start

Run from repo root:

```bash
pnpm install
pnpm -r --if-present dev
pnpm lobsters -- help
```

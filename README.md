# chowda

Monorepo for Lobste.rs tooling and mobile-platform exploration.

## Workspace layout

- `tools/lobsters-cli`: first CLI for querying Lobste.rs content
- `skills/lobsters-mobile-platform`: reusable Codex skill for Lobste.rs integration work

## Quick start

Run from repo root:

```bash
node tools/lobsters-cli/src/index.mjs help
node tools/lobsters-cli/src/index.mjs feed hottest --page 1
node tools/lobsters-cli/src/index.mjs story jr3zym
```

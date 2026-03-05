# chowda

Monorepo for Lobste.rs tooling and mobile-platform exploration.

## Workspace layout

- `packages/web`: stub web app package
- `packages/cli`: long-term Chowda CLI package (Commander + Clack)
- `packages/mobile`: stub mobile app package
- `tools/lobsters-cli`: original reference implementation used to shape `packages/cli`
- `skills/lobsters-mobile-platform`: reusable Codex skill for Lobste.rs integration work

## Quick start

Run from repo root:

```bash
pnpm install
pnpm --silent cli --help
pnpm --silent cli feed hottest --json | jq '.[0]'
```

## CLI configuration

- `packages/cli/.env` contains source-controlled non-secret defaults.
- `pnpm --silent cli setup` writes local overrides to `packages/cli/.env.local`.
- Runtime config is loaded with `dotenv-flow`, so `.env.local` overrides `.env`.

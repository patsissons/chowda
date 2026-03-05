# @chowda/web

Next.js + TypeScript + Tailwind web app for Chowda.

## Why this stack

- Next.js App Router for strong React ergonomics and future interactive growth.
- Server rendering for feed fetching without browser CORS issues.
- File-based Open Graph image generation via `app/opengraph-image.tsx`.

## Local development

Run from monorepo root:

```bash
pnpm install
pnpm --filter @chowda/web dev
```

## Cloudflare Pages setup

Connect the GitHub monorepo and set:

- Framework preset: `Next.js`
- Build command: `pnpm install --frozen-lockfile && pnpm --filter @chowda/web build`
- Build output directory: `.next`

If you set the project Root Directory to `packages/web` instead, use:

- Build command: `pnpm install --frozen-lockfile && pnpm build`
- Build output directory: `.next`

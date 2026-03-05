import { ThemeToggle } from '@/components/theme-toggle'

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-14 pt-5 sm:px-6 sm:pt-8">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0">
          <p className="brand truncate text-2xl font-semibold sm:text-3xl">Chowda</p>
          <p className="text-sm text-muted">
            The best Lobsters companion app available today.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-8">
        <div className="absolute -right-9 -top-8 h-24 w-24 rounded-full bg-accent/15 blur-2xl" />
        <div className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-accent/10 blur-3xl" />

        <p className="mb-4 inline-flex max-w-full truncate rounded-full border border-border bg-accentSoft px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted">
         It's pronounced <span className="font-bold mx-1 italic">Chow-DAH!</span>
        </p>

        <h1 className="mb-4 max-w-3xl text-balance text-3xl font-semibold leading-tight sm:text-5xl">
          A modern, minimal front door for Lobsters readers.
        </h1>

        <p className="max-w-3xl break-words text-base text-muted sm:text-lg">
          Chowda is a light weight presentation layer for Lobsters content.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <a
            href="#"
            className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Open the app
          </a>
          <a
            href="https://lobste.rs"
            className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-accentSoft"
          >
            Visit Lobsters
          </a>
        </div>
      </section>
    </main>
  )
}

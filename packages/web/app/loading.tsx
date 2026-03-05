export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-14 pt-5 sm:px-6 sm:pt-8">
      <section className="mt-8 rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-6">
        <div className="mb-5 h-10 animate-pulse rounded-lg bg-accentSoft/70" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-lg border border-border bg-accentSoft/50" />
          ))}
        </div>
      </section>
    </main>
  )
}

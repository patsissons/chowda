'use client'

import { BellRing, Flame, Rocket, Smartphone, Soup, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const milestones = [
  {
    icon: Smartphone,
    title: 'Pocket-ready polish',
    body: 'Native-friendly layouts, buttery gestures, and fast readability are already in active prep.',
  },
  {
    icon: Soup,
    title: 'Chowda flavor pass',
    body: 'Expect playful micro-copy, tasteful motion, and fewer taps between curiosity and context.',
  },
  {
    icon: Rocket,
    title: 'Launch ramp-up',
    body: 'As soon as core browsing feels excellent, we will open a preview wave and share the invite.',
  },
]

export function AppLaunchDrawer() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="rounded-lg">Open the app</Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="border-t border-border px-0 pb-0 pt-8 sm:pt-10">
        <div className="mx-auto w-full max-w-5xl px-5 pb-8 sm:px-8">
          <div className="mx-auto mb-5 h-1.5 w-16 rounded-full bg-border" aria-hidden />

          <SheetHeader className="mb-6 gap-3 pr-12">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-accentSoft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
              <Flame className="h-3.5 w-3.5" />
              Mobile Chowda Incoming
            </p>
            <SheetTitle className="brand text-3xl sm:text-4xl">
              The cauldron is simmering nicely.
            </SheetTitle>
            <SheetDescription className="max-w-3xl text-sm sm:text-base">
              The mobile app is currently in the kitchen, where we are reducing friction, seasoning
              the design, and taste-testing the flow until it is undeniably delightful.
            </SheetDescription>
          </SheetHeader>

          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            {milestones.map((milestone) => {
              const Icon = milestone.icon
              return (
                <article
                  key={milestone.title}
                  className="rounded-xl border border-border bg-surface/70 p-4 shadow-[0_8px_24px_-18px_rgba(0,0,0,0.6)]"
                >
                  <div className="mb-3 inline-flex rounded-lg border border-border bg-accentSoft p-2">
                    <Icon className="h-4 w-4 text-text" />
                  </div>
                  <h3 className="mb-2 text-sm font-semibold text-text">{milestone.title}</h3>
                  <p className="text-xs leading-relaxed text-muted">{milestone.body}</p>
                </article>
              )
            })}
          </div>

          <div className="mb-6 rounded-2xl border border-border bg-gradient-to-br from-accent/15 via-accentSoft/40 to-surface p-4 sm:p-5">
            <p className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-text">
              <Sparkles className="h-4 w-4" />
              Meanwhile, in the test kitchen
            </p>
            <p className="break-words text-sm text-muted">
              We are prototyping smarter story triage, quicker context hops, and a cozy reading
              rhythm that feels right at home on a phone.
            </p>
          </div>

          <SheetFooter className="items-center gap-3 border-t border-border pt-5">
            <p className="mr-auto inline-flex items-center gap-2 text-xs text-muted">
              <BellRing className="h-3.5 w-3.5" />
              Preview drops when the broth is perfect.
            </p>
            <SheetClose asChild>
              <Button variant="outline">Back to feed</Button>
            </SheetClose>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'

const FOLLOWED_PAIRINGS_STORAGE_KEY = 'golf-tracker-followed-pairings'

/** Left-edge bands on pairing rows (Followed / Pairings). Thicker bars + black outline for clarity. */
const STRIPE_WIDTH = 'w-2.5'

export function PairingRowAccentStripes({
  starred,
  pairingPicked,
  parlayStripeClass,
  inParlay,
}: {
  starred: boolean
  pairingPicked: boolean
  /** Tailwind bg-* classes from parlay palette */
  parlayStripeClass: string | undefined
  inParlay: boolean
}) {
  const segments: string[] =
    inParlay && parlayStripeClass
      ? [parlayStripeClass]
      : [
          ...(starred ? ['bg-amber-400 dark:bg-amber-500'] : []),
          ...(pairingPicked ? ['bg-violet-500 dark:bg-violet-400'] : []),
          ...(parlayStripeClass ? [parlayStripeClass] : []),
        ]

  if (segments.length === 0) return null

  return (
    <div
      className="flex shrink-0 flex-row overflow-hidden rounded-sm border-2 border-black dark:border-black"
      aria-hidden
    >
      {segments.map((cls, i) => (
        <div
          key={i}
          className={`${STRIPE_WIDTH} min-h-full shrink-0 self-stretch ${cls} ${
            i < segments.length - 1 ? 'border-r-2 border-black dark:border-black' : ''
          }`}
        />
      ))}
    </div>
  )
}

export function useFollowedPairings() {
  const [followedKeys, setFollowedKeys] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FOLLOWED_PAIRINGS_STORAGE_KEY)
      if (!raw) return
      const arr = JSON.parse(raw) as unknown
      if (Array.isArray(arr) && arr.every((x) => typeof x === 'string')) {
        // localStorage is unavailable during SSR; sync after mount (empty initial state matches server HTML).
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional post-mount hydration
        setFollowedKeys(new Set(arr))
      }
    } catch {
      /* ignore */
    }
  }, [])

  const toggleFollowed = useCallback((key: string) => {
    setFollowedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      try {
        localStorage.setItem(FOLLOWED_PAIRINGS_STORAGE_KEY, JSON.stringify([...next]))
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  return { followedKeys, toggleFollowed }
}

export function FollowedPairingsTabButton({
  selected,
  onClick,
}: {
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`px-3 h-full border-l border-input transition-colors ${
        selected
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-muted text-foreground'
      }`}
      onClick={onClick}
    >
      Followed Pairings
    </button>
  )
}

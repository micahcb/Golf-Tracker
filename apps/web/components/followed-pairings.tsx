'use client'

import { useState, useEffect, useCallback } from 'react'

const FOLLOWED_PAIRINGS_STORAGE_KEY = 'golf-tracker-followed-pairings'

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

'use client'

import { useState, useEffect, useCallback } from 'react'

const STARRED_PLAYERS_STORAGE_KEY = 'golf-tracker-starred-players'

export function useStarredPlayers() {
  const [starredIds, setStarredIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STARRED_PLAYERS_STORAGE_KEY)
      if (!raw) return
      const arr = JSON.parse(raw) as unknown
      if (Array.isArray(arr) && arr.every((x) => typeof x === 'string')) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional post-mount hydration
        setStarredIds(new Set(arr))
      }
    } catch {
      /* ignore */
    }
  }, [])

  const toggleStar = useCallback((playerId: string) => {
    setStarredIds((prev) => {
      const next = new Set(prev)
      if (next.has(playerId)) next.delete(playerId)
      else next.add(playerId)
      try {
        localStorage.setItem(STARRED_PLAYERS_STORAGE_KEY, JSON.stringify([...next]))
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  return { starredIds, toggleStar }
}

export function StarredPlayersTabButton({
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
      Starred
    </button>
  )
}

export function StarPlayerButton({
  starred,
  onClick,
}: {
  starred: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={starred ? 'Remove star' : 'Star player'}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`shrink-0 text-base leading-none px-0.5 py-0.5 rounded transition-colors ${
        starred
          ? 'text-amber-600/90 dark:text-amber-400/90 hover:text-amber-600 dark:hover:text-amber-300'
          : 'text-muted-foreground/70 hover:text-amber-600/70 dark:hover:text-amber-400/70'
      }`}
    >
      {starred ? '★' : '☆'}
    </button>
  )
}

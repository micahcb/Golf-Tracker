'use client'

import { useState, useEffect, useCallback } from 'react'

const PAIRING_PICKS_STORAGE_KEY = 'golf-tracker-pairing-picks'

/** Composite key: pairing group id + player (newline cannot appear in ESPN ids or pairing keys). */
export function makePairingPickKey(pairingGroupKey: string, playerId: string): string {
  return `${pairingGroupKey}\n${playerId}`
}

export function usePairingPicks() {
  const [pickKeys, setPickKeys] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PAIRING_PICKS_STORAGE_KEY)
      if (!raw) return
      const arr = JSON.parse(raw) as unknown
      if (Array.isArray(arr) && arr.every((x) => typeof x === 'string')) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional post-mount hydration
        setPickKeys(new Set(arr))
      }
    } catch {
      /* ignore */
    }
  }, [])

  const togglePairingPick = useCallback((pairingGroupKey: string, playerId: string) => {
    const k = makePairingPickKey(pairingGroupKey, playerId)
    setPickKeys((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      try {
        localStorage.setItem(PAIRING_PICKS_STORAGE_KEY, JSON.stringify([...next]))
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  return { pairingPickKeys: pickKeys, togglePairingPick }
}

/** “Sub-star”: this golfer as your pick within this tee-time group (e.g. day / matchup). */
export function PairingPickButton({
  picked,
  onClick,
}: {
  picked: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={
        picked
          ? 'Remove pick for this pairing'
          : 'Pick this golfer in this pairing (day / group matchup)'
      }
      title={
        picked
          ? 'Your pick in this pairing'
          : 'Pick in this pairing (separate from tournament star)'
      }
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`shrink-0 text-sm leading-none px-0.5 py-0.5 rounded transition-colors ${
        picked
          ? 'text-violet-600 dark:text-violet-400 hover:text-violet-500'
          : 'text-muted-foreground/55 hover:text-violet-500/85'
      }`}
    >
      {picked ? '✦' : '✧'}
    </button>
  )
}

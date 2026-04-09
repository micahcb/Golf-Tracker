'use client'

import { useReducer, useMemo, useCallback, useEffect } from 'react'

const PAIRING_PICKS_STORAGE_KEY = 'golf-tracker-pairing-picks'
const PARLAY_PICKS_STORAGE_KEY = 'golf-tracker-parlay-picks'

/** Composite key: pairing group id + player (newline cannot appear in ESPN ids or pairing keys). */
export function makePairingPickKey(pairingGroupKey: string, playerId: string): string {
  return `${pairingGroupKey}\n${playerId}`
}

type PicksState = { picks: string[]; parlays: string[] }

function loadInitial(): PicksState {
  if (typeof window === 'undefined') return { picks: [], parlays: [] }
  try {
    const p = JSON.parse(localStorage.getItem(PAIRING_PICKS_STORAGE_KEY) || '[]')
    const pl = JSON.parse(localStorage.getItem(PARLAY_PICKS_STORAGE_KEY) || '[]')
    return {
      picks: Array.isArray(p) && p.every((x: unknown) => typeof x === 'string') ? p : [],
      parlays: Array.isArray(pl) && pl.every((x: unknown) => typeof x === 'string') ? pl : [],
    }
  } catch {
    return { picks: [], parlays: [] }
  }
}

function persist(picks: string[], parlays: string[]) {
  try {
    localStorage.setItem(PAIRING_PICKS_STORAGE_KEY, JSON.stringify(picks))
    localStorage.setItem(PARLAY_PICKS_STORAGE_KEY, JSON.stringify(parlays))
  } catch {
    /* ignore */
  }
}

function reducer(
  state: PicksState,
  action: { type: 'togglePick' | 'toggleParlay'; k: string } | { type: 'hydrate'; picks: string[]; parlays: string[] }
): PicksState {
  if (action.type === 'hydrate') {
    const pickSet = new Set(action.picks)
    const parlays = action.parlays.filter((k) => pickSet.has(k))
    return { picks: action.picks, parlays }
  }
  if (action.type === 'togglePick') {
    const k = action.k
    const pickSet = new Set(state.picks)
    const parlaySet = new Set(state.parlays)
    if (pickSet.has(k)) {
      pickSet.delete(k)
      parlaySet.delete(k)
    } else {
      pickSet.add(k)
    }
    const picks = [...pickSet]
    const parlays = [...parlaySet]
    persist(picks, parlays)
    return { picks, parlays }
  }
  const k = action.k
  const pickSet = new Set(state.picks)
  if (!pickSet.has(k)) return state
  const parlaySet = new Set(state.parlays)
  if (parlaySet.has(k)) parlaySet.delete(k)
  else parlaySet.add(k)
  const parlays = [...parlaySet]
  persist(state.picks, parlays)
  return { picks: state.picks, parlays }
}

export function usePairingPicks() {
  const [raw, dispatch] = useReducer(reducer, { picks: [], parlays: [] })

  useEffect(() => {
    const s = loadInitial()
    if (s.picks.length > 0 || s.parlays.length > 0) {
      dispatch({ type: 'hydrate', picks: s.picks, parlays: s.parlays })
    }
  }, [])

  const pairingPickKeys = useMemo(() => new Set(raw.picks), [raw.picks])
  const parlayPickKeys = useMemo(() => new Set(raw.parlays), [raw.parlays])

  const togglePairingPick = useCallback((pairingGroupKey: string, playerId: string) => {
    dispatch({ type: 'togglePick', k: makePairingPickKey(pairingGroupKey, playerId) })
  }, [])

  const toggleParlayPick = useCallback((pairingGroupKey: string, playerId: string) => {
    dispatch({ type: 'toggleParlay', k: makePairingPickKey(pairingGroupKey, playerId) })
  }, [])

  return { pairingPickKeys, parlayPickKeys, togglePairingPick, toggleParlayPick }
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
          ? 'text-violet-700 dark:text-violet-300 hover:text-violet-600 dark:hover:text-violet-200'
          : 'text-muted-foreground/55 hover:text-violet-600/80 dark:hover:text-violet-400/80'
      }`}
    >
      {picked ? '✦' : '✧'}
    </button>
  )
}

/** Parlay leg — only shown in Followed Pairings; pairs with ✦ picks (fuchsia vs violet). */
export function ParlayPickButton({
  active,
  disabled,
  onClick,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={active ? 'Remove from parlay' : 'Mark as parlay leg'}
      title={
        disabled
          ? 'Pick this golfer (✦) first'
          : active
            ? 'Parlay leg (fuchsia)'
            : 'Mark as parlay leg'
      }
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`shrink-0 text-[10px] font-bold leading-none px-1 py-0.5 rounded border transition-colors ${
        disabled
          ? 'opacity-35 cursor-not-allowed border-transparent text-muted-foreground'
          : active
            ? 'border-fuchsia-600/55 bg-fuchsia-500/20 text-fuchsia-800 dark:text-fuchsia-200'
            : 'border-border/80 text-muted-foreground hover:border-fuchsia-500/50 hover:text-fuchsia-700 dark:hover:text-fuchsia-300'
      }`}
    >
      P
    </button>
  )
}

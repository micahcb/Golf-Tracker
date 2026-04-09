'use client'

import { useReducer, useMemo, useCallback, useEffect } from 'react'

const PAIRING_PICKS_STORAGE_KEY = 'golf-tracker-pairing-picks'
const PARLAY_PICKS_STORAGE_KEY = 'golf-tracker-parlay-picks'

/** Composite key: pairing group id + player (newline cannot appear in ESPN ids or pairing keys). */
export function makePairingPickKey(pairingGroupKey: string, playerId: string): string {
  return `${pairingGroupKey}\n${playerId}`
}

export function parsePairingPickKey(k: string): { pairingGroupKey: string; playerId: string } | null {
  const i = k.indexOf('\n')
  if (i < 0) return null
  return { pairingGroupKey: k.slice(0, i), playerId: k.slice(i + 1) }
}

export type ParlaySaved = {
  id: string
  legs: string[]
  colorIndex: number
}

/** Distinct parlay colors (Tailwind classes must stay literal for the compiler). */
export const PARLAY_PALETTE = [
  {
    name: 'Fuchsia',
    stripe: 'bg-fuchsia-500 dark:bg-fuchsia-400',
    text: 'text-fuchsia-700 dark:text-fuchsia-300',
    activeBorder: 'border-fuchsia-600/55',
    activeBg: 'bg-fuchsia-500/20',
    activeFg: 'text-fuchsia-800 dark:text-fuchsia-200',
  },
  {
    name: 'Sky',
    stripe: 'bg-sky-500 dark:bg-sky-400',
    text: 'text-sky-700 dark:text-sky-300',
    activeBorder: 'border-sky-600/55',
    activeBg: 'bg-sky-500/20',
    activeFg: 'text-sky-900 dark:text-sky-100',
  },
  {
    name: 'Emerald',
    stripe: 'bg-emerald-500 dark:bg-emerald-400',
    text: 'text-emerald-700 dark:text-emerald-300',
    activeBorder: 'border-emerald-600/55',
    activeBg: 'bg-emerald-500/20',
    activeFg: 'text-emerald-900 dark:text-emerald-100',
  },
  {
    name: 'Amber',
    stripe: 'bg-amber-500 dark:bg-amber-400',
    text: 'text-amber-800 dark:text-amber-200',
    activeBorder: 'border-amber-600/55',
    activeBg: 'bg-amber-500/20',
    activeFg: 'text-amber-950 dark:text-amber-100',
  },
  {
    name: 'Rose',
    stripe: 'bg-rose-500 dark:bg-rose-400',
    text: 'text-rose-700 dark:text-rose-300',
    activeBorder: 'border-rose-600/55',
    activeBg: 'bg-rose-500/20',
    activeFg: 'text-rose-900 dark:text-rose-100',
  },
  {
    name: 'Violet',
    stripe: 'bg-violet-500 dark:bg-violet-400',
    text: 'text-violet-700 dark:text-violet-300',
    activeBorder: 'border-violet-600/55',
    activeBg: 'bg-violet-500/20',
    activeFg: 'text-violet-900 dark:text-violet-100',
  },
  {
    name: 'Orange',
    stripe: 'bg-orange-500 dark:bg-orange-400',
    text: 'text-orange-700 dark:text-orange-300',
    activeBorder: 'border-orange-600/55',
    activeBg: 'bg-orange-500/20',
    activeFg: 'text-orange-950 dark:text-orange-100',
  },
  {
    name: 'Cyan',
    stripe: 'bg-cyan-500 dark:bg-cyan-400',
    text: 'text-cyan-800 dark:text-cyan-200',
    activeBorder: 'border-cyan-600/55',
    activeBg: 'bg-cyan-500/20',
    activeFg: 'text-cyan-950 dark:text-cyan-100',
  },
] as const

function newParlayId(): string {
  return `pl-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

type PicksState = { picks: string[]; parlays: ParlaySaved[] }

function normalizeParlays(raw: unknown, picks: string[]): ParlaySaved[] {
  const pickSet = new Set(picks)
  if (!Array.isArray(raw) || raw.length === 0) return []

  // Legacy: flat string[] of pick keys (single implicit parlay, all fuchsia in UI)
  if (typeof raw[0] === 'string') {
    const legs = (raw as string[]).filter((k) => pickSet.has(k))
    if (legs.length < 2) return []
    return [{ id: newParlayId(), legs, colorIndex: 0 }]
  }

  const out: ParlaySaved[] = []
  for (const item of raw as unknown[]) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const id = typeof o.id === 'string' ? o.id : newParlayId()
    const legs = Array.isArray(o.legs)
      ? (o.legs as unknown[]).filter((x): x is string => typeof x === 'string' && pickSet.has(x))
      : []
    const colorIndex =
      typeof o.colorIndex === 'number' && Number.isFinite(o.colorIndex)
        ? Math.max(0, Math.floor(o.colorIndex)) % PARLAY_PALETTE.length
        : out.length % PARLAY_PALETTE.length
    if (legs.length >= 2) out.push({ id, legs, colorIndex })
  }
  return dedupeParlayLegs(out)
}

/** One pick may only belong to one parlay — keep first occurrence. */
function dedupeParlayLegs(parlays: ParlaySaved[]): ParlaySaved[] {
  const seen = new Set<string>()
  const next: ParlaySaved[] = []
  for (const pl of parlays) {
    const legs = pl.legs.filter((k) => {
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    if (legs.length >= 2) next.push({ ...pl, legs })
  }
  return next
}

function loadInitial(): PicksState {
  if (typeof window === 'undefined') return { picks: [], parlays: [] }
  try {
    const p = JSON.parse(localStorage.getItem(PAIRING_PICKS_STORAGE_KEY) || '[]')
    const picks =
      Array.isArray(p) && p.every((x: unknown) => typeof x === 'string') ? (p as string[]) : []
    const rawPl = JSON.parse(localStorage.getItem(PARLAY_PICKS_STORAGE_KEY) || '[]')
    const parlays = normalizeParlays(rawPl, picks)
    return { picks, parlays }
  } catch {
    return { picks: [], parlays: [] }
  }
}

function persist(picks: string[], parlays: ParlaySaved[]) {
  try {
    localStorage.setItem(PAIRING_PICKS_STORAGE_KEY, JSON.stringify(picks))
    localStorage.setItem(PARLAY_PICKS_STORAGE_KEY, JSON.stringify(parlays))
  } catch {
    /* ignore */
  }
}

function stripPickFromParlays(parlays: ParlaySaved[], pickKey: string): ParlaySaved[] {
  return parlays
    .map((pl) => ({ ...pl, legs: pl.legs.filter((k) => k !== pickKey) }))
    .filter((pl) => pl.legs.length >= 2)
}

function otherParlaysUseLeg(parlays: ParlaySaved[], skipId: string | null, leg: string): boolean {
  for (const pl of parlays) {
    if (pl.id === skipId) continue
    if (pl.legs.includes(leg)) return true
  }
  return false
}

type Action =
  | { type: 'hydrate'; picks: string[]; parlays: ParlaySaved[] }
  | { type: 'togglePick'; k: string }
  | { type: 'saveParlay'; editingId: string | null; legs: string[] }
  | { type: 'deleteParlay'; id: string }

function reducer(state: PicksState, action: Action): PicksState {
  if (action.type === 'hydrate') {
    const pickSet = new Set(action.picks)
    const parlays = dedupeParlayLegs(
      action.parlays
        .map((pl) => ({
          ...pl,
          legs: pl.legs.filter((k) => pickSet.has(k)),
        }))
        .filter((pl) => pl.legs.length >= 2)
    )
    return { picks: action.picks, parlays }
  }

  if (action.type === 'togglePick') {
    const k = action.k
    const pickSet = new Set(state.picks)
    if (pickSet.has(k)) {
      pickSet.delete(k)
      const picks = [...pickSet]
      const parlays = stripPickFromParlays(state.parlays, k)
      persist(picks, parlays)
      return { picks, parlays }
    }
    pickSet.add(k)
    const picks = [...pickSet]
    persist(picks, state.parlays)
    return { picks, parlays: state.parlays }
  }

  if (action.type === 'deleteParlay') {
    const parlays = state.parlays.filter((pl) => pl.id !== action.id)
    persist(state.picks, parlays)
    return { picks: state.picks, parlays }
  }

  // saveParlay
  const { editingId, legs } = action
  const pickSet = new Set(state.picks)
  const uniq = [...new Set(legs)]
  if (uniq.length < 2 || !uniq.every((k) => pickSet.has(k))) return state

  if (editingId) {
    if (!state.parlays.some((pl) => pl.id === editingId)) return state
    for (const k of uniq) {
      if (otherParlaysUseLeg(state.parlays, editingId, k)) return state
    }
    const parlays = state.parlays.map((pl) =>
      pl.id === editingId ? { ...pl, legs: uniq } : pl
    )
    const filtered = parlays.filter((pl) => pl.legs.length >= 2)
    persist(state.picks, filtered)
    return { picks: state.picks, parlays: filtered }
  }

  for (const k of uniq) {
    if (otherParlaysUseLeg(state.parlays, null, k)) return state
  }
  const colorIndex = state.parlays.length % PARLAY_PALETTE.length
  const parlays = [...state.parlays, { id: newParlayId(), legs: uniq, colorIndex }]
  persist(state.picks, parlays)
  return { picks: state.picks, parlays }
}

export function usePairingPicks() {
  const [raw, dispatch] = useReducer(reducer, { picks: [], parlays: [] })

  useEffect(() => {
    const s = loadInitial()
    if (s.picks.length > 0 || s.parlays.length > 0) {
      dispatch({ type: 'hydrate', picks: s.picks, parlays: s.parlays })
      persist(s.picks, s.parlays)
    }
  }, [])

  const pairingPickKeys = useMemo(() => new Set(raw.picks), [raw.picks])

  const parlayLegLookup = useMemo(() => {
    const m = new Map<string, { parlayId: string; colorIndex: number }>()
    for (const pl of raw.parlays) {
      for (const leg of pl.legs) {
        m.set(leg, { parlayId: pl.id, colorIndex: pl.colorIndex })
      }
    }
    return m
  }, [raw.parlays])

  const togglePairingPick = useCallback((pairingGroupKey: string, playerId: string) => {
    dispatch({ type: 'togglePick', k: makePairingPickKey(pairingGroupKey, playerId) })
  }, [])

  const saveParlay = useCallback((editingId: string | null, legs: string[]) => {
    dispatch({ type: 'saveParlay', editingId, legs })
  }, [])

  const deleteParlay = useCallback((id: string) => {
    dispatch({ type: 'deleteParlay', id })
  }, [])

  return {
    pairingPickKeys,
    parlays: raw.parlays,
    parlayLegLookup,
    togglePairingPick,
    saveParlay,
    deleteParlay,
  }
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

/** Opens parlay builder — each parlay has its own palette color. */
export function ParlayPickButton({
  inParlay,
  disabled,
  palette,
  onClick,
}: {
  inParlay: boolean
  disabled?: boolean
  palette?: (typeof PARLAY_PALETTE)[number]
  onClick: () => void
}) {
  const p = palette
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={inParlay ? 'Edit parlay legs' : 'Build parlay — add other picks'}
      title={
        disabled
          ? 'Pick this golfer (✦) first'
          : inParlay
            ? 'Edit parlay legs'
            : 'Build parlay — choose other ✦ picks'
      }
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={
        disabled
          ? 'shrink-0 text-[10px] font-bold leading-none px-1 py-0.5 rounded border border-transparent opacity-35 cursor-not-allowed text-muted-foreground'
          : inParlay && p
            ? `shrink-0 text-[10px] font-bold leading-none px-1 py-0.5 rounded border transition-colors ${p.activeBorder} ${p.activeBg} ${p.activeFg}`
            : 'shrink-0 text-[10px] font-bold leading-none px-1 py-0.5 rounded border border-border/80 text-muted-foreground hover:border-fuchsia-500/50 hover:text-fuchsia-700 dark:hover:text-fuchsia-300 transition-colors'
      }
    >
      P
    </button>
  )
}

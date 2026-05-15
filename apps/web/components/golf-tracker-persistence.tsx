"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  startTransition,
} from "react"

import { createClient } from "@/lib/supabase/client"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { ensureGolfTrackerTable } from "@/lib/db/ensure-golf-tracker-schema-client"
import { isGolfTrackerTableSchemaError } from "@/lib/db/schema-errors"

/** Left-edge bands on pairing rows (Followed / Pairings). Thicker bars + black outline for clarity. */
const STRIPE_WIDTH = "w-2.5"

export function PairingRowAccentStripes({
  starred,
  pairingPicked,
  parlayStripeClass,
  inParlay,
}: {
  starred: boolean
  pairingPicked: boolean
  parlayStripeClass: string | undefined
  inParlay: boolean
}) {
  const segments: string[] =
    inParlay && parlayStripeClass
      ? [parlayStripeClass]
      : [
          ...(starred ? ["bg-amber-400 dark:bg-amber-500"] : []),
          ...(pairingPicked ? ["bg-violet-500 dark:bg-violet-400"] : []),
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
          className={`${STRIPE_WIDTH} min-h-full shrink-0 self-stretch opacity-70 ${cls} ${
            i < segments.length - 1 ? "border-r-2 border-black dark:border-black" : ""
          }`}
        />
      ))}
    </div>
  )
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
      className={`min-w-0 shrink px-1.5 h-full border-l border-input transition-colors sm:px-2 md:px-3 ${
        selected
          ? "bg-primary text-primary-foreground"
          : "hover:bg-muted text-foreground"
      }`}
      onClick={onClick}
    >
      <span className="md:hidden">Followed</span>
      <span className="hidden md:inline">Followed Pairings</span>
    </button>
  )
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
      className={`min-w-0 shrink px-1.5 h-full border-l border-input transition-colors sm:px-2 md:px-3 ${
        selected
          ? "bg-primary text-primary-foreground"
          : "hover:bg-muted text-foreground"
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
      aria-label={starred ? "Remove star" : "Star player"}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`shrink-0 text-base leading-none px-0.5 py-0.5 rounded transition-colors ${
        starred
          ? "text-amber-600/90 dark:text-amber-400/90 hover:text-amber-600 dark:hover:text-amber-300"
          : "text-muted-foreground/70 hover:text-amber-600/70 dark:hover:text-amber-400/70"
      }`}
    >
      {starred ? "★" : "☆"}
    </button>
  )
}

/** Composite key: pairing group id + player (newline cannot appear in ESPN ids or pairing keys). */
export function makePairingPickKey(pairingGroupKey: string, playerId: string): string {
  return `${pairingGroupKey}\n${playerId}`
}

export function parsePairingPickKey(k: string): { pairingGroupKey: string; playerId: string } | null {
  const i = k.indexOf("\n")
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
    name: "Fuchsia",
    stripe: "bg-fuchsia-500 dark:bg-fuchsia-400",
    text: "text-fuchsia-700 dark:text-fuchsia-300",
    activeBorder: "border-fuchsia-600/55",
    activeBg: "bg-fuchsia-500/20",
    activeFg: "text-fuchsia-800 dark:text-fuchsia-200",
  },
  {
    name: "Sky",
    stripe: "bg-sky-500 dark:bg-sky-400",
    text: "text-sky-700 dark:text-sky-300",
    activeBorder: "border-sky-600/55",
    activeBg: "bg-sky-500/20",
    activeFg: "text-sky-900 dark:text-sky-100",
  },
  {
    name: "Emerald",
    stripe: "bg-emerald-500 dark:bg-emerald-400",
    text: "text-emerald-700 dark:text-emerald-300",
    activeBorder: "border-emerald-600/55",
    activeBg: "bg-emerald-500/20",
    activeFg: "text-emerald-900 dark:text-emerald-100",
  },
  {
    name: "Amber",
    stripe: "bg-amber-500 dark:bg-amber-400",
    text: "text-amber-800 dark:text-amber-200",
    activeBorder: "border-amber-600/55",
    activeBg: "bg-amber-500/20",
    activeFg: "text-amber-950 dark:text-amber-100",
  },
  {
    name: "Rose",
    stripe: "bg-rose-500 dark:bg-rose-400",
    text: "text-rose-700 dark:text-rose-300",
    activeBorder: "border-rose-600/55",
    activeBg: "bg-rose-500/20",
    activeFg: "text-rose-900 dark:text-rose-100",
  },
  {
    name: "Violet",
    stripe: "bg-violet-500 dark:bg-violet-400",
    text: "text-violet-700 dark:text-violet-300",
    activeBorder: "border-violet-600/55",
    activeBg: "bg-violet-500/20",
    activeFg: "text-violet-900 dark:text-violet-100",
  },
  {
    name: "Orange",
    stripe: "bg-orange-500 dark:bg-orange-400",
    text: "text-orange-700 dark:text-orange-300",
    activeBorder: "border-orange-600/55",
    activeBg: "bg-orange-500/20",
    activeFg: "text-orange-950 dark:text-orange-100",
  },
  {
    name: "Cyan",
    stripe: "bg-cyan-500 dark:bg-cyan-400",
    text: "text-cyan-800 dark:text-cyan-200",
    activeBorder: "border-cyan-600/55",
    activeBg: "bg-cyan-500/20",
    activeFg: "text-cyan-950 dark:text-cyan-100",
  },
] as const

function newParlayId(): string {
  return `pl-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

type PicksState = { picks: string[]; parlays: ParlaySaved[] }

function normalizeParlays(raw: unknown, picks: string[]): ParlaySaved[] {
  const pickSet = new Set(picks)
  if (!Array.isArray(raw) || raw.length === 0) return []

  if (typeof raw[0] === "string") {
    const legs = (raw as string[]).filter((k) => pickSet.has(k))
    if (legs.length < 2) return []
    return [{ id: newParlayId(), legs, colorIndex: 0 }]
  }

  const out: ParlaySaved[] = []
  for (const item of raw as unknown[]) {
    if (!item || typeof item !== "object") continue
    const o = item as Record<string, unknown>
    const id = typeof o.id === "string" ? o.id : newParlayId()
    const legs = Array.isArray(o.legs)
      ? (o.legs as unknown[]).filter((x): x is string => typeof x === "string" && pickSet.has(x))
      : []
    const colorIndex =
      typeof o.colorIndex === "number" && Number.isFinite(o.colorIndex)
        ? Math.max(0, Math.floor(o.colorIndex)) % PARLAY_PALETTE.length
        : out.length % PARLAY_PALETTE.length
    if (legs.length >= 2) out.push({ id, legs, colorIndex })
  }
  return dedupeParlayLegs(out)
}

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

type PickAction =
  | { type: "hydrate"; picks: string[]; parlays: ParlaySaved[] }
  | { type: "togglePick"; k: string }
  | { type: "saveParlay"; editingId: string | null; legs: string[] }
  | { type: "deleteParlay"; id: string }

function makePairingReducer(persist: (picks: string[], parlays: ParlaySaved[]) => void) {
  return function pairingReducer(state: PicksState, action: PickAction): PicksState {
    if (action.type === "hydrate") {
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

    if (action.type === "togglePick") {
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

    if (action.type === "deleteParlay") {
      const parlays = state.parlays.filter((pl) => pl.id !== action.id)
      persist(state.picks, parlays)
      return { picks: state.picks, parlays }
    }

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
}

/** Provider assigns `.current` in an effect so the reducer never reads React refs during render. */
const persistPairingBridge = {
  current: (() => {}) as (picks: string[], parlays: ParlaySaved[]) => void,
}

function persistPairingFromReducer(picks: string[], parlays: ParlaySaved[]) {
  persistPairingBridge.current(picks, parlays)
}

const sharedPairingReducer = makePairingReducer(persistPairingFromReducer)

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
          ? "Remove pick for this pairing"
          : "Pick this golfer in this pairing (day / group matchup)"
      }
      title={
        picked
          ? "Your pick in this pairing"
          : "Pick in this pairing (separate from tournament star)"
      }
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`shrink-0 text-sm leading-none px-0.5 py-0.5 rounded transition-colors ${
        picked
          ? "text-violet-700 dark:text-violet-300 hover:text-violet-600 dark:hover:text-violet-200"
          : "text-muted-foreground/55 hover:text-violet-600/80 dark:hover:text-violet-400/80"
      }`}
    >
      {picked ? "✦" : "✧"}
    </button>
  )
}

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
      aria-label={inParlay ? "Edit parlay legs" : "Build parlay — add other picks"}
      title={
        disabled
          ? "Pick this golfer (✦) first"
          : inParlay
            ? "Edit parlay legs"
            : "Build parlay — choose other ✦ picks"
      }
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={
        disabled
          ? "shrink-0 text-[10px] font-bold leading-none px-1 py-0.5 rounded border border-transparent opacity-35 cursor-not-allowed text-muted-foreground"
          : inParlay && p
            ? `shrink-0 text-[10px] font-bold leading-none px-1 py-0.5 rounded border transition-colors ${p.activeBorder} ${p.activeBg} ${p.activeFg}`
            : "shrink-0 text-[10px] font-bold leading-none px-1 py-0.5 rounded border border-border/80 text-muted-foreground hover:border-fuchsia-500/50 hover:text-fuchsia-700 dark:hover:text-fuchsia-300 transition-colors"
      }
    >
      P
    </button>
  )
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === "string")
}

const ANON_PREFS_LS_KEY = "golf-tracker-anon-prefs-v1"

type LocalAnonSnapshot = {
  followed: string[]
  starred: string[]
  picks: string[]
  parlays: ParlaySaved[]
}

function readAnonPrefsFromStorage(): LocalAnonSnapshot | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(ANON_PREFS_LS_KEY)
    if (!raw) return null
    const o = JSON.parse(raw) as Record<string, unknown>
    const followed = asStringArray(o.followed)
    const starred = asStringArray(o.starred)
    const picks = asStringArray(o.picks)
    const parlays = normalizeParlays(o.parlays, picks)
    return { followed, starred, picks, parlays }
  } catch {
    return null
  }
}

function writeAnonPrefsToStorage(s: LocalAnonSnapshot): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(
      ANON_PREFS_LS_KEY,
      JSON.stringify({
        followed: s.followed,
        starred: s.starred,
        picks: s.picks,
        parlays: s.parlays,
      })
    )
  } catch (e) {
    console.error("[golf-tracker] localStorage save failed:", e)
  }
}

type GolfTrackerRow = {
  user_id: string
  followed_pairing_keys: unknown
  starred_player_ids: unknown
  pairing_pick_keys: unknown
  parlays: unknown
}

type Ctx = {
  followedKeys: Set<string>
  toggleFollowed: (key: string) => void
  starredIds: Set<string>
  toggleStar: (playerId: string) => void
  pairingPickKeys: Set<string>
  parlays: ParlaySaved[]
  parlayLegLookup: Map<string, { parlayId: string; colorIndex: number }>
  togglePairingPick: (pairingGroupKey: string, playerId: string) => void
  saveParlay: (editingId: string | null, legs: string[]) => void
  deleteParlay: (id: string) => void
}

const GolfTrackerCtx = createContext<Ctx | null>(null)

function useGolfTrackerCtx(): Ctx {
  const v = useContext(GolfTrackerCtx)
  if (!v) throw new Error("GolfTrackerPersistenceProvider is required")
  return v
}

export function GolfTrackerPersistenceProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [sessionResolved, setSessionResolved] = useState(false)
  const [followedKeys, setFollowedKeys] = useState<Set<string>>(() => new Set())
  const [starredIds, setStarredIds] = useState<Set<string>>(() => new Set())

  const userIdRef = useRef<string | null>(null)
  const schedulePersistRef = useRef<() => void>(() => {})
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevUserIdRef = useRef<string | null>(null)
  const lastLoggedUserIdRef = useRef<string | null>(null)
  const flushRemoteRef = useRef<() => Promise<void>>(async () => {})
  const flushLocalRef = useRef<() => void>(() => {})

  const [raw, dispatch] = useReducer(sharedPairingReducer, {
    picks: [],
    parlays: [],
  })

  const latestRef = useRef({
    followed: [] as string[],
    starred: [] as string[],
    picks: [] as string[],
    parlays: [] as ParlaySaved[],
  })

  useEffect(() => {
    userIdRef.current = userId
  }, [userId])

  useEffect(() => {
    latestRef.current = {
      followed: [...followedKeys],
      starred: [...starredIds],
      picks: raw.picks,
      parlays: raw.parlays,
    }
  }, [followedKeys, starredIds, raw.picks, raw.parlays])

  const flushRemote = useCallback(async () => {
    const uid = userId
    if (!uid || !isSupabaseConfigured()) return
    const s = latestRef.current
    const supabase = createClient()

    const payload = {
      user_id: uid,
      followed_pairing_keys: s.followed,
      starred_player_ids: s.starred,
      pairing_pick_keys: s.picks,
      parlays: s.parlays,
      updated_at: new Date().toISOString(),
    }

    const upsert = () =>
      supabase.from("golf_tracker_preferences").upsert(payload, { onConflict: "user_id" })

    await ensureGolfTrackerTable()
    let { error } = await upsert()
    if (error && isGolfTrackerTableSchemaError(error)) {
      await ensureGolfTrackerTable()
      ;({ error } = await upsert())
    }
    if (error) console.error("[golf-tracker] remote save failed:", error.message)
  }, [userId])

  const flushLocal = useCallback(() => {
    const s = latestRef.current
    writeAnonPrefsToStorage({
      followed: s.followed,
      starred: s.starred,
      picks: s.picks,
      parlays: s.parlays,
    })
  }, [])

  useEffect(() => {
    flushRemoteRef.current = flushRemote
  }, [flushRemote])

  useEffect(() => {
    flushLocalRef.current = flushLocal
  }, [flushLocal])

  const schedulePersist = useCallback(() => {
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current)
    persistTimerRef.current = setTimeout(() => {
      persistTimerRef.current = null
      const uid = userIdRef.current
      if (uid && isSupabaseConfigured()) {
        void flushRemoteRef.current()
      } else {
        flushLocalRef.current()
      }
    }, 450)
  }, [])

  useEffect(() => {
    schedulePersistRef.current = schedulePersist
  }, [schedulePersist])

  useEffect(() => {
    persistPairingBridge.current = () => {
      schedulePersistRef.current()
    }
  }, [schedulePersist])

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      startTransition(() => {
        setSessionResolved(true)
      })
      return
    }
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null)
    })
    void supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        setUserId(user?.id ?? null)
      })
      .finally(() => {
        setSessionResolved(true)
      })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (userId) {
      lastLoggedUserIdRef.current = userId
    }
  }, [userId])

  useEffect(() => {
    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current)
        persistTimerRef.current = null
      }
      const uid = userIdRef.current
      if (uid && isSupabaseConfigured()) {
        void flushRemoteRef.current()
      } else {
        flushLocalRef.current()
      }
    }
  }, [])

  useEffect(() => {
    if (!sessionResolved) return
    if (userId) return

    if (lastLoggedUserIdRef.current !== null) {
      writeAnonPrefsToStorage({
        followed: latestRef.current.followed,
        starred: latestRef.current.starred,
        picks: latestRef.current.picks,
        parlays: latestRef.current.parlays,
      })
      lastLoggedUserIdRef.current = null
      prevUserIdRef.current = null
      return
    }

    const snap = readAnonPrefsFromStorage()
    if (!snap) return
    startTransition(() => {
      setFollowedKeys(new Set(snap.followed))
      setStarredIds(new Set(snap.starred))
      dispatch({ type: "hydrate", picks: snap.picks, parlays: snap.parlays })
    })
  }, [sessionResolved, userId])

  useEffect(() => {
    if (!userId || !isSupabaseConfigured()) return

    if (prevUserIdRef.current !== null && prevUserIdRef.current !== userId) {
      startTransition(() => {
        setFollowedKeys(new Set())
        setStarredIds(new Set())
        dispatch({ type: "hydrate", picks: [], parlays: [] })
      })
    }
    prevUserIdRef.current = userId

    let cancelled = false
    const supabase = createClient()

    void (async () => {
      const selectPrefs = () =>
        supabase.from("golf_tracker_preferences").select("*").eq("user_id", userId).maybeSingle()

      await ensureGolfTrackerTable()
      let { data: row, error } = await selectPrefs()

      if (cancelled) return
      if (error && isGolfTrackerTableSchemaError(error)) {
        await ensureGolfTrackerTable()
        ;({ data: row, error } = await selectPrefs())
      }

      if (cancelled) return
      if (error) {
        console.error("[golf-tracker] remote load failed:", error.message)
        return
      }

      if (row) {
        const r = row as GolfTrackerRow
        setFollowedKeys(new Set(asStringArray(r.followed_pairing_keys)))
        setStarredIds(new Set(asStringArray(r.starred_player_ids)))
        const picks = asStringArray(r.pairing_pick_keys)
        const parlays = normalizeParlays(r.parlays, picks)
        dispatch({ type: "hydrate", picks, parlays })
      } else {
        setFollowedKeys(new Set())
        setStarredIds(new Set())
        dispatch({ type: "hydrate", picks: [], parlays: [] })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [userId])

  const toggleFollowed = useCallback((key: string) => {
    setFollowedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      schedulePersistRef.current()
      return next
    })
  }, [])

  const toggleStar = useCallback((playerId: string) => {
    setStarredIds((prev) => {
      const next = new Set(prev)
      if (next.has(playerId)) next.delete(playerId)
      else next.add(playerId)
      schedulePersistRef.current()
      return next
    })
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
    dispatch({ type: "togglePick", k: makePairingPickKey(pairingGroupKey, playerId) })
  }, [])

  const saveParlay = useCallback((editingId: string | null, legs: string[]) => {
    dispatch({ type: "saveParlay", editingId, legs })
  }, [])

  const deleteParlay = useCallback((id: string) => {
    dispatch({ type: "deleteParlay", id })
  }, [])

  const value = useMemo<Ctx>(
    () => ({
      followedKeys,
      toggleFollowed,
      starredIds,
      toggleStar,
      pairingPickKeys,
      parlays: raw.parlays,
      parlayLegLookup,
      togglePairingPick,
      saveParlay,
      deleteParlay,
    }),
    [
      followedKeys,
      toggleFollowed,
      starredIds,
      toggleStar,
      pairingPickKeys,
      raw.parlays,
      parlayLegLookup,
      togglePairingPick,
      saveParlay,
      deleteParlay,
    ]
  )

  return <GolfTrackerCtx.Provider value={value}>{children}</GolfTrackerCtx.Provider>
}

export function useFollowedPairings() {
  const { followedKeys, toggleFollowed } = useGolfTrackerCtx()
  return { followedKeys, toggleFollowed }
}

export function useStarredPlayers() {
  const { starredIds, toggleStar } = useGolfTrackerCtx()
  return { starredIds, toggleStar }
}

export function usePairingPicks() {
  const {
    pairingPickKeys,
    parlays,
    parlayLegLookup,
    togglePairingPick,
    saveParlay,
    deleteParlay,
  } = useGolfTrackerCtx()
  return {
    pairingPickKeys,
    parlays,
    parlayLegLookup,
    togglePairingPick,
    saveParlay,
    deleteParlay,
  }
}

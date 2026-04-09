'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { parseTournamentData } from '@/lib/espn'
import type { Player, TournamentMeta } from '@/lib/types'
import { scoreClass, Score, Flag } from '@/components/golf-tracker-display'
import { PairingsView } from '@/components/pairings-view'
import { useFollowedPairings, FollowedPairingsTabButton } from '@/components/followed-pairings'

// ─── Refresh interval (ms) ────────────────────────────────────────────────────
const REFRESH_MS = 60_000

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Player['status'] }) {
  if (status === 'cut')
    return (
      <span className="ml-1.5 text-[10px] font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
        CUT
      </span>
    )
  if (status === 'withdrawn')
    return (
      <span className="ml-1.5 text-[10px] font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
        WD
      </span>
    )
  return null
}

// ─── Leaderboard table ────────────────────────────────────────────────────────
function LeaderboardTable({ players }: { players: Player[] }) {
  if (players.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground text-sm">
        No players match your search.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm min-w-[700px]">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs tracking-wider w-14">
              POS
            </th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs tracking-wider">
              PLAYER
            </th>
            <th className="text-center py-3 px-3 font-medium text-muted-foreground text-xs tracking-wider w-16">
              TOTAL
            </th>
            <th className="text-center py-3 px-3 font-medium text-muted-foreground text-xs tracking-wider w-12">
              R1
            </th>
            <th className="text-center py-3 px-3 font-medium text-muted-foreground text-xs tracking-wider w-12">
              R2
            </th>
            <th className="text-center py-3 px-3 font-medium text-muted-foreground text-xs tracking-wider w-12">
              R3
            </th>
            <th className="text-center py-3 px-3 font-medium text-muted-foreground text-xs tracking-wider w-12">
              R4
            </th>
            <th className="text-center py-3 px-3 font-medium text-muted-foreground text-xs tracking-wider w-14">
              THRU
            </th>
            <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs tracking-wider">
              TEE TIME
            </th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, i) => (
            <PlayerRow key={player.id} player={player} even={i % 2 === 0} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PlayerRow({ player: p, even }: { player: Player; even: boolean }) {
  const dimmed = p.status === 'cut' || p.status === 'withdrawn'

  return (
    <tr
      className={[
        'border-b border-border last:border-0 transition-colors',
        'hover:bg-muted/30',
        even ? '' : 'bg-muted/[0.06]',
        dimmed ? 'opacity-40' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Position */}
      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{p.posDisplay}</td>

      {/* Player */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <Flag url={p.flagUrl} country={p.country} />
          <span className={`font-medium ${dimmed ? 'line-through decoration-muted-foreground' : ''}`}>
            {p.name}
          </span>
          <StatusBadge status={p.status} />
        </div>
      </td>

      {/* Total score */}
      <td className="py-3 px-3 text-center">
        <Score score={p.totalScore} bold size="base" />
      </td>

      {/* Round scores */}
      {p.rounds.map((r, idx) => (
        <td key={idx} className="py-3 px-3 text-center">
          {r.raw !== null ? (
            <span
              className={`text-xs ${r.rel ? scoreClass(r.rel) : 'text-muted-foreground'}`}
              title={r.rel ? `${r.rel} (par relative)` : undefined}
            >
              {r.raw}
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )}
        </td>
      ))}

      {/* Thru */}
      <td className="py-3 px-3 text-center text-xs text-muted-foreground">{p.thru}</td>

      {/* Tee time */}
      <td className="py-3 px-3 text-xs text-muted-foreground whitespace-nowrap">{p.teeTime}</td>
    </tr>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({
  meta,
  countdown,
  lastUpdated,
  onRefresh,
  refreshing,
}: {
  meta: TournamentMeta | null
  countdown: number
  lastUpdated: Date | null
  onRefresh: () => void
  refreshing: boolean
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-screen-xl mx-auto px-4 py-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight leading-tight">
            {meta?.name ?? 'Golf Tracker'}
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {meta && (
              <span className="text-sm text-muted-foreground">
                Round {meta.round}
                {meta.roundDescription ? ` · ${meta.roundDescription}` : ''}
              </span>
            )}
            {!meta?.completed && (
              <span className="flex items-center gap-1 text-[11px] font-medium bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                LIVE
              </span>
            )}
            {meta?.completed && (
              <span className="text-[11px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                FINAL
              </span>
            )}
          </div>
        </div>

        <div className="text-right text-xs text-muted-foreground flex-shrink-0">
          {lastUpdated && (
            <div>Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          )}
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="mt-1 text-xs underline underline-offset-2 hover:text-foreground transition-colors disabled:opacity-50"
          >
            {refreshing ? 'Refreshing…' : `Refresh in ${countdown}s`}
          </button>
        </div>
      </div>
    </header>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function GolfTracker() {
  const [players, setPlayers] = useState<Player[]>([])
  const [meta, setMeta] = useState<TournamentMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState(REFRESH_MS / 1000)

  // Controls
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'leaderboard' | 'pairings' | 'followed'>('leaderboard')
  const [showCuts, setShowCuts] = useState(true)
  const { followedKeys, toggleFollowed } = useFollowedPairings()

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true)
    try {
      const res = await fetch('/api/tournament', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      const parsed = parseTournamentData(data)
      if (!parsed) {
        setError('No active tournament found. Check back during a PGA Tour event.')
        return
      }

      setMeta(parsed.meta)
      setPlayers(parsed.players)
      setLastUpdated(new Date())
      setError(null)
      setCountdown(REFRESH_MS / 1000)
    } catch (err) {
      console.error(err)
      if (!silent) setError('Could not load tournament data. Will retry automatically.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => fetchData(true), REFRESH_MS)
    return () => clearInterval(interval)
  }, [fetchData])

  // Countdown tick
  useEffect(() => {
    const tick = setInterval(
      () => setCountdown((c) => (c > 0 ? c - 1 : REFRESH_MS / 1000)),
      1000
    )
    return () => clearInterval(tick)
  }, [])

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = players
    if (!showCuts) list = list.filter((p) => p.status !== 'cut' && p.status !== 'withdrawn')
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.country.toLowerCase().includes(q) ||
          p.shortName.toLowerCase().includes(q)
      )
    }
    return list
  }, [players, search, showCuts])

  /** Cut/WD only — pairings group by tee time; search filters groups inside PairingsView. */
  const playersForPairings = useMemo(() => {
    let list = players
    if (!showCuts) list = list.filter((p) => p.status !== 'cut' && p.status !== 'withdrawn')
    return list
  }, [players, showCuts])

  // ── Render states ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading tournament data…</p>
        </div>
      </div>
    )
  }

  if (error && players.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-muted-foreground mb-4 text-sm">{error}</p>
          <button
            onClick={() => fetchData()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        meta={meta}
        countdown={countdown}
        lastUpdated={lastUpdated}
        onRefresh={() => fetchData()}
        refreshing={refreshing}
      />

      {/* Controls bar */}
      <div className="max-w-screen-xl mx-auto px-4 py-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-56">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search player or country…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 h-9 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>

        {/* View toggle */}
        <div className="flex rounded-lg border border-input overflow-hidden text-sm h-9">
          <button
            className={`px-3 h-full transition-colors ${
              view === 'leaderboard'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted text-foreground'
            }`}
            onClick={() => setView('leaderboard')}
          >
            Leaderboard
          </button>
          <button
            className={`px-3 h-full border-l border-input transition-colors ${
              view === 'pairings'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted text-foreground'
            }`}
            onClick={() => setView('pairings')}
          >
            Pairings
          </button>
          <FollowedPairingsTabButton
            selected={view === 'followed'}
            onClick={() => setView('followed')}
          />
        </div>

        {/* Cut toggle */}
        <button
          onClick={() => setShowCuts((v) => !v)}
          className={`h-9 px-3 rounded-lg border text-sm transition-colors ${
            showCuts
              ? 'border-input hover:bg-muted'
              : 'border-primary bg-primary/10 text-primary'
          }`}
        >
          {showCuts ? 'Hide cuts' : 'Show cuts'}
        </button>

        {/* Result count */}
        {search && (
          <span className="text-xs text-muted-foreground">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Main content */}
      <main className="max-w-screen-xl mx-auto px-4 pb-12">
        {view === 'leaderboard' ? (
          <LeaderboardTable players={filtered} />
        ) : (
          <PairingsView
            players={playersForPairings}
            search={search}
            followedKeys={followedKeys}
            onToggleFollow={toggleFollowed}
            showFollowToggle
            onlyFollowed={view === 'followed'}
          />
        )}

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Data via ESPN · auto-refreshes every 60 s · press{' '}
          <kbd className="font-mono bg-muted px-1 rounded">D</kbd> to toggle dark mode
        </p>
      </main>
    </div>
  )
}

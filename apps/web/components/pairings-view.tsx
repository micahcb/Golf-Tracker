'use client'

import { useMemo } from 'react'
import type { Player } from '@/lib/types'
import { Flag, Score } from '@/components/golf-tracker-display'

// ─── Pairings view ────────────────────────────────────────────────────────────
interface PairingGroup {
  time: string
  ms: number
  players: Player[]
}

/** Group key: epoch ms when known; otherwise bucket by display label (often "—"). */
function pairingBucketKey(p: Player): string {
  if (p.teeTimeMs > 0) return `ms:${p.teeTimeMs}`
  return `missing:${p.teeTime}`
}

function buildPairings(players: Player[]): PairingGroup[] {
  const map = new Map<string, PairingGroup>()
  for (const p of players) {
    const key = pairingBucketKey(p)
    if (!map.has(key)) {
      map.set(key, { time: p.teeTime, ms: p.teeTimeMs, players: [] })
    }
    map.get(key)!.players.push(p)
  }
  return Array.from(map.values()).sort((a, b) => {
    if (!a.ms) return 1
    if (!b.ms) return -1
    return a.ms - b.ms
  })
}

/** Stable id for a pairing (who is grouped), survives label tweaks if the same players stay paired. */
function pairingKey(players: Player[]): string {
  return [...players]
    .map((p) => p.id)
    .sort()
    .join(',')
}

export function PairingsView({
  players,
  search,
  followedKeys,
  onToggleFollow,
  showFollowToggle,
  onlyFollowed,
}: {
  players: Player[]
  search: string
  followedKeys: Set<string>
  onToggleFollow: (key: string) => void
  showFollowToggle: boolean
  onlyFollowed?: boolean
}) {
  const groups = useMemo(() => buildPairings(players), [players])

  const filtered = useMemo(() => {
    let list = groups
    if (onlyFollowed) {
      list = list.filter((g) => followedKeys.has(pairingKey(g.players)))
    }
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter((g) =>
      g.players.some(
        (p) =>
          p.name.toLowerCase().includes(q) || p.country.toLowerCase().includes(q)
      )
    )
  }, [groups, search, onlyFollowed, followedKeys])

  if (filtered.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground text-sm">
        {onlyFollowed
          ? 'No followed pairings yet. Open Pairings and tap Follow on the groups you care about.'
          : 'No pairings found.'}
      </div>
    )
  }

  const hasRealTimes = filtered.some((g) => g.ms > 0)
  if (!hasRealTimes) {
    return (
      <div className="text-center py-20 text-muted-foreground text-sm">
        Tee time / pairing data isn&apos;t available for this round yet.
        <br />
        Check back closer to tee-off.
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filtered.map((group) => {
        const key = pairingKey(group.players)
        const isFollowed = followedKeys.has(key)
        return (
          <div
            key={key}
            className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase min-w-0">
                {group.time}
              </div>
              {showFollowToggle && (
                <button
                  type="button"
                  onClick={() => onToggleFollow(key)}
                  className={`flex-shrink-0 text-xs font-medium px-2 py-1 rounded-md border transition-colors ${
                    isFollowed
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isFollowed ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
            {group.players.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Flag url={p.flagUrl} country={p.country} />
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.posDisplay}</div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <Score score={p.totalScore} bold />
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Thru {p.thru}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

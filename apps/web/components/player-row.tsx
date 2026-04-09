'use client'

import { useState } from 'react'
import type { Player } from '@/lib/types'
import { scoreClass, Score, Flag } from '@/components/golf-tracker-display'
import { StarPlayerButton } from '@/components/starred-players'
import { MovementBadge } from '@/components/movement-badge'
import { ScorecardRow } from '@/components/scorecard-row'

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

// ─── Single player row ────────────────────────────────────────────────────────
function PlayerRow({
  player: p,
  even,
  movement,
  isFollowed,
  starred,
  onToggleStar,
  expanded,
  onToggle,
}: {
  player: Player
  even: boolean
  movement?: number
  isFollowed: boolean
  starred: boolean
  onToggleStar?: () => void
  expanded: boolean
  onToggle: () => void
}) {
  const dimmed = p.status === 'cut' || p.status === 'withdrawn'

  return (
    <tr
      onClick={onToggle}
      className={[
        'border-b border-border transition-colors cursor-pointer select-none',
        'hover:bg-muted/30',
        starred ? '' : even ? '' : 'bg-muted/[0.06]',
        dimmed ? 'opacity-40' : '',
        isFollowed ? 'bg-primary/[0.05] dark:bg-primary/[0.08]' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Position + movement arrow */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs text-muted-foreground">{p.posDisplay}</span>
          <MovementBadge delta={movement} />
        </div>
      </td>

      {/* Player name + flag + followed star */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {onToggleStar != null && (
            <StarPlayerButton starred={starred} onClick={onToggleStar} />
          )}
          <Flag url={p.flagUrl} country={p.country} />
          <span
            className={`font-medium ${dimmed ? 'line-through decoration-muted-foreground' : ''} ${starred ? 'text-foreground' : ''}`}
          >
            {p.name}
          </span>
          {isFollowed && (
            <span className="text-primary text-[11px] leading-none" title="Followed pairing">
              ★
            </span>
          )}
          <StatusBadge status={p.status} />
        </div>
      </td>

      {/* Total score */}
      <td className="py-3 px-3 text-center">
        <Score score={p.totalScore} bold size="base" />
      </td>

      {/* Round scores R1–R4 */}
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

      {/* Tee time + expand chevron */}
      <td className="py-3 px-3 text-xs text-muted-foreground whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span>{p.teeTime}</span>
          <span
            className={`ml-auto opacity-35 transition-transform duration-150 text-[10px] ${
              expanded ? 'rotate-180' : ''
            }`}
          >
            ▾
          </span>
        </div>
      </td>
    </tr>
  )
}

// ─── Player row + optional scorecard expansion ────────────────────────────────
export function PlayerRowGroup({
  player,
  even,
  movement,
  isFollowed,
  starred = false,
  onToggleStar,
}: {
  player: Player
  even: boolean
  movement?: number
  isFollowed: boolean
  starred?: boolean
  onToggleStar?: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <PlayerRow
        player={player}
        even={even}
        movement={movement}
        isFollowed={isFollowed}
        starred={starred}
        onToggleStar={onToggleStar}
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
      />
      {expanded && <ScorecardRow player={player} />}
    </>
  )
}

'use client'

import { scoreToNum } from '@/lib/espn'
import type { Player } from '@/lib/types'

// ─── ESPN scorecard colour convention ─────────────────────────────────────────
//   scoreType.displayValue = relative delta: "E", "-1", "-2", "+1", "+2" …
//   Eagle or better  →  yellow filled pill
//   Birdie           →  green filled pill
//   Par              →  plain number, no background
//   Bogey            →  red/pink filled pill
//   Double bogey+    →  blue filled pill

function holeScoreBg(rel: string): string | null {
  const n = scoreToNum(rel)
  if (n <= -2) return 'bg-yellow-400 text-yellow-900'
  if (n === -1) return 'bg-green-500 text-white'
  if (n === 1)  return 'bg-red-400 text-white'
  if (n >= 2)   return 'bg-blue-400 text-white'
  return null  // par — no pill
}

// ─── Single hole cell ─────────────────────────────────────────────────────────
function HoleCell({ holeNum, player }: { holeNum: number; player: Player }) {
  const h = player.holeScores.find((x) => x.hole === holeNum)
  const bg = h ? holeScoreBg(h.rel) : null

  return (
    <div className="flex flex-col items-center" style={{ minWidth: '2rem' }}>
      <span className="text-[10px] text-muted-foreground mb-1">{holeNum}</span>
      <div className="flex items-center justify-center w-8 h-7">
        {h ? (
          bg ? (
            <span
              className={`${bg} rounded px-1.5 py-0.5 text-[11px] font-semibold min-w-[1.6rem] text-center`}
            >
              {h.strokes}
            </span>
          ) : (
            <span className="text-[11px] text-foreground">{h.strokes}</span>
          )
        ) : (
          <span className="text-[11px] text-muted-foreground/30">—</span>
        )}
      </div>
    </div>
  )
}

// ─── Subtotal cell ────────────────────────────────────────────────────────────
function SubtotalCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center" style={{ minWidth: '2.5rem' }}>
      <span className="text-[10px] font-semibold text-muted-foreground mb-1">{label}</span>
      <span className="w-10 h-7 flex items-center justify-center text-[11px] font-bold text-foreground border border-border rounded bg-muted/30">
        {value}
      </span>
    </div>
  )
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="flex items-center gap-4 mt-2.5 text-[10px] text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-yellow-400 inline-block" />
        Eagle
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />
        Birdie
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />
        Bogey
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-blue-400 inline-block" />
        Dbl bogey+
      </span>
    </div>
  )
}

// ─── Scorecard row (expanded below a player row) ──────────────────────────────
export function ScorecardRow({ player }: { player: Player }) {
  const holes = player.holeScores
  const front9 = holes.filter((h) => h.hole <= 9)
  const back9  = holes.filter((h) => h.hole >= 10)
  const front9Total = front9.reduce((sum, h) => sum + h.strokes, 0)
  const back9Total  = back9.reduce((sum, h) => sum + h.strokes, 0)

  return (
    <tr className="bg-muted/10 border-b border-border">
      <td colSpan={9} className="px-6 py-3">
        {holes.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No hole data available for this round.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="flex items-end gap-1 min-w-max">
                {/* Front 9 */}
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <HoleCell key={n} holeNum={n} player={player} />
                ))}
                {front9.length > 0 && <SubtotalCell label="OUT" value={front9Total} />}

                {/* Divider */}
                <div className="w-px self-stretch bg-border mx-1" />

                {/* Back 9 */}
                {[10, 11, 12, 13, 14, 15, 16, 17, 18].map((n) => (
                  <HoleCell key={n} holeNum={n} player={player} />
                ))}
                {back9.length > 0 && <SubtotalCell label="IN" value={back9Total} />}

                {/* Grand total */}
                {(front9.length > 0 || back9.length > 0) && (
                  <div className="flex flex-col items-center" style={{ minWidth: '2.75rem' }}>
                    <span className="text-[10px] font-semibold text-muted-foreground mb-1">TOT</span>
                    <span className="w-11 h-7 flex items-center justify-center text-[11px] font-bold text-foreground border-2 border-border rounded">
                      {front9Total + back9Total}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Legend />
          </>
        )}
      </td>
    </tr>
  )
}

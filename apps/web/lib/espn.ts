import type {
  ESPNCompetitor,
  ESPNRoundScore,
  Player,
  PlayerStatus,
  Round,
  HoleScore,
  TournamentMeta,
  ESPNResponse,
} from './types'

// ─── Score helpers ────────────────────────────────────────────────────────────

export function scoreToNum(score: string | undefined | null): number {
  if (!score || score === 'E') return 0
  const n = parseInt(score, 10)
  return isNaN(n) ? 0 : n
}

export function formatScore(score: string | null | undefined): string {
  if (!score || score === 'E') return 'E'
  const n = scoreToNum(score)
  if (n > 0) return `+${n}`
  return score
}

// ─── Tee time extraction ──────────────────────────────────────────────────────

function parseTeeTime(round: ESPNRoundScore): { display: string; ms: number } {
  const stats = round.statistics?.categories?.[0]?.stats ?? []

  for (let i = stats.length - 1; i >= 0; i--) {
    const dv = stats[i]?.displayValue ?? ''
    // ESPN encodes tee time as a full date string, e.g. "Thu Apr 09 09:19:00 PDT 2026"
    if (dv.length > 15 && dv.includes(':')) {
      try {
        const d = new Date(dv)
        if (!isNaN(d.getTime())) {
          return {
            display: d.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              timeZone: 'America/New_York',
              timeZoneName: 'short',
            }),
            ms: d.getTime(),
          }
        }
      } catch {
        // ignore parse errors
      }
    }
  }
  return { display: '—', ms: 0 }
}

// ─── "Thru" extraction ────────────────────────────────────────────────────────

function parseThru(round: ESPNRoundScore | undefined): string {
  if (!round) return '—'
  const holes = round.linescores ?? []
  if (holes.length === 0) return '—'
  if (holes.length >= 18) return 'F'
  return String(holes.length)
}

// ─── Player parser ────────────────────────────────────────────────────────────

export function parseCompetitor(c: ESPNCompetitor, currentRound: number): Player {
  const linescores = c.linescores ?? []

  // Build 4 round slots
  const rounds = ([1, 2, 3, 4] as const).map((period): Round => {
    const ls = linescores.find((l) => l.period === period)
    if (!ls || ls.value === undefined) return { raw: null, rel: null }
    return {
      raw: Math.round(ls.value),
      rel: ls.displayValue ?? null,
    }
  }) as [Round, Round, Round, Round]

  // Active round = last linescore that has a value (for thru / status)
  const activeRound = [...linescores].reverse().find((l) => l.value !== undefined)

  const thru = parseThru(activeRound)
  const name = c.athlete?.fullName ?? 'Unknown'

  // Tee time: prefer the linescore for the competition's current period so partners stay aligned
  // when one player has a score posted for the next round and another does not.
  const roundForTee = linescores.find((l) => l.period === currentRound)
  let teeTime = '—'
  let teeTimeMs = 0
  if (roundForTee) {
    const t = parseTeeTime(roundForTee)
    if (t.ms > 0) {
      teeTime = t.display
      teeTimeMs = t.ms
    }
  }
  if (teeTimeMs === 0 && activeRound) {
    const t = parseTeeTime(activeRound)
    teeTime = t.display
    teeTimeMs = t.ms
  }

  // Hole-by-hole scores for the active round
  // scoreType.displayValue = relative-to-par delta ("E", "-1", "+1" etc)
  // displayValue           = raw stroke count ("4", "3" etc) — do NOT use for colouring
  const holeScores: HoleScore[] = (activeRound?.linescores ?? []).map((h) => ({
    hole: h.period,
    strokes: Math.round(h.value),
    rel: h.scoreType?.displayValue ?? 'E',
    type: h.scoreType?.displayValue ?? 'E',
  }))

  // Status
  const statusName = (c.status?.type?.name ?? '').toLowerCase()
  let status: PlayerStatus = 'active'
  if (statusName.includes('cut') || statusName.includes('elim')) status = 'cut'
  else if (statusName.includes('wd') || statusName.includes('withdraw')) status = 'withdrawn'
  else if (statusName.includes('complete') || thru === 'F') status = 'complete'

  return {
    id: c.id,
    position: c.order ?? 999,
    posDisplay: String(c.order ?? '—'),
    name,
    shortName: c.athlete?.shortName ?? '',
    country: c.athlete?.flag?.alt ?? '',
    flagUrl: c.athlete?.flag?.href ?? '',
    totalScore: c.score ?? 'E',
    totalNum: scoreToNum(c.score),
    rounds,
    holeScores,
    thru,
    teeTime,
    teeTimeMs,
    status,
  }
}

// ─── Tie detection ────────────────────────────────────────────────────────────

export function applyTiedPositions(players: Player[]): Player[] {
  const sorted = [...players].sort((a, b) => a.position - b.position)

  for (let i = 0; i < sorted.length; i++) {
    const curr = sorted[i]
    const prev = sorted[i - 1]
    const next = sorted[i + 1]
    const hasTie =
      (i > 0 && curr && prev && curr.totalScore === prev.totalScore) ||
      (i < sorted.length - 1 && curr && next && curr.totalScore === next.totalScore)

    if (curr) {
      sorted[i] = {
        ...curr,
        posDisplay: hasTie ? `T${curr.position}` : String(curr.position),
      }
    }
  }

  return sorted as Player[]
}

// ─── Top-level data transformer ───────────────────────────────────────────────

export function parseTournamentData(data: ESPNResponse): {
  meta: TournamentMeta
  players: Player[]
} | null {
  const event = data.events?.[0]
  if (!event) return null

  const competition = event.competitions?.[0]
  if (!competition) return null

  const { period, type } = competition.status

  const meta: TournamentMeta = {
    name: event.name,
    shortName: event.shortName,
    round: period,
    roundDescription: type.description,
    completed: type.completed ?? false,
  }

  const raw = (competition.competitors ?? []).map((c) => parseCompetitor(c, period))

  const players = applyTiedPositions(raw)

  return { meta, players }
}

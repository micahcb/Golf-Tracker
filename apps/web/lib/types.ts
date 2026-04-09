// ESPN API types
export interface ESPNFlag {
  href: string
  alt: string
  rel: string[]
}

export interface ESPNHoleScore {
  value: number
  displayValue: string
  period: number
  scoreType?: { displayValue: string }
}

export interface ESPNStatCategory {
  stats: Array<{ value?: number; displayValue: string }>
}

export interface ESPNRoundScore {
  value?: number
  displayValue?: string
  period: number
  linescores?: ESPNHoleScore[]
  statistics?: { categories: ESPNStatCategory[] }
}

export interface ESPNCompetitor {
  id: string
  order: number
  athlete: {
    fullName: string
    displayName: string
    shortName: string
    flag: ESPNFlag
  }
  score: string
  linescores: ESPNRoundScore[]
  status?: { type?: { name?: string; description?: string } }
}

export interface ESPNCompetition {
  id: string
  date: string
  status: {
    period: number
    displayClock: string
    type: { name: string; description: string; completed: boolean }
  }
  competitors: ESPNCompetitor[]
}

export interface ESPNEvent {
  id: string
  name: string
  shortName: string
  date: string
  endDate: string
  season: { year: number }
  competitions: ESPNCompetition[]
}

export interface ESPNResponse {
  events: ESPNEvent[]
}

// Parsed/normalised player type used throughout the UI
export type PlayerStatus = 'active' | 'cut' | 'withdrawn' | 'complete'

export interface Round {
  raw: number | null       // stroke total, e.g. 67
  rel: string | null       // relative to par, e.g. "-5"
}

export interface HoleScore {
  hole: number             // hole number 1-18
  strokes: number          // raw strokes taken
  rel: string              // relative to par: "E", "-1", "+1" etc
  type: string             // "BIRDIE", "PAR", "BOGEY", "EAGLE" etc
}

export interface Player {
  id: string
  position: number
  posDisplay: string       // e.g. "T5" or "1"
  name: string
  shortName: string
  country: string
  flagUrl: string
  totalScore: string       // e.g. "-12", "E", "+3"
  totalNum: number         // numeric version for sorting
  rounds: [Round, Round, Round, Round]
  holeScores: HoleScore[]  // holes completed in the active round
  thru: string             // "F", "9", "—"
  teeTime: string          // formatted, e.g. "9:24 AM EDT"
  teeTimeMs: number        // epoch ms for sorting
  status: PlayerStatus
}

export interface TournamentMeta {
  name: string
  shortName: string
  round: number
  roundDescription: string
  completed: boolean
}

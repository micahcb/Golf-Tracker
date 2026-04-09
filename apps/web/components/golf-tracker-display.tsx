'use client'

import { formatScore, scoreToNum } from '@/lib/espn'

// ─── Score colour helper ──────────────────────────────────────────────────────
export function scoreClass(score: string | null | undefined, bold = false): string {
  if (!score || score === 'E') return bold ? 'font-semibold' : 'text-muted-foreground'
  const n = scoreToNum(score)
  const weight = bold ? 'font-semibold' : ''
  if (n < 0) return `${weight} text-green-600 dark:text-green-400`
  if (n > 0) return `${weight} text-red-500 dark:text-red-400`
  return bold ? 'font-semibold' : ''
}

// ─── Score display ────────────────────────────────────────────────────────────
export function Score({
  score,
  bold = false,
  size = 'sm',
}: {
  score: string | null | undefined
  bold?: boolean
  size?: 'sm' | 'base' | 'lg'
}) {
  if (!score) return <span className="text-muted-foreground">—</span>
  const sizeClass = size === 'lg' ? 'text-lg' : size === 'base' ? 'text-base' : 'text-sm'
  return (
    <span className={`${sizeClass} ${scoreClass(score, bold)}`}>{formatScore(score)}</span>
  )
}

// ─── Flag image ───────────────────────────────────────────────────────────────
export function Flag({ url, country }: { url: string; country: string }) {
  if (!url) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={country}
      title={country}
      className="w-5 h-[14px] object-cover rounded-[2px] flex-shrink-0 shadow-sm"
    />
  )
}

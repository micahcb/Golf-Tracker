'use client'

export function MovementBadge({ delta }: { delta?: number }) {
  if (!delta) return null
  return delta > 0 ? (
    <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 leading-none">
      ↑{delta}
    </span>
  ) : (
    <span className="text-[10px] font-semibold text-red-500 dark:text-red-400 leading-none">
      ↓{Math.abs(delta)}
    </span>
  )
}

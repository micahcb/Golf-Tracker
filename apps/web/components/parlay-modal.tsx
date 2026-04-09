'use client'

import { useMemo, useState, useCallback } from 'react'
import type { Player } from '@/lib/types'
import type { ParlaySaved } from '@/components/pairing-picks'
import { parsePairingPickKey, PARLAY_PALETTE } from '@/components/pairing-picks'

function firstConflictingLeg(
  legs: string[],
  parlays: ParlaySaved[],
  editingId: string | null
): string | null {
  for (const k of legs) {
    for (const pl of parlays) {
      if (pl.id === editingId) continue
      if (pl.legs.includes(k)) return k
    }
  }
  return null
}

export function ParlayLegsModal({
  open,
  onClose,
  anchorPickKey,
  pairingPickKeys,
  parlays,
  allPlayers,
  editingParlayId,
  onSave,
  onDeleteParlay,
}: {
  open: boolean
  onClose: () => void
  anchorPickKey: string
  pairingPickKeys: Set<string>
  parlays: ParlaySaved[]
  allPlayers: Player[]
  editingParlayId: string | null
  onSave: (editingId: string | null, legs: string[]) => void
  onDeleteParlay: (id: string) => void
}) {
  const [selected, setSelected] = useState<Set<string>>(() => {
    const ed = editingParlayId ? parlays.find((p) => p.id === editingParlayId) : undefined
    return ed ? new Set(ed.legs) : new Set([anchorPickKey])
  })

  const nameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const p of allPlayers) m.set(p.id, p.name)
    return m
  }, [allPlayers])

  const pickOptions = useMemo(() => [...pairingPickKeys].sort(), [pairingPickKeys])

  const editing = editingParlayId
    ? parlays.find((p) => p.id === editingParlayId)
    : undefined
  const colorIndex = editing?.colorIndex ?? parlays.length % PARLAY_PALETTE.length
  const palette = PARLAY_PALETTE[colorIndex % PARLAY_PALETTE.length]!

  const toggle = useCallback((key: string) => {
    if (key === anchorPickKey) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [anchorPickKey])

  const selectedArr = [...selected]
  const canSave =
    selected.size >= 2 && selectedArr.every((k) => pairingPickKeys.has(k))

  const conflictingLeg = canSave
    ? firstConflictingLeg(selectedArr, parlays, editingParlayId)
    : null

  const parsedConflict = conflictingLeg ? parsePairingPickKey(conflictingLeg) : null
  const conflictName = parsedConflict
    ? nameById.get(parsedConflict.playerId) ?? conflictingLeg
    : conflictingLeg

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="parlay-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-background shadow-lg max-h-[85vh] flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={`h-1.5 rounded-t-xl shrink-0 ${palette.stripe}`} aria-hidden />
        <div className="p-4 border-b border-border">
          <h2 id="parlay-modal-title" className="text-base font-semibold text-foreground">
            {editing ? 'Edit parlay' : 'Build parlay'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {editing
              ? 'Add or remove legs. This parlay keeps its color.'
              : 'You started from this pick. Select at least one other pairing pick (✦) to finish.'}
          </p>
          <p className={`text-xs font-medium mt-2 ${palette.text}`}>
            Color: {palette.name}
          </p>
          {conflictingLeg && (
            <p className="text-sm text-destructive mt-2">
              {conflictName
                ? `${conflictName} is already in another parlay. Remove them there first or pick someone else.`
                : 'One of these picks is already in another parlay.'}
            </p>
          )}
        </div>

        <div className="p-4 overflow-y-auto flex-1 min-h-0 space-y-2">
          {pickOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pairing picks yet. Use ✦ on players first.</p>
          ) : (
            pickOptions.map((key) => {
              const parsed = parsePairingPickKey(key)
              const name = parsed ? nameById.get(parsed.playerId) ?? parsed.playerId : key
              const isAnchor = key === anchorPickKey
              const on = selected.has(key)
              return (
                <label
                  key={key}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                    on
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border hover:bg-muted/40'
                  } ${isAnchor ? 'ring-1 ring-primary/30' : ''}`}
                >
                  <input
                    type="checkbox"
                    className="rounded border-input"
                    checked={on}
                    disabled={isAnchor}
                    onChange={() => toggle(key)}
                  />
                  <span className="text-sm flex-1 min-w-0 truncate">
                    {name}
                    {isAnchor && (
                      <span className="text-muted-foreground font-normal"> · starting leg</span>
                    )}
                  </span>
                </label>
              )
            })
          )}
        </div>

        <div className="p-4 border-t border-border flex flex-wrap gap-2 justify-end">
          {editing && (
            <button
              type="button"
              className="px-3 py-2 text-sm font-medium rounded-lg border border-destructive/50 text-destructive hover:bg-destructive/10 mr-auto"
              onClick={() => {
                onDeleteParlay(editing.id)
                onClose()
              }}
            >
              Delete parlay
            </button>
          )}
          <button
            type="button"
            className="px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave || !!conflictingLeg}
            className="px-3 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none"
            onClick={() => {
              const legs = [...selected]
              if (firstConflictingLeg(legs, parlays, editingParlayId)) return
              onSave(editingParlayId, legs)
              onClose()
            }}
          >
            Save parlay
          </button>
        </div>
      </div>
    </div>
  )
}

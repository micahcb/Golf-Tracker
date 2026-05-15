import { NextResponse } from "next/server"

import { runBootstrap } from "@/lib/db/run-bootstrap"

/** Runs idempotent DDL for `golf_tracker_preferences` (requires server `DATABASE_URL`). */
export async function POST() {
  const result = await runBootstrap()
  if (result.ok) {
    return NextResponse.json({ ok: true })
  }
  if ("skipped" in result && result.skipped) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 503 }
    )
  }
  const failure = result as { error: string; hint?: string; dbHost?: string }
  return NextResponse.json(
    {
      ok: false,
      error: failure.error,
      ...(failure.hint ? { hint: failure.hint } : {}),
      ...(failure.dbHost ? { dbHost: failure.dbHost } : {}),
    },
    { status: 500 }
  )
}

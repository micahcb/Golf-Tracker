/**
 * Calls the server route that runs CREATE TABLE IF NOT EXISTS + RLS (requires DATABASE_URL).
 * Dedupes concurrent in-flight requests.
 */
let ensureChain: Promise<boolean> | null = null

export function ensureGolfTrackerTable(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false)
  if (!ensureChain) {
    ensureChain = fetch("/api/golf-tracker/ensure-schema", {
      method: "POST",
      credentials: "same-origin",
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as { ok?: boolean }
        return res.ok && Boolean(body.ok)
      })
      .catch(() => false)
      .finally(() => {
        ensureChain = null
      })
  }
  return ensureChain
}
